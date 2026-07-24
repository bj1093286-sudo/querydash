import { eq } from 'drizzle-orm';
import type { ChartConfig, Visualization, VisualizationType } from '@querydash/types';
import { db, schema } from '../db';

function toVisualization(row: typeof schema.visualizations.$inferSelect): Visualization {
  return {
    id: row.id,
    queryId: row.queryId,
    name: row.name,
    type: row.type as VisualizationType,
    options: (row.options ?? {}) as unknown as ChartConfig,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface SaveVisualizationInput {
  queryId: string;
  name: string;
  type: VisualizationType;
  options: ChartConfig;
}

export async function listVisualizationsByQuery(queryId: string): Promise<Visualization[]> {
  const rows = await db.select().from(schema.visualizations).where(eq(schema.visualizations.queryId, queryId));
  return rows.map(toVisualization);
}

export async function getVisualization(id: string): Promise<Visualization | undefined> {
  const [row] = await db.select().from(schema.visualizations).where(eq(schema.visualizations.id, id));
  return row ? toVisualization(row) : undefined;
}

export async function createVisualization(input: SaveVisualizationInput): Promise<Visualization> {
  const [row] = await db
    .insert(schema.visualizations)
    .values({
      queryId: input.queryId,
      name: input.name,
      type: input.type,
      options: input.options as unknown as Record<string, unknown>,
    })
    .returning();
  return toVisualization(row);
}

export async function updateVisualization(
  id: string,
  input: Partial<SaveVisualizationInput>
): Promise<Visualization | undefined> {
  const updates: Partial<typeof schema.visualizations.$inferInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.type !== undefined) updates.type = input.type;
  if (input.options !== undefined) updates.options = input.options as unknown as Record<string, unknown>;
  const [row] = await db
    .update(schema.visualizations)
    .set(updates)
    .where(eq(schema.visualizations.id, id))
    .returning();
  return row ? toVisualization(row) : undefined;
}

export async function deleteVisualization(id: string): Promise<void> {
  await db.delete(schema.visualizations).where(eq(schema.visualizations.id, id));
}
