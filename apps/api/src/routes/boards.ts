import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { boards, columns, tasks } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AppEnv } from '../types';

const router = new Hono<AppEnv>();
router.use('*', requireAuth);

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (s: string) => uuidRegex.test(s);

router.get('/', async (c) => {
  const user = c.get('user');
  const userBoards = await db.select().from(boards).where(eq(boards.userId, user.id));
  return c.json({ data: userBoards });
});

router.post('/', zValidator('json', z.object({ title: z.string().min(1) })), async (c) => {
  const user = c.get('user');
  const { title } = c.req.valid('json');
  const [board] = await db.insert(boards).values({ title, userId: user.id }).returning();
  await db.insert(columns).values([
    { title: 'To Do', boardId: board.id, position: 0 },
    { title: 'In Progress', boardId: board.id, position: 1 },
    { title: 'Done', boardId: board.id, position: 2 },
  ]);
  return c.json({ data: board }, 201);
});

router.get('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  if (!isUUID(id)) return c.json({ error: 'Invalid ID' }, 400);
  const [board] = await db.select().from(boards).where(and(eq(boards.id, id), eq(boards.userId, user.id)));
  if (!board) return c.json({ error: 'Not found' }, 404);
  const boardColumns = await db.select().from(columns).where(eq(columns.boardId, id));
  const boardTasks = await db.select().from(tasks).where(eq(tasks.boardId, id));
  const columnsWithTasks = boardColumns.map(col => ({
    ...col,
    tasks: boardTasks.filter(t => t.columnId === col.id).sort((a, b) => a.position - b.position),
  }));
  return c.json({ data: { ...board, columns: columnsWithTasks } });
});

router.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  if (!isUUID(id)) return c.json({ error: 'Invalid ID' }, 400);
  const deleted = await db.delete(boards)
    .where(and(eq(boards.id, id), eq(boards.userId, user.id)))
    .returning();
  if (!deleted.length) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: { success: true } });
});

export default router;
