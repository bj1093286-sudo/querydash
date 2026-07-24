export type DataSourceType = 'postgresql' | 'mysql' | 'bigquery' | 'sqlite';

export interface DataSourceConnectionOptions {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  filePath?: string;
  projectId?: string;
  keyFilename?: string;
  [key: string]: unknown;
}

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  connectionOptions: DataSourceConnectionOptions;
  readOnly?: boolean;
  maxConcurrentQueries?: number;
  queryTimeoutSeconds?: number;
  maxConnectionPoolSize?: number;
  createdBy: string;
  createdAt: string;
}

export interface SchemaColumn {
  name: string;
  type: string;
  nullable?: boolean;
  isPrimaryKey?: boolean;
}

export interface SchemaTable {
  name: string;
  schema?: string;
  columns: SchemaColumn[];
}

export interface DatabaseSchema {
  dataSourceId: string;
  tables: SchemaTable[];
}
