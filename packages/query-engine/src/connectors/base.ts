import type { DatabaseSchema, DataSourceConnectionOptions } from '@querydash/types';

export interface ConnectorExecutionResult {
  columns: Array<{ name: string; type: string }>;
  rows: Array<Record<string, unknown>>;
  runtimeSeconds: number;
}

export interface ConnectorExecutionOptions {
  /** Called with the driver-level session/process id as soon as it is known, so a caller can cancel the in-flight query later. */
  onPid?: (pid: number) => void;
}

export interface Connector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  execute(sql: string, params?: unknown[], options?: ConnectorExecutionOptions): Promise<ConnectorExecutionResult>;
  loadSchema(): Promise<DatabaseSchema>;
  testConnection(): Promise<boolean>;
  /** Best-effort cancellation of a running query identified by the pid reported via onPid. */
  cancel?(pid: number): Promise<void>;
}

export abstract class BaseConnector implements Connector {
  constructor(protected readonly options: DataSourceConnectionOptions) {}

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract execute(sql: string, params?: unknown[], options?: ConnectorExecutionOptions): Promise<ConnectorExecutionResult>;
  abstract loadSchema(): Promise<DatabaseSchema>;

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      return true;
    } finally {
      await this.disconnect();
    }
  }
}
