import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from '@hono/node-server/serve-static';
import { auth } from './lib/auth';
import taskRoutes from './routes/tasks';
import boardRoutes from './routes/boards';
import projectRoutes from './routes/projects';
import labelRoutes from './routes/labels';
import subtaskRoutes from './routes/subtasks';
import workspaceRoutes from './routes/workspace';
import agentRoutes from './routes/agent';

const app = new Hono();
app.use('*', logger());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.on(['GET', 'POST'], '/api/auth/**', (c) => auth.handler(c.req.raw));
app.route('/api/tasks', taskRoutes);
app.route('/api/boards', boardRoutes);
app.route('/api/projects', projectRoutes);
app.route('/api/labels', labelRoutes);
app.route('/api', subtaskRoutes);
app.route('/api/workspace', workspaceRoutes);
app.route('/api/agent', agentRoutes);
app.get('/health', (c) => c.json({ status: 'ok' }));

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: '../web/dist' }));
  app.get('*', serveStatic({ root: '../web/dist', path: 'index.html' }));
}

// Auto-create tables on startup
import { sql } from 'drizzle-orm';
import { db } from './db';

async function start() {
  // Push schema — create tables if they don't exist
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN DEFAULT false,
      image TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      expires_at TIMESTAMP NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at TIMESTAMP,
      refresh_token_expires_at TIMESTAMP,
      scope TEXT,
      password TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS verifications (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS projects (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#3B82F6',
      icon TEXT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS boards (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS columns (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS labels (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366F1',
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS tasks (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      effort INTEGER,
      column_id UUID REFERENCES columns(id) ON DELETE SET NULL,
      board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
      project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      position INTEGER NOT NULL DEFAULT 0,
      due_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS task_labels (
      task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
      PRIMARY KEY (task_id, label_id)
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS subtasks (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT false,
      task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS api_tokens (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT 'Punakawan AI',
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      last_used_at TIMESTAMP
    )`);
    console.log('Database schema ready');
  } catch (e) {
    console.error('Schema init error:', e);
  }

  const port = parseInt(process.env.PORT || '3001');
  serve({ fetch: app.fetch, port }, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}

start();
