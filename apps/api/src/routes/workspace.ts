import { Hono } from 'hono';
import { db } from '../db';
import { columns, tasks, labels, taskLabels, subtasks, projects } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AppEnv } from '../types';

const router = new Hono<AppEnv>();
router.use('*', requireAuth);

router.get('/', async (c) => {
  const user = c.get('user');
  const projectId = c.req.query('projectId');

  // Get user's columns
  let userColumns = await db.select().from(columns)
    .where(eq(columns.userId, user.id))
    .orderBy(columns.position);

  // If no columns exist, create defaults
  if (userColumns.length === 0) {
    const defaults = [
      { title: 'To Do', userId: user.id, position: 0 },
      { title: 'In Progress', userId: user.id, position: 1 },
      { title: 'Done', userId: user.id, position: 2 },
    ];
    userColumns = await db.insert(columns).values(defaults).returning();
  }

  // Get tasks (optionally filtered by project)
  let taskQuery = db.select().from(tasks).where(eq(tasks.userId, user.id));
  const allTasks = await taskQuery;
  const filteredTasks = projectId
    ? allTasks.filter(t => t.projectId === projectId)
    : allTasks;

  // Get all labels for the user
  const userLabels = await db.select().from(labels).where(eq(labels.userId, user.id));

  // Get task-label associations
  const allTaskLabels = await db.select().from(taskLabels);

  // Get subtasks for user's tasks
  const taskIds = new Set(allTasks.map(t => t.id));
  const allSubtasksRaw = taskIds.size > 0
    ? await db.select().from(subtasks)
    : [];
  const userSubtasks = allSubtasksRaw.filter(s => taskIds.has(s.taskId));

  // Get user projects
  const userProjects = await db.select().from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(projects.position);

  // Assemble tasks with labels and subtasks
  const enrichedTasks = filteredTasks.map(task => ({
    ...task,
    labels: allTaskLabels
      .filter(tl => tl.taskId === task.id)
      .map(tl => userLabels.find(l => l.id === tl.labelId))
      .filter(Boolean),
    subtasks: userSubtasks
      .filter(s => s.taskId === task.id)
      .sort((a, b) => a.position - b.position),
    project: userProjects.find(p => p.id === task.projectId) || null,
  }));

  // Assemble columns with tasks
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

export default router;
