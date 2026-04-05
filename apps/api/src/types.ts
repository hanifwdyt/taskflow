import type { Hono } from 'hono';

export type AppVariables = {
  user: { id: string; name: string; email: string; image?: string | null };
  session: { id: string; token: string; userId: string };
};

export type AppEnv = { Variables: AppVariables };
