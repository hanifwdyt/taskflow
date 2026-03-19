import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { tasks } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';

const router = new Hono();
const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  columnId: z.string().uuid().optional(),
  boardId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
});

router.use('*', requireAuth);

router.get('/', async (c) => {
  const user = c.get('user');
  const userTasks = await db.select().from(tasks).where(eq(tasks.userId, user.id));
  return c.json({ data: userTasks });
});

router.post('/', zValidator('json', taskSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');
  const [task] = await db.insert(tasks).values({
    ...body,
    userId: user.id,
    status: body.status || 'todo',
    priority: body.priority || 'medium',
  }).returning();
  return c.json({ data: task }, 201);
});

router.patch('/:id', zValidator('json', taskSchema.partial()), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const [task] = await db.update(tasks)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .returning();
  if (!task) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: task });
});

router.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, user.id)));
  return c.json({ data: { success: true } });
});

export default router;
