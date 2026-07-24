import { pgTable, uuid, text, timestamp, boolean, jsonb, integer, doublePrecision, real } from 'drizzle-orm/pg-core';

export const roleEnum = ['admin', 'editor', 'viewer'] as const;
export const datasourceTypeEnum = ['postgresql', 'mysql', 'bigquery', 'sqlite'] as const;
export const alertOpEnum = ['greater', 'less', 'equals'] as const;
export const alertStateEnum = ['ok', 'triggered', 'unknown'] as const;

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: roleEnum }).notNull().default('viewer'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const datasources = pgTable('datasources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type', { enum: datasourceTypeEnum }).notNull(),
  connectionOptionsEncrypted: text('connection_options_encrypted').notNull(),
  readOnly: boolean('read_only').notNull().default(false),
  maxConcurrentQueries: integer('max_concurrent_queries').notNull().default(10),
  queryTimeoutSeconds: integer('query_timeout_seconds').notNull().default(300),
  maxConnectionPoolSize: integer('max_connection_pool_size').notNull().default(20),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const queries = pgTable('queries', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  sqlText: text('sql_text').notNull().default(''),
  datasourceId: uuid('datasource_id').references(() => datasources.id),
  schedule: jsonb('schedule').$type<{ cron?: string; enabled: boolean }>(),
  options: jsonb('options').$type<Record<string, unknown>>(),
  folder: text('folder'),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  isFavorite: boolean('is_favorite').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(false),
  isArchived: boolean('is_archived').notNull().default(false),
  createdBy: uuid('created_by').references(() => users.id),
  latestResultId: uuid('latest_result_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const queryVersions = pgTable('query_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  queryId: uuid('query_id')
    .notNull()
    .references(() => queries.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sqlText: text('sql_text').notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const queryResults = pgTable('query_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  queryId: uuid('query_id')
    .notNull()
    .references(() => queries.id, { onDelete: 'cascade' }),
  data: jsonb('data').$type<{ columns: Array<{ name: string; type: string }>; rows: Array<Record<string, unknown>> }>().notNull(),
  runtimeSeconds: doublePrecision('runtime_seconds').notNull(),
  retrievedAt: timestamp('retrieved_at').notNull().defaultNow(),
});

export const visualizations = pgTable('visualizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  queryId: uuid('query_id')
    .notNull()
    .references(() => queries.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  options: jsonb('options').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const dashboards = pgTable('dashboards', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  isPublished: boolean('is_published').notNull().default(false),
  isArchived: boolean('is_archived').notNull().default(false),
  dashboardFilters: jsonb('dashboard_filters').$type<unknown[]>().notNull().default([]),
  layout: jsonb('layout').$type<Record<string, unknown>>().notNull().default({}),
  refreshInterval: integer('refresh_interval'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const widgets = pgTable('widgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  dashboardId: uuid('dashboard_id')
    .notNull()
    .references(() => dashboards.id, { onDelete: 'cascade' }),
  visualizationId: uuid('visualization_id').references(() => visualizations.id, { onDelete: 'cascade' }),
  text: text('text'),
  options: jsonb('options').$type<Record<string, unknown>>().notNull().default({}),
  width: integer('width'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  queryId: uuid('query_id')
    .notNull()
    .references(() => queries.id, { onDelete: 'cascade' }),
  column: text('column').notNull(),
  op: text('op', { enum: alertOpEnum }).notNull(),
  value: real('value').notNull(),
  state: text('state', { enum: alertStateEnum }).notNull().default('unknown'),
  schedule: jsonb('schedule').$type<{ enabled: boolean; intervalMinutes?: number }>(),
  lastCheckedAt: timestamp('last_checked_at'),
  lastValue: real('last_value'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
