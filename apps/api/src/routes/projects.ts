import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { projects, tasks } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AppEnv } from '../types';

const router = new Hono<AppEnv>();
router.use('*', requireAuth);

const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const projectSchema = z.object({
  title: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().optional(),
  position: z.number().int().optional(),
});

router.get('/', async (c) => {
  const user = c.get('user');
  const userProjects = await db
    .select({
      id: projects.id,
      title: projects.title,
      color: projects.color,
      icon: projects.icon,
      userId: projects.userId,
      position: projects.position,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      taskCount: sql<number>`(SELECT COUNT(*) FROM tasks WHERE tasks.project_id = ${projects.id})::int`,
    })
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(projects.position);
  return c.json({ data: userProjects });
});

router.post('/', zValidator('json', projectSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');
  const [project] = await db.insert(projects).values({
    ...body,
    userId: user.id,
    position: body.position ?? 0,
  }).returning();
  return c.json({ data: { ...project, taskCount: 0 } }, 201);
});

router.patch('/:id', zValidator('json', projectSchema.partial()), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  if (!isUUID(id)) return c.json({ error: 'Invalid ID' }, 400);
  const body = c.req.valid('json');
  const [project] = await db.update(projects)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
    .returning();
  if (!project) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: project });
});

router.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  if (!isUUID(id)) return c.json({ error: 'Invalid ID' }, 400);
  // Unassign tasks from this project (don't delete them)
  await db.update(tasks)
    .set({ projectId: null, updatedAt: new Date() })
    .where(and(eq(tasks.projectId, id), eq(tasks.userId, user.id)));
  const deleted = await db.delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
    .returning();
  if (!deleted.length) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: { success: true } });
});

export default router;
