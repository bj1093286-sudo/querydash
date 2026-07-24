import pg from 'pg';
import type { DatabaseSchema } from '@querydash/types';
import { BaseConnector, type ConnectorExecutionOptions, type ConnectorExecutionResult } from './base';

const { Pool } = pg;

const INTEGER_OIDS = new Set([20, 21, 23]);
const FLOAT_OIDS = new Set([700, 701, 1700]);
const BOOLEAN_OID = 16;
const DATE_OID = 1082;
const DATETIME_OIDS = new Set([1114, 1184]);

function mapOidToType(oid: number): string {
  if (INTEGER_OIDS.has(oid)) return 'integer';
  if (FLOAT_OIDS.has(oid)) return 'float';
  if (oid === BOOLEAN_OID) return 'boolean';
  if (oid === DATE_OID) return 'date';
  if (DATETIME_OIDS.has(oid)) return 'datetime';
  return 'string';
}

export class PostgreSQLConnector extends BaseConnector {
  private pool?: InstanceType<typeof Pool>;

  async connect(): Promise<void> {
    if (this.pool) return;
    this.pool = new Pool({
      host: this.options.host,
      port: this.options.port ?? 5432,
      database: this.options.database,
      user: this.options.username,
      password: this.options.password as string | undefined,
      ssl: this.options.ssl ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 10_000,
    });
    // fail fast on bad connection details instead of on first query
    const client = await this.pool.connect();
    client.release();
  }

  async disconnect(): Promise<void> {
    await this.pool?.end();
    this.pool = undefined;
  }

  async execute(sql: string, params: unknown[] = [], options?: ConnectorExecutionOptions): Promise<ConnectorExecutionResult> {
    await this.connect();
    const start = Date.now();
    const client = await this.pool!.connect();
    try {
      options?.onPid?.((client as unknown as { processID: number }).processID);
      const result = await client.query(sql, params);
      return {
        columns: result.fields.map((field) => ({ name: field.name, type: mapOidToType(field.dataTypeID) })),
        rows: result.rows,
        runtimeSeconds: (Date.now() - start) / 1000,
      };
    } finally {
      client.release();
    }
  }

  async cancel(pid: number): Promise<void> {
    const client = new pg.Client({
      host: this.options.host,
      port: this.options.port ?? 5432,
      database: this.options.database,
      user: this.options.username,
      password: this.options.password as string | undefined,
      ssl: this.options.ssl ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 10_000,
    });
    await client.connect();
    try {
      await client.query('SELECT pg_cancel_backend($1)', [pid]);
    } finally {
      await client.end();
    }
  }

  async loadSchema(): Promise<DatabaseSchema> {
    await this.connect();
    const client = await this.pool!.connect();
    try {
      const { rows } = await client.query<{
        table_schema: string;
        table_name: string;
        column_name: string;
        data_type: string;
        is_nullable: string;
      }>(`
        SELECT table_schema, table_name, column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY table_schema, table_name, ordinal_position
      `);

      const tables = new Map<string, DatabaseSchema['tables'][number]>();
      for (const row of rows) {
        const key = `${row.table_schema}.${row.table_name}`;
        if (!tables.has(key)) {
          tables.set(key, { name: row.table_name, schema: row.table_schema, columns: [] });
        }
        tables.get(key)!.columns.push({
          name: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable === 'YES',
        });
      }

      return { dataSourceId: '', tables: Array.from(tables.values()) };
    } finally {
      client.release();
    }
  }
}
