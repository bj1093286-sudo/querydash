import type {
  Alert,
  AlertOp,
  AlertSchedule,
  ChartConfig,
  Dashboard,
  DashboardFilter,
  DataSource,
  DatabaseSchema,
  Query,
  QueryResult,
  QueryVersion,
  RefreshInterval,
  Visualization,
  VisualizationType,
  Widget,
  WidgetOptions,
} from '@querydash/types';
import { useAuthStore, type AuthUser } from '../store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (res.status === 401) {
    useAuthStore.getState().logout();
  }
  if (!res.ok && res.status !== 409) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `요청이 실패했습니다 (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Downloads a binary/text export by fetching it with auth headers and saving via a temporary object URL. */
async function downloadExport(path: string, fallbackFilename: string): Promise<void> {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `내보내기에 실패했습니다 (${res.status})`);
  }
  const blob = await res.blob();
  // Use our own (JS-string, Korean-safe) filename rather than parsing
  // Content-Disposition - that header is a Latin-1 ByteString server-side,
  // so it can only carry an ASCII-sanitized fallback name.
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fallbackFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export type PublicDataSource = Omit<DataSource, 'connectionOptions'>;
export type ExportFormat = 'csv' | 'xlsx' | 'json';

export const api = {
  auth: {
    signup: (input: { email: string; password: string; name: string }) =>
      request<{ user: AuthUser; token: string }>('/api/auth/signup', { method: 'POST', body: JSON.stringify(input) }),
    login: (input: { email: string; password: string }) =>
      request<{ user: AuthUser; token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(input) }),
    me: () => request<AuthUser>('/api/auth/me'),
    users: () => request<AuthUser[]>('/api/auth/users'),
    resetPassword: (input: { userId: string; newPassword: string }) =>
      request<void>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(input) }),
  },
  datasources: {
    list: () => request<PublicDataSource[]>('/api/datasources'),
    get: (id: string) => request<PublicDataSource>(`/api/datasources/${id}`),
    create: (input: {
      name: string;
      type: DataSource['type'];
      connectionOptions: Record<string, unknown>;
      readOnly?: boolean;
    }) => request<PublicDataSource>('/api/datasources', { method: 'POST', body: JSON.stringify(input) }),
    delete: (id: string) => request<void>(`/api/datasources/${id}`, { method: 'DELETE' }),
    schema: (id: string) => request<DatabaseSchema>(`/api/datasources/${id}/schema`),
  },
  queries: {
    list: () => request<Query[]>('/api/queries'),
    get: (id: string) => request<Query>(`/api/queries/${id}`),
    create: (input: {
      name: string;
      sqlText: string;
      datasourceId: string;
      folder?: string;
      tags?: string[];
    }) => request<Query>('/api/queries', { method: 'POST', body: JSON.stringify(input) }),
    update: (
      id: string,
      input: Partial<{
        name: string;
        sqlText: string;
        datasourceId: string;
        folder: string | null;
        tags: string[];
        isFavorite: boolean;
      }>
    ) => request<Query>(`/api/queries/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
    delete: (id: string) => request<void>(`/api/queries/${id}`, { method: 'DELETE' }),
    listVersions: (id: string) => request<QueryVersion[]>(`/api/queries/${id}/versions`),
    revertToVersion: (id: string, versionId: string) =>
      request<Query>(`/api/queries/${id}/versions/${versionId}/revert`, { method: 'POST' }),
    exportResult: (id: string, format: ExportFormat, queryName: string) =>
      downloadExport(`/api/queries/${id}/result/export?format=${format}`, `${queryName}.${format}`),
    getResult: (id: string) => request<QueryResult>(`/api/queries/${id}/result`),
  },
  visualizations: {
    listByQuery: (queryId: string) => request<Visualization[]>(`/api/visualizations?queryId=${queryId}`),
    get: (id: string) => request<Visualization>(`/api/visualizations/${id}`),
    create: (input: { queryId: string; name: string; type: VisualizationType; options: ChartConfig }) =>
      request<Visualization>('/api/visualizations', { method: 'POST', body: JSON.stringify(input) }),
    delete: (id: string) => request<void>(`/api/visualizations/${id}`, { method: 'DELETE' }),
  },
  dashboards: {
    list: () => request<Dashboard[]>('/api/dashboards'),
    get: (id: string) => request<Dashboard>(`/api/dashboards/${id}`),
    create: (input: { name: string }) =>
      request<Dashboard>('/api/dashboards', { method: 'POST', body: JSON.stringify(input) }),
    update: (
      id: string,
      input: Partial<{
        name: string;
        isPublished: boolean;
        isArchived: boolean;
        dashboardFilters: DashboardFilter[];
        refreshInterval: RefreshInterval;
      }>
    ) => request<Dashboard>(`/api/dashboards/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
    delete: (id: string) => request<void>(`/api/dashboards/${id}`, { method: 'DELETE' }),
    listWidgets: (id: string) => request<Widget[]>(`/api/dashboards/${id}/widgets`),
    addWidget: (id: string, input: { visualizationId?: string; text?: string; options: WidgetOptions }) =>
      request<Widget>(`/api/dashboards/${id}/widgets`, { method: 'POST', body: JSON.stringify(input) }),
    updateWidgetsLayout: (id: string, updates: Array<{ id: string; options: WidgetOptions }>) =>
      request<void>(`/api/dashboards/${id}/widgets/layout`, { method: 'PUT', body: JSON.stringify({ updates }) }),
  },
  widgets: {
    update: (id: string, input: Partial<{ options: WidgetOptions; text: string; visualizationId: string }>) =>
      request<Widget>(`/api/widgets/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
    delete: (id: string) => request<void>(`/api/widgets/${id}`, { method: 'DELETE' }),
  },
  alerts: {
    list: () => request<Alert[]>('/api/alerts'),
    get: (id: string) => request<Alert>(`/api/alerts/${id}`),
    columns: (queryId: string) => request<string[]>(`/api/alerts/columns?queryId=${queryId}`),
    create: (input: { name: string; queryId: string; column: string; op: AlertOp; value: number; schedule?: AlertSchedule }) =>
      request<Alert>('/api/alerts', { method: 'POST', body: JSON.stringify(input) }),
    update: (
      id: string,
      input: Partial<{ name: string; queryId: string; column: string; op: AlertOp; value: number; schedule: AlertSchedule }>
    ) => request<Alert>(`/api/alerts/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
    delete: (id: string) => request<void>(`/api/alerts/${id}`, { method: 'DELETE' }),
    check: (id: string) => request<Alert>(`/api/alerts/${id}/check`, { method: 'POST' }),
  },
};

export { API_BASE_URL };
