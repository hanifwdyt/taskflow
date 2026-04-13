/**
 * Agent API — internal endpoint untuk Punakawan AI
 * Auth: Authorization: Bearer <api_token> (token dari tabel api_tokens)
 */
import { Hono } from 'hono';
import { db } from '../db';
import { tasks, projects, apiTokens } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';

const router = new Hono();

// Middleware: validate Bearer token & resolve user
router.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.slice(7);

  const [row] = await db.select().from(apiTokens).where(eq(apiTokens.token, token)).limit(1);
  if (!row) return c.json({ error: 'Invalid token' }, 401);

  // Update last_used_at (fire and forget)
  db.update(apiTokens).set({ lastUsedAt: new Date() }).where(eq(apiTokens.id, row.id)).catch(() => {});

  c.set('userId' as any, row.userId);
  await next();
});

// GET /api/agent/tasks — list tasks
router.get('/tasks', async (c) => {
  const userId = c.get('userId' as any) as string;
  const statusFilter = c.req.query('status');
  const projectId = c.req.query('projectId');

  let allTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      projectId: tasks.projectId,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(desc(tasks.createdAt));

  if (statusFilter) allTasks = allTasks.filter(t => t.status === statusFilter);
  if (projectId) allTasks = allTasks.filter(t => t.projectId === projectId);

  return c.json({ data: allTasks, total: allTasks.length });
});

// GET /api/agent/projects — list projects
router.get('/projects', async (c) => {
  const userId = c.get('userId' as any) as string;
  const allProjects = await db
    .select({ id: projects.id, title: projects.title, color: projects.color })
    .from(projects)
    .where(eq(projects.userId, userId));
  return c.json({ data: allProjects });
});

// POST /api/agent/tasks — create task
router.post('/tasks', async (c) => {
  const userId = c.get('userId' as any) as string;
  const body = await c.req.json() as {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    projectId?: string;
    dueDate?: string;
  };

  if (!body.title?.trim()) return c.json({ error: 'Title required' }, 400);

  const [task] = await db.insert(tasks).values({
    title: body.title.trim(),
    description: body.description || null,
    status: (body.status as any) || 'todo',
    priority: (body.priority as any) || 'medium',
    projectId: body.projectId || null,
    userId,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
  }).returning();

  return c.json({ data: task }, 201);
});

// PATCH /api/agent/tasks/:id — update task
router.patch('/tasks/:id', async (c) => {
  const userId = c.get('userId' as any) as string;
  const id = c.req.param('id');
  const body = await c.req.json() as { status?: string; priority?: string; title?: string };

  const [task] = await db
    .update(tasks)
    .set({
      ...(body.status && { status: body.status as any }),
      ...(body.priority && { priority: body.priority as any }),
      ...(body.title && { title: body.title }),
    })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning();

  if (!task) return c.json({ error: 'Task not found' }, 404);
  return c.json({ data: task });
});

export default router;
