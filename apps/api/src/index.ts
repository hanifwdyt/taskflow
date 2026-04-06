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
app.get('/health', (c) => c.json({ status: 'ok' }));

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: '../web/dist' }));
  app.get('*', serveStatic({ root: '../web/dist', path: 'index.html' }));
}

const port = parseInt(process.env.PORT || '3001');
serve({ fetch: app.fetch, port }, () => {
  console.log(`API running on http://localhost:${port}`);
});
