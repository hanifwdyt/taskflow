import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { tasks, projects, taskLabels, labels, subtasks } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AppEnv } from '../types';

const router = new Hono<AppEnv>();

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (s: string) => uuidRegex.test(s);
const isValidDate = (s: string) => !isNaN(new Date(s).getTime());

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  effort: z.number().int().min(1).max(21).optional().nullable(),
  columnId: z.string().uuid().optional(),
  boardId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  dueDate: z.string().refine(v => !v || isValidDate(v), 'Invalid date').optional().nullable(),
  labelIds: z.array(z.string().uuid()).optional(),
});

router.use('*', requireAuth);

router.get('/', async (c) => {
  const user = c.get('user');
  const projectId = c.req.query('projectId');
  let userTasks = await db.select().from(tasks).where(eq(tasks.userId, user.id));
  if (projectId) {
    userTasks = userTasks.filter(t => t.projectId === projectId);
  }
  return c.json({ data: userTasks });
});

router.post('/', zValidator('json', taskSchema), async (c) => {
  const user = c.get('user');
  const { labelIds, dueDate, ...body } = c.req.valid('json');

  if (body.projectId) {
    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, body.projectId), eq(projects.userId, user.id)));
    if (!project) return c.json({ error: 'Project not found' }, 403);
  }

  // Validate label ownership
  if (labelIds?.length) {
    const userLabels = await db.select({ id: labels.id }).from(labels)
      .where(and(eq(labels.userId, user.id), inArray(labels.id, labelIds)));
    if (userLabels.length !== labelIds.length) {
      return c.json({ error: 'Invalid labels' }, 400);
    }
  }

  const [task] = await db.insert(tasks).values({
    ...body,
    userId: user.id,
    status: body.status || 'todo',
    priority: body.priority || 'medium',
    dueDate: dueDate ? new Date(dueDate) : null,
  }).returning();

  if (!task) return c.json({ error: 'Failed to create task' }, 500);

  if (labelIds?.length) {
    await db.insert(taskLabels).values(
      labelIds.map(labelId => ({ taskId: task.id, labelId }))
    );
  }

  return c.json({ data: task }, 201);
});

router.patch('/:id', zValidator('json', taskSchema.partial()), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  if (!isUUID(id)) return c.json({ error: 'Invalid ID' }, 400);
  const { labelIds, dueDate, ...body } = c.req.valid('json');

  const [task] = await db.update(tasks)
    .set({
      ...body,
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .returning();
  if (!task) return c.json({ error: 'Not found' }, 404);

  if (labelIds !== undefined) {
    // Validate label ownership
    if (labelIds.length) {
      const userLabels = await db.select({ id: labels.id }).from(labels)
        .where(and(eq(labels.userId, user.id), inArray(labels.id, labelIds)));
      if (userLabels.length !== labelIds.length) {
        return c.json({ error: 'Invalid labels' }, 400);
      }
    }
    await db.delete(taskLabels).where(eq(taskLabels.taskId, id));
    if (labelIds.length) {
      await db.insert(taskLabels).values(
        labelIds.map(labelId => ({ taskId: id, labelId }))
      );
    }
  }

  const taskLabelRows = await db.select().from(taskLabels).where(eq(taskLabels.taskId, id));
  const taskLabelList = taskLabelRows.length > 0
    ? await db.select().from(labels).where(eq(labels.userId, user.id))
        .then(all => all.filter(l => taskLabelRows.some(tl => tl.labelId === l.id)))
    : [];
  const taskSubtasks = await db.select().from(subtasks).where(eq(subtasks.taskId, id));

  return c.json({
    data: { ...task, labels: taskLabelList, subtasks: taskSubtasks },
  });
});

router.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  if (!isUUID(id)) return c.json({ error: 'Invalid ID' }, 400);
  const deleted = await db.delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .returning();
  if (!deleted.length) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: { success: true } });
});

export default router;
