import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db';
import { labels, taskLabels } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AppEnv } from '../types';

const router = new Hono<AppEnv>();
router.use('*', requireAuth);

const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const labelSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

router.get('/', async (c) => {
  const user = c.get('user');
  const userLabels = await db.select().from(labels).where(eq(labels.userId, user.id));
  return c.json({ data: userLabels });
});

router.post('/', zValidator('json', labelSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');
  const [label] = await db.insert(labels).values({
    ...body,
    userId: user.id,
  }).returning();
  return c.json({ data: label }, 201);
});

router.patch('/:id', zValidator('json', labelSchema.partial()), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  if (!isUUID(id)) return c.json({ error: 'Invalid ID' }, 400);
  const body = c.req.valid('json');
  const [label] = await db.update(labels)
    .set(body)
    .where(and(eq(labels.id, id), eq(labels.userId, user.id)))
    .returning();
  if (!label) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: label });
});

router.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  if (!isUUID(id)) return c.json({ error: 'Invalid ID' }, 400);
  const deleted = await db.delete(labels)
    .where(and(eq(labels.id, id), eq(labels.userId, user.id)))
    .returning();
  if (!deleted.length) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: { success: true } });
});

export default router;
