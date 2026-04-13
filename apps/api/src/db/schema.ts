import { pgTable, text, timestamp, integer, uuid, boolean, primaryKey } from 'drizzle-orm/pg-core';

// ── Auth tables (managed by better-auth) ─────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Legacy boards (kept for migration, deprecated) ───────────────

export const boards = pgTable('boards', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Projects ─────────────────────────────────────────────────────

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  color: text('color').notNull().default('#3B82F6'),
  icon: text('icon'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Columns (user-scoped, not board-scoped) ──────────────────────

export const columns = pgTable('columns', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  boardId: uuid('board_id').references(() => boards.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Labels ───────────────────────────────────────────────────────

export const labels = pgTable('labels', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6366F1'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Tasks ────────────────────────────────────────────────────────

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('todo'),
  priority: text('priority').notNull().default('medium'),
  effort: integer('effort'),
  columnId: uuid('column_id').references(() => columns.id, { onDelete: 'set null' }),
  boardId: uuid('board_id').references(() => boards.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Task ↔ Label junction ────────────────────────────────────────

export const taskLabels = pgTable('task_labels', {
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  labelId: uuid('label_id').notNull().references(() => labels.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.taskId, t.labelId] }),
}));

// ── API Tokens (untuk integrasi Punakawan AI) ────────────────────

export const apiTokens = pgTable('api_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: text('token').notNull().unique(),
  name: text('name').notNull().default('Punakawan AI'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
});

// ── Subtasks ─────────────────────────────────────────────────────

export const subtasks = pgTable('subtasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  completed: boolean('completed').default(false),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
