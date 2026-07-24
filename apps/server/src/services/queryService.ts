import { eq, desc } from 'drizzle-orm';
import { runQuery } from '@querydash/query-engine';
import type { Query, QueryError, QueryResult, QueryVersion } from '@querydash/types';
import { db, schema } from '../db';
import { getDataSource } from './datasourceService';

function toQuery(row: typeof schema.queries.$inferSelect): Query {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    sqlText: row.sqlText,
    datasourceId: row.datasourceId ?? '',
    schedule: row.schedule ?? undefined,
    options: row.options ?? undefined,
    folder: row.folder ?? undefined,
    tags: row.tags ?? [],
    isFavorite: row.isFavorite,
    isPublished: row.isPublished,
    isArchived: row.isArchived,
    createdBy: row.createdBy ?? '',
    latestResultId: row.latestResultId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toQueryVersion(row: typeof schema.queryVersions.$inferSelect): QueryVersion {
  return {
    id: row.id,
    queryId: row.queryId,
    name: row.name,
    sqlText: row.sqlText,
    createdBy: row.createdBy ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export interface SaveQueryInput {
  name: string;
  description?: string;
  sqlText: string;
  datasourceId: string;
  folder?: string;
  tags?: string[];
  isFavorite?: boolean;
  createdBy?: string;
}

export async function listQueries(): Promise<Query[]> {
  const rows = await db.select().from(schema.queries).where(eq(schema.queries.isArchived, false));
  return rows.map(toQuery);
}

export async function getQuery(id: string): Promise<Query | undefined> {
  const [row] = await db.select().from(schema.queries).where(eq(schema.queries.id, id));
  return row ? toQuery(row) : undefined;
}

export async function createQuery(input: SaveQueryInput): Promise<Query> {
  const [row] = await db
    .insert(schema.queries)
    .values({
      name: input.name,
      description: input.description,
      sqlText: input.sqlText,
      datasourceId: input.datasourceId,
      folder: input.folder,
      tags: input.tags ?? [],
      isFavorite: input.isFavorite ?? false,
      createdBy: input.createdBy,
    })
    .returning();
  return toQuery(row);
}

export async function updateQuery(
  id: string,
  input: Partial<SaveQueryInput>,
  editorUserId?: string
): Promise<Query | undefined> {
  const existing = await getQuery(id);
  if (!existing) return undefined;

  // Snapshot the previous version whenever the SQL text actually changes, so
  // edits can be reverted later. Snapshotting the *old* text (not the new one)
  // keeps each version row representing a state that was once live.
  if (input.sqlText !== undefined && input.sqlText !== existing.sqlText) {
    await db.insert(schema.queryVersions).values({
      queryId: id,
      name: existing.name,
      sqlText: existing.sqlText,
      createdBy: editorUserId,
    });
  }

  const updates: Partial<typeof schema.queries.$inferInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.sqlText !== undefined) updates.sqlText = input.sqlText;
  if (input.datasourceId !== undefined) updates.datasourceId = input.datasourceId;
  if (input.folder !== undefined) updates.folder = input.folder;
  if (input.tags !== undefined) updates.tags = input.tags;
  if (input.isFavorite !== undefined) updates.isFavorite = input.isFavorite;
  const [row] = await db.update(schema.queries).set(updates).where(eq(schema.queries.id, id)).returning();
  return row ? toQuery(row) : undefined;
}

export async function deleteQuery(id: string): Promise<void> {
  await db.delete(schema.queries).where(eq(schema.queries.id, id));
}

export async function listQueryVersions(queryId: string): Promise<QueryVersion[]> {
  const rows = await db
    .select()
    .from(schema.queryVersions)
    .where(eq(schema.queryVersions.queryId, queryId))
    .orderBy(desc(schema.queryVersions.createdAt));
  return rows.map(toQueryVersion);
}

export async function revertQueryToVersion(
  queryId: string,
  versionId: string,
  editorUserId?: string
): Promise<Query | undefined> {
  const [versionRow] = await db
    .select()
    .from(schema.queryVersions)
    .where(eq(schema.queryVersions.id, versionId));
  if (!versionRow || versionRow.queryId !== queryId) return undefined;
  return updateQuery(queryId, { sqlText: versionRow.sqlText }, editorUserId);
}

export interface ExecuteQueryOutcome {
  result?: QueryResult;
  error?: QueryError;
  requiresConfirmation?: boolean;
}

export async function executeQuery(
  queryId: string,
  parameterValues: Record<string, unknown> = {},
  confirmed = false,
  onPid?: (pid: number) => void
): Promise<ExecuteQueryOutcome> {
  const query = await getQuery(queryId);
  if (!query) {
    return { error: { code: 'NOT_FOUND', message: '쿼리를 찾을 수 없습니다.' } };
  }
  const datasource = await getDataSource(query.datasourceId);
  if (!datasource) {
    return { error: { code: 'CONNECTION_ERROR', message: '데이터소스를 찾을 수 없습니다.' } };
  }

  const outcome = await runQuery({ sqlText: query.sqlText, datasource, parameterValues, confirmed, onPid });

  if (outcome.result) {
    const [savedResult] = await db
      .insert(schema.queryResults)
      .values({
        queryId,
        data: { columns: outcome.result.columns, rows: outcome.result.rows },
        runtimeSeconds: outcome.result.runtimeSeconds,
      })
      .returning();

    await db.update(schema.queries).set({ latestResultId: savedResult.id }).where(eq(schema.queries.id, queryId));

    return {
      result: {
        ...outcome.result,
        id: savedResult.id,
        queryId,
        retrievedAt: savedResult.retrievedAt.toISOString(),
      },
    };
  }

  return { error: outcome.error, requiresConfirmation: outcome.requiresConfirmation };
}

export async function getLatestResult(queryId: string): Promise<QueryResult | undefined> {
  const query = await getQuery(queryId);
  if (!query?.latestResultId) return undefined;
  const [row] = await db.select().from(schema.queryResults).where(eq(schema.queryResults.id, query.latestResultId));
  if (!row) return undefined;
  return {
    id: row.id,
    queryId: row.queryId,
    columns: row.data.columns as QueryResult['columns'],
    rows: row.data.rows,
    runtimeSeconds: row.runtimeSeconds,
    retrievedAt: row.retrievedAt.toISOString(),
  };
}
