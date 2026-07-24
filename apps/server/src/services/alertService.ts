import { eq } from 'drizzle-orm';
import type { Alert, AlertOp, AlertSchedule } from '@querydash/types';
import { db, schema } from '../db';
import { executeQuery, getLatestResult, getQuery } from './queryService';

function toAlert(row: typeof schema.alerts.$inferSelect, queryName?: string): Alert {
  return {
    id: row.id,
    name: row.name,
    queryId: row.queryId,
    queryName,
    column: row.column,
    op: row.op as AlertOp,
    value: row.value,
    state: row.state as Alert['state'],
    schedule: row.schedule ?? undefined,
    lastCheckedAt: row.lastCheckedAt?.toISOString(),
    lastValue: row.lastValue ?? undefined,
    createdBy: row.createdBy ?? '',
    createdAt: row.createdAt.toISOString(),
  };
}

export interface SaveAlertInput {
  name: string;
  queryId: string;
  column: string;
  op: AlertOp;
  value: number;
  schedule?: AlertSchedule;
}

export async function listAlerts(): Promise<Alert[]> {
  const rows = await db
    .select({ alert: schema.alerts, queryName: schema.queries.name })
    .from(schema.alerts)
    .leftJoin(schema.queries, eq(schema.alerts.queryId, schema.queries.id));
  return rows.map(({ alert, queryName }) => toAlert(alert, queryName ?? undefined));
}

export async function getAlert(id: string): Promise<Alert | undefined> {
  const [row] = await db
    .select({ alert: schema.alerts, queryName: schema.queries.name })
    .from(schema.alerts)
    .leftJoin(schema.queries, eq(schema.alerts.queryId, schema.queries.id))
    .where(eq(schema.alerts.id, id));
  return row ? toAlert(row.alert, row.queryName ?? undefined) : undefined;
}

export async function createAlert(input: SaveAlertInput, createdBy?: string): Promise<Alert> {
  const [row] = await db
    .insert(schema.alerts)
    .values({
      name: input.name,
      queryId: input.queryId,
      column: input.column,
      op: input.op,
      value: input.value,
      schedule: input.schedule,
      createdBy,
    })
    .returning();
  return toAlert(row);
}

export async function updateAlert(id: string, input: Partial<SaveAlertInput>): Promise<Alert | undefined> {
  const updates: Partial<typeof schema.alerts.$inferInsert> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.queryId !== undefined) updates.queryId = input.queryId;
  if (input.column !== undefined) updates.column = input.column;
  if (input.op !== undefined) updates.op = input.op;
  if (input.value !== undefined) updates.value = input.value;
  if (input.schedule !== undefined) updates.schedule = input.schedule;
  const [row] = await db.update(schema.alerts).set(updates).where(eq(schema.alerts.id, id)).returning();
  return row ? getAlert(row.id) : undefined;
}

export async function deleteAlert(id: string): Promise<void> {
  await db.delete(schema.alerts).where(eq(schema.alerts.id, id));
}

function compare(op: AlertOp, actual: number, threshold: number): boolean {
  if (op === 'greater') return actual > threshold;
  if (op === 'less') return actual < threshold;
  return actual === threshold;
}

/**
 * Re-runs the alert's underlying query, reads the configured column from the
 * first result row, and updates the alert's state/lastValue accordingly.
 */
export async function checkAlert(id: string): Promise<Alert | undefined> {
  const alert = await getAlert(id);
  if (!alert) return undefined;

  const outcome = await executeQuery(alert.queryId, {}, false);
  const result = outcome.result ?? (await getLatestResult(alert.queryId));

  let state: Alert['state'] = 'unknown';
  let lastValue: number | undefined;

  if (result && result.rows.length > 0) {
    const raw = result.rows[0][alert.column];
    const num = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isNaN(num)) {
      lastValue = num;
      state = compare(alert.op, num, alert.value) ? 'triggered' : 'ok';
    }
  }

  const [row] = await db
    .update(schema.alerts)
    .set({ state, lastValue, lastCheckedAt: new Date() })
    .where(eq(schema.alerts.id, id))
    .returning();
  return row ? getAlert(row.id) : undefined;
}

export async function alertQueryColumns(queryId: string): Promise<string[]> {
  const query = await getQuery(queryId);
  if (!query) return [];
  const result = await getLatestResult(queryId);
  return result ? result.columns.map((c) => c.name) : [];
}
