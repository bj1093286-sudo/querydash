import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Dashboard, DashboardFilter, RefreshInterval, Widget, WidgetOptions } from '@querydash/types';
import { db, schema } from '../db';

function slugify(name: string): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'dashboard';
  return `${base}-${randomUUID().slice(0, 8)}`;
}

function toDashboard(row: typeof schema.dashboards.$inferSelect): Dashboard {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isPublished: row.isPublished,
    isArchived: row.isArchived,
    dashboardFilters: (row.dashboardFilters ?? []) as DashboardFilter[],
    layout: row.layout ?? {},
    refreshInterval: (row.refreshInterval ?? null) as RefreshInterval,
    createdBy: row.createdBy ?? '',
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listDashboards(): Promise<Dashboard[]> {
  const rows = await db.select().from(schema.dashboards).where(eq(schema.dashboards.isArchived, false));
  return rows.map(toDashboard);
}

export async function getDashboard(id: string): Promise<Dashboard | undefined> {
  const [row] = await db.select().from(schema.dashboards).where(eq(schema.dashboards.id, id));
  return row ? toDashboard(row) : undefined;
}

export interface SaveDashboardInput {
  name?: string;
  isPublished?: boolean;
  isArchived?: boolean;
  dashboardFilters?: DashboardFilter[];
  refreshInterval?: RefreshInterval;
}

export async function createDashboard(name: string, createdBy?: string): Promise<Dashboard> {
  const [row] = await db
    .insert(schema.dashboards)
    .values({ name, slug: slugify(name), createdBy })
    .returning();
  return toDashboard(row);
}

export async function updateDashboard(id: string, input: SaveDashboardInput): Promise<Dashboard | undefined> {
  const updates: Partial<typeof schema.dashboards.$inferInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.isPublished !== undefined) updates.isPublished = input.isPublished;
  if (input.isArchived !== undefined) updates.isArchived = input.isArchived;
  if (input.dashboardFilters !== undefined) updates.dashboardFilters = input.dashboardFilters;
  if (input.refreshInterval !== undefined) updates.refreshInterval = input.refreshInterval;
  const [row] = await db.update(schema.dashboards).set(updates).where(eq(schema.dashboards.id, id)).returning();
  return row ? toDashboard(row) : undefined;
}

export async function deleteDashboard(id: string): Promise<void> {
  await db.delete(schema.dashboards).where(eq(schema.dashboards.id, id));
}

export async function listWidgets(dashboardId: string): Promise<Widget[]> {
  const rows = await db
    .select({
      widget: schema.widgets,
      visualizationType: schema.visualizations.type,
      visualizationName: schema.visualizations.name,
      queryId: schema.visualizations.queryId,
      queryName: schema.queries.name,
    })
    .from(schema.widgets)
    .leftJoin(schema.visualizations, eq(schema.widgets.visualizationId, schema.visualizations.id))
    .leftJoin(schema.queries, eq(schema.visualizations.queryId, schema.queries.id))
    .where(eq(schema.widgets.dashboardId, dashboardId));

  return rows.map(({ widget, visualizationType, visualizationName, queryId, queryName }) => ({
    id: widget.id,
    dashboardId: widget.dashboardId,
    visualizationId: widget.visualizationId ?? undefined,
    visualizationType: visualizationType ?? undefined,
    visualizationName: visualizationName ?? undefined,
    queryId: queryId ?? undefined,
    queryName: queryName ?? undefined,
    text: widget.text ?? undefined,
    options: widget.options as unknown as WidgetOptions,
    createdAt: widget.createdAt.toISOString(),
  }));
}

export interface SaveWidgetInput {
  visualizationId?: string;
  text?: string;
  options: WidgetOptions;
}

export async function createWidget(dashboardId: string, input: SaveWidgetInput): Promise<Widget> {
  const [row] = await db
    .insert(schema.widgets)
    .values({
      dashboardId,
      visualizationId: input.visualizationId,
      text: input.text,
      options: input.options as unknown as Record<string, unknown>,
    })
    .returning();
  return {
    id: row.id,
    dashboardId: row.dashboardId,
    visualizationId: row.visualizationId ?? undefined,
    text: row.text ?? undefined,
    options: row.options as unknown as WidgetOptions,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function updateWidget(id: string, input: Partial<SaveWidgetInput>): Promise<Widget | undefined> {
  const updates: Partial<typeof schema.widgets.$inferInsert> = {};
  if (input.options !== undefined) updates.options = input.options as unknown as Record<string, unknown>;
  if (input.text !== undefined) updates.text = input.text;
  if (input.visualizationId !== undefined) updates.visualizationId = input.visualizationId;
  const [row] = await db.update(schema.widgets).set(updates).where(eq(schema.widgets.id, id)).returning();
  if (!row) return undefined;
  return {
    id: row.id,
    dashboardId: row.dashboardId,
    visualizationId: row.visualizationId ?? undefined,
    text: row.text ?? undefined,
    options: row.options as unknown as WidgetOptions,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function deleteWidget(id: string): Promise<void> {
  await db.delete(schema.widgets).where(eq(schema.widgets.id, id));
}

export async function updateWidgetsLayout(updates: Array<{ id: string; options: WidgetOptions }>): Promise<void> {
  await Promise.all(
    updates.map(({ id, options }) =>
      db
        .update(schema.widgets)
        .set({ options: options as unknown as Record<string, unknown> })
        .where(eq(schema.widgets.id, id))
    )
  );
}
