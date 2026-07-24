export type ParameterType = 'text' | 'number' | 'date' | 'date-range' | 'dropdown';

export type QuickRange =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface DropdownOption {
  label: string;
  value: string | number;
}

export interface Parameter {
  name: string;
  type: ParameterType;
  title?: string;
  defaultValue?: unknown;
  options?: DropdownOption[];
  queryId?: string;
}

export interface QuerySchedule {
  cron?: string;
  enabled: boolean;
}

export interface Query {
  id: string;
  name: string;
  description?: string;
  sqlText: string;
  datasourceId: string;
  schedule?: QuerySchedule;
  options?: Record<string, unknown>;
  folder?: string;
  tags: string[];
  isFavorite: boolean;
  isPublished: boolean;
  isArchived: boolean;
  createdBy: string;
  latestResultId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueryVersion {
  id: string;
  queryId: string;
  name: string;
  sqlText: string;
  createdBy?: string;
  createdAt: string;
}

export interface QueryResult {
  id: string;
  queryId: string;
  columns: QueryResultColumn[];
  rows: Array<Record<string, unknown>>;
  runtimeSeconds: number;
  retrievedAt: string;
}

export interface QueryResultColumn {
  name: string;
  type: 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'datetime';
}

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Job {
  id: string;
  queryId: string;
  status: JobStatus;
  queuePosition?: number;
  elapsedSeconds?: number;
  error?: QueryError;
  requiresConfirmation?: boolean;
  resultId?: string;
  result?: QueryResult;
  createdAt: string;
  updatedAt: string;
}

export type QueryErrorCode =
  | 'SYNTAX_ERROR'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'TIMEOUT'
  | 'CONNECTION_ERROR'
  | 'RATE_LIMITED'
  | 'UNKNOWN';

export interface QueryError {
  code: QueryErrorCode;
  message: string;
  line?: number;
  column?: number;
}
