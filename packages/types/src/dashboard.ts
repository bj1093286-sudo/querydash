export interface DashboardFilter {
  name: string;
  parameter: string;
  queryIds: string[];
}

export interface WidgetOptions {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Widget {
  id: string;
  dashboardId: string;
  visualizationId?: string;
  visualizationType?: string;
  visualizationName?: string;
  queryId?: string;
  queryName?: string;
  text?: string;
  options: WidgetOptions;
  createdAt: string;
}

export type RefreshInterval = 60 | 300 | 600 | 1800 | 3600 | null;

export interface Dashboard {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
  isArchived: boolean;
  dashboardFilters: DashboardFilter[];
  layout: Record<string, unknown>;
  refreshInterval: RefreshInterval;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
