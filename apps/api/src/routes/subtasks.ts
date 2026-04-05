import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { subtasks, tasks } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AppEnv } from '../types';

const router = new Hono<AppEnv>();
router.use('*', requireAuth);

// POST /api/tasks/:taskId/subtasks
router.post('/tasks/:taskId/subtasks', zValidator('json', z.object({ title: z.string().min(1) })), async (c) => {
  const user = c.get('user');
  const taskId = c.req.param('taskId');

  const [task] = await db.select().from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)));
  if (!task) return c.json({ error: 'Task not found' }, 404);

  const existing = await db.select().from(subtasks).where(eq(subtasks.taskId, taskId));

  const [subtask] = await db.insert(subtasks).values({
    title: c.req.valid('json').title,
    taskId,
    position: existing.length,
  }).returning();
  return c.json({ data: subtask }, 201);
});

// PATCH /api/subtasks/:id
router.patch('/subtasks/:id', zValidator('json', z.object({
  title: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  position: z.number().int().optional(),
}).refine(obj => Object.keys(obj).length > 0)), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = c.req.valid('json');

  // Verify ownership through task
  const [existing] = await db.select({ userId: tasks.userId })
    .from(subtasks)
    .innerJoin(tasks, eq(subtasks.taskId, tasks.id))
    .where(eq(subtasks.id, id));
  if (!existing || existing.userId !== user.id) return c.json({ error: 'Not found' }, 404);

  const [updated] = await db.update(subtasks).set(body).where(eq(subtasks.id, id)).returning();
  return c.json({ data: updated });
});

// DELETE /api/subtasks/:id
router.delete('/subtasks/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const [existing] = await db.select({ userId: tasks.userId })
    .from(subtasks)
    .innerJoin(tasks, eq(subtasks.taskId, tasks.id))
    .where(eq(subtasks.id, id));
  if (!existing || existing.userId !== user.id) return c.json({ error: 'Not found' }, 404);

  await db.delete(subtasks).where(eq(subtasks.id, id));
  return c.json({ data: { success: true } });
});

export default router;
