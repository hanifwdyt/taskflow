import 'dotenv/config';
import { db } from './db';
import { users, columns, tasks, projects, labels, subtasks, taskLabels } from './db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const API = process.env.BETTER_AUTH_URL || 'http://localhost:3001';

async function seed() {
  console.log('Seeding demo data...');

  // 1. Create user via HTTP (so better-auth handles hashing correctly)
  const signupRes = await fetch(`${API}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': API,
    },
    body: JSON.stringify({ email: 'demo@taskflow.app', password: 'demo123456', name: 'Demo User' }),
  });

  if (!signupRes.ok) {
    const err = await signupRes.json().catch(() => ({})) as any;
    if (err?.code !== 'USER_ALREADY_EXISTS' && err?.code !== 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
      console.error('Signup failed:', err);
      process.exit(1);
    }
    console.log('User exists, continuing...');
  }

  // 2. Get user from DB
  const [user] = await db.select().from(users).where(eq(users.email, 'demo@taskflow.app'));
  if (!user) { console.error('User not found in DB'); process.exit(1); }

  const userId = user.id;
  const now = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  const nextWeek = new Date(Date.now() + 7 * 86400000);
  const yesterday = new Date(Date.now() - 86400000);

  // 3. Clear existing data
  await db.delete(tasks).where(eq(tasks.userId, userId));
  await db.delete(columns).where(eq(columns.userId, userId));
  await db.delete(projects).where(eq(projects.userId, userId));
  await db.delete(labels).where(eq(labels.userId, userId));

  // 4. Create projects
  const [p1, p2, p3] = [randomUUID(), randomUUID(), randomUUID()];
  await db.insert(projects).values([
    { id: p1, title: 'TaskFlow App', color: '#06B6D4', icon: '🚀', userId, position: 0, createdAt: now, updatedAt: now },
    { id: p2, title: 'Personal Website', color: '#8B5CF6', icon: '🌐', userId, position: 1, createdAt: now, updatedAt: now },
    { id: p3, title: 'Side Hustle', color: '#22C55E', icon: '💰', userId, position: 2, createdAt: now, updatedAt: now },
  ]);

  // 5. Create columns (user-scoped)
  const [c1, c2, c3] = [randomUUID(), randomUUID(), randomUUID()];
  await db.insert(columns).values([
    { id: c1, title: 'To Do', userId, position: 0, createdAt: now },
    { id: c2, title: 'In Progress', userId, position: 1, createdAt: now },
    { id: c3, title: 'Done', userId, position: 2, createdAt: now },
  ]);

  // 6. Create labels
  const [l1, l2, l3, l4] = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
  await db.insert(labels).values([
    { id: l1, name: 'Bug', color: '#EF4444', userId, createdAt: now },
    { id: l2, name: 'Feature', color: '#3B82F6', userId, createdAt: now },
    { id: l3, name: 'Design', color: '#EC4899', userId, createdAt: now },
    { id: l4, name: 'Research', color: '#EAB308', userId, createdAt: now },
  ]);

  // 7. Create tasks
  const t = Array.from({ length: 12 }, () => randomUUID());
  await db.insert(tasks).values([
    // TaskFlow App tasks
    { id: t[0], title: 'Multi-project filter system', description: 'Add sidebar with project filter like Jira user filter', status: 'done', priority: 'high', effort: 8, columnId: c3, projectId: p1, userId, position: 0, createdAt: now, updatedAt: now },
    { id: t[1], title: 'Task detail slide-in panel', description: 'Click task to open detail panel from the right. Edit all fields inline.', status: 'in_progress', priority: 'high', effort: 13, columnId: c2, projectId: p1, userId, position: 0, dueDate: tomorrow, createdAt: now, updatedAt: now },
    { id: t[2], title: 'Fix drag & drop rollback', status: 'in_progress', priority: 'medium', effort: 3, columnId: c2, projectId: p1, userId, position: 1, createdAt: now, updatedAt: now },
    { id: t[3], title: 'AI chatbot assistant', description: 'Integrate Claude API for task suggestions', status: 'todo', priority: 'low', effort: 13, columnId: c1, projectId: p1, userId, position: 0, dueDate: nextWeek, createdAt: now, updatedAt: now },
    { id: t[4], title: 'PWA offline support', status: 'todo', priority: 'medium', effort: 5, columnId: c1, projectId: p1, userId, position: 1, createdAt: now, updatedAt: now },

    // Personal Website tasks
    { id: t[5], title: 'Redesign landing page', description: 'Modern glassmorphism design with dark theme', status: 'todo', priority: 'high', effort: 8, columnId: c1, projectId: p2, userId, position: 2, createdAt: now, updatedAt: now },
    { id: t[6], title: 'Add blog section', status: 'in_progress', priority: 'medium', effort: 5, columnId: c2, projectId: p2, userId, position: 2, createdAt: now, updatedAt: now },
    { id: t[7], title: 'Setup analytics', status: 'done', priority: 'low', effort: 2, columnId: c3, projectId: p2, userId, position: 1, createdAt: now, updatedAt: now },

    // Side Hustle tasks
    { id: t[8], title: 'Research funding rate arb', description: 'Understand delta neutral strategy for crypto', status: 'done', priority: 'high', effort: 3, columnId: c3, projectId: p3, userId, position: 2, createdAt: now, updatedAt: now },
    { id: t[9], title: 'Build trading bot MVP', status: 'todo', priority: 'urgent', effort: 13, columnId: c1, projectId: p3, userId, position: 3, dueDate: yesterday, createdAt: now, updatedAt: now },
    { id: t[10], title: 'Backtest strategy', status: 'todo', priority: 'high', effort: 8, columnId: c1, projectId: p3, userId, position: 4, createdAt: now, updatedAt: now },
    { id: t[11], title: 'Setup exchange API keys', status: 'in_progress', priority: 'medium', effort: 2, columnId: c2, projectId: p3, userId, position: 3, createdAt: now, updatedAt: now },
  ]);

  // 8. Assign labels to tasks
  await db.insert(taskLabels).values([
    { taskId: t[0], labelId: l2 },   // Feature
    { taskId: t[1], labelId: l2 },   // Feature
    { taskId: t[1], labelId: l3 },   // Design
    { taskId: t[2], labelId: l1 },   // Bug
    { taskId: t[3], labelId: l2 },   // Feature
    { taskId: t[3], labelId: l4 },   // Research
    { taskId: t[5], labelId: l3 },   // Design
    { taskId: t[8], labelId: l4 },   // Research
    { taskId: t[9], labelId: l2 },   // Feature
  ]);

  // 9. Create subtasks
  await db.insert(subtasks).values([
    { id: randomUUID(), title: 'Design sidebar mockup', completed: true, taskId: t[0], position: 0, createdAt: now },
    { id: randomUUID(), title: 'Implement project CRUD API', completed: true, taskId: t[0], position: 1, createdAt: now },
    { id: randomUUID(), title: 'Build sidebar component', completed: true, taskId: t[0], position: 2, createdAt: now },
    { id: randomUUID(), title: 'Add filter logic', completed: true, taskId: t[0], position: 3, createdAt: now },

    { id: randomUUID(), title: 'Title inline edit', completed: true, taskId: t[1], position: 0, createdAt: now },
    { id: randomUUID(), title: 'Priority selector', completed: true, taskId: t[1], position: 1, createdAt: now },
    { id: randomUUID(), title: 'Description editor', completed: false, taskId: t[1], position: 2, createdAt: now },
    { id: randomUUID(), title: 'Subtask management', completed: false, taskId: t[1], position: 3, createdAt: now },
    { id: randomUUID(), title: 'Auto-save on change', completed: false, taskId: t[1], position: 4, createdAt: now },

    { id: randomUUID(), title: 'Setup Binance API', completed: true, taskId: t[9], position: 0, createdAt: now },
    { id: randomUUID(), title: 'Implement funding rate monitor', completed: false, taskId: t[9], position: 1, createdAt: now },
    { id: randomUUID(), title: 'Build position manager', completed: false, taskId: t[9], position: 2, createdAt: now },
    { id: randomUUID(), title: 'Add risk management', completed: false, taskId: t[9], position: 3, createdAt: now },
  ]);

  console.log('\n✓ Demo account ready!');
  console.log('  Email    : demo@taskflow.app');
  console.log('  Password : demo123456');
  console.log('  Projects : 3 projects, 12 tasks, 4 labels');
  console.log('  Columns  : To Do, In Progress, Done\n');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
