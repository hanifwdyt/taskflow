import { Hono } from 'hono';
import { randomBytes } from 'crypto';
import { db } from '../db';
import { columns, tasks, labels, taskLabels, subtasks, projects, apiTokens } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AppEnv } from '../types';

const router = new Hono<AppEnv>();
router.use('*', requireAuth);

router.get('/', async (c) => {
  const user = c.get('user');
  const projectId = c.req.query('projectId');

  let userColumns = await db.select().from(columns)
    .where(eq(columns.userId, user.id))
    .orderBy(columns.position);

  if (userColumns.length === 0) {
    userColumns = await db.insert(columns).values([
      { title: 'To Do', userId: user.id, position: 0 },
      { title: 'In Progress', userId: user.id, position: 1 },
      { title: 'Done', userId: user.id, position: 2 },
    ]).returning();
  }

  const allTasks = await db.select().from(tasks).where(eq(tasks.userId, user.id));
  const filteredTasks = projectId
    ? allTasks.filter(t => t.projectId === projectId)
    : allTasks;

  const userLabels = await db.select().from(labels).where(eq(labels.userId, user.id));
  const userProjects = await db.select().from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(projects.position);

  // Only fetch taskLabels and subtasks for THIS user's tasks
  const taskIds = allTasks.map(t => t.id);
  const userTaskLabels = taskIds.length > 0
    ? await db.select().from(taskLabels).where(inArray(taskLabels.taskId, taskIds))
    : [];
  const userSubtasks = taskIds.length > 0
    ? await db.select().from(subtasks).where(inArray(subtasks.taskId, taskIds))
    : [];

  const enrichedTasks = filteredTasks.map(task => ({
    ...task,
    labels: userTaskLabels
      .filter(tl => tl.taskId === task.id)
      .map(tl => userLabels.find(l => l.id === tl.labelId))
      .filter(Boolean),
    subtasks: userSubtasks
      .filter(s => s.taskId === task.id)
      .sort((a, b) => a.position - b.position),
    project: userProjects.find(p => p.id === task.projectId) || null,
  }));

  const columnsWithTasks = userColumns.map(col => ({
    ...col,
    tasks: enrichedTasks
      .filter(t => t.columnId === col.id)
      .sort((a, b) => a.position - b.position),
  }));

  return c.json({
    data: {
      columns: columnsWithTasks,
      projects: userProjects,
      labels: userLabels,
    },
  });
});

// ── API Token management ──────────────────────────────────────────

// GET /api/workspace/tokens — list user's tokens
router.get('/tokens', async (c) => {
  const user = c.get('user');
  const tokens = await db.select({
    id: apiTokens.id,
    name: apiTokens.name,
    token: apiTokens.token,
    createdAt: apiTokens.createdAt,
    lastUsedAt: apiTokens.lastUsedAt,
  }).from(apiTokens).where(eq(apiTokens.userId, user.id));
  return c.json({ data: tokens });
});

// POST /api/workspace/tokens — create new token
router.post('/tokens', async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({})) as { name?: string };
  const token = `tf_${randomBytes(32).toString('hex')}`;
  const [created] = await db.insert(apiTokens).values({
    token,
    name: body.name || 'Punakawan AI',
    userId: user.id,
  }).returning();
  return c.json({ data: created }, 201);
});

// DELETE /api/workspace/tokens/:id — revoke token
router.delete('/tokens/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  await db.delete(apiTokens).where(eq(apiTokens.id, id));
  return c.json({ success: true });
});

export default router;
