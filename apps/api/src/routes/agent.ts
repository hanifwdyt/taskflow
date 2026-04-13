/**
 * Agent API — internal endpoint untuk Punakawan AI
 * Auth: X-Agent-Key header harus match AGENT_SECRET env var
 */
import { Hono } from 'hono';
import { db } from '../db';
import { tasks, projects } from '../db/schema';
import { eq, desc, and, ne } from 'drizzle-orm';
import { users } from '../db/schema';

const router = new Hono();

// Middleware: validate agent key
router.use('*', async (c, next) => {
  const secret = process.env.AGENT_SECRET;
  if (!secret) return c.json({ error: 'Agent API not configured' }, 503);

  const key = c.req.header('X-Agent-Key');
  if (!key || key !== secret) return c.json({ error: 'Unauthorized' }, 401);

  await next();
});

// Helper: get first user (personal app, single user)
async function getFirstUser() {
  const [user] = await db.select().from(users).limit(1);
  return user;
}

// GET /api/agent/tasks — list tasks, optional ?status=todo|in_progress|done
router.get('/tasks', async (c) => {
  const user = await getFirstUser();
  if (!user) return c.json({ error: 'No user found' }, 404);

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
    .where(eq(tasks.userId, user.id))
    .orderBy(desc(tasks.createdAt));

  if (statusFilter) allTasks = allTasks.filter(t => t.status === statusFilter);
  if (projectId) allTasks = allTasks.filter(t => t.projectId === projectId);

  return c.json({ data: allTasks, total: allTasks.length });
});

// GET /api/agent/projects — list all projects
router.get('/projects', async (c) => {
  const user = await getFirstUser();
  if (!user) return c.json({ error: 'No user found' }, 404);

  const allProjects = await db
    .select({ id: projects.id, title: projects.title, color: projects.color })
    .from(projects)
    .where(eq(projects.userId, user.id));

  return c.json({ data: allProjects });
});

// POST /api/agent/tasks — create a task
router.post('/tasks', async (c) => {
  const user = await getFirstUser();
  if (!user) return c.json({ error: 'No user found' }, 404);

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
    userId: user.id,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
  }).returning();

  return c.json({ data: task }, 201);
});

// PATCH /api/agent/tasks/:id — update task status
router.patch('/tasks/:id', async (c) => {
  const user = await getFirstUser();
  if (!user) return c.json({ error: 'No user found' }, 404);

  const id = c.req.param('id');
  const body = await c.req.json() as { status?: string; priority?: string; title?: string };

  const [task] = await db
    .update(tasks)
    .set({
      ...(body.status && { status: body.status as any }),
      ...(body.priority && { priority: body.priority as any }),
      ...(body.title && { title: body.title }),
    })
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .returning();

  if (!task) return c.json({ error: 'Task not found' }, 404);
  return c.json({ data: task });
});

export default router;
