import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { auth } from './lib/auth';
import taskRoutes from './routes/tasks';
import boardRoutes from './routes/boards';

const app = new Hono();
app.use('*', logger());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.on(['GET', 'POST'], '/api/auth/**', (c) => auth.handler(c.req.raw));
app.route('/api/tasks', taskRoutes);
app.route('/api/boards', boardRoutes);
app.get('/health', (c) => c.json({ status: 'ok' }));

serve({ fetch: app.fetch, port: parseInt(process.env.PORT || '3001') }, () => {
  console.log('API running on http://localhost:3001');
});
