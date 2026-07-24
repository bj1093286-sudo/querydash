import mysql from 'mysql2/promise';
import type { DatabaseSchema } from '@querydash/types';
import { BaseConnector, type ConnectorExecutionOptions, type ConnectorExecutionResult } from './base';

// MySQL protocol field type codes (mysql2 exposes these as `field.type` on the result field packets).
const INTEGER_TYPES = new Set([0x01, 0x02, 0x03, 0x08, 0x09, 0x0d]); // TINY, SHORT, LONG, LONGLONG, INT24, YEAR
const FLOAT_TYPES = new Set([0x00, 0x04, 0x05, 0xf6]); // DECIMAL, FLOAT, DOUBLE, NEWDECIMAL
const DATE_TYPES = new Set([0x0a, 0x0e]); // DATE, NEWDATE
const DATETIME_TYPES = new Set([0x07, 0x0c, 0x11, 0x12]); // TIMESTAMP, DATETIME, TIMESTAMP2, DATETIME2

function mapFieldType(type: number | undefined): string {
  if (type === undefined) return 'string';
  if (INTEGER_TYPES.has(type)) return 'integer';
  if (FLOAT_TYPES.has(type)) return 'float';
  if (DATE_TYPES.has(type)) return 'date';
  if (DATETIME_TYPES.has(type)) return 'datetime';
  return 'string';
}

export class MySQLConnector extends BaseConnector {
  private pool?: mysql.Pool;

  private poolConfig(): mysql.PoolOptions {
    return {
      host: this.options.host,
      port: this.options.port ?? 3306,
      database: this.options.database,
      user: this.options.username,
      password: this.options.password as string | undefined,
      ssl: this.options.ssl ? { rejectUnauthorized: false } : undefined,
      connectionLimit: 10,
      connectTimeout: 10_000,
    };
  }

  async connect(): Promise<void> {
    if (this.pool) return;
    this.pool = mysql.createPool(this.poolConfig());
    // fail fast on bad connection details instead of on first query
    const connection = await this.pool.getConnection();
    connection.release();
  }

  async disconnect(): Promise<void> {
    await this.pool?.end();
    this.pool = undefined;
  }

  async execute(sql: string, params: unknown[] = [], options?: ConnectorExecutionOptions): Promise<ConnectorExecutionResult> {
    await this.connect();
    const start = Date.now();
    const connection = await this.pool!.getConnection();
    try {
      options?.onPid?.(connection.threadId ?? 0);
      const [rows, fields] = await connection.query(sql, params);
      const rowArray = Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
      return {
        columns: (fields ?? []).map((field) => ({ name: field.name, type: mapFieldType(field.type) })),
        rows: rowArray,
        runtimeSeconds: (Date.now() - start) / 1000,
      };
    } finally {
      connection.release();
    }
  }

  async cancel(pid: number): Promise<void> {
    const connection = await mysql.createConnection(this.poolConfig());
    try {
      await connection.query(`KILL QUERY ${Number(pid)}`);
    } finally {
      await connection.end();
    }
  }

  async loadSchema(): Promise<DatabaseSchema> {
    await this.connect();
    const connection = await this.pool!.getConnection();
    try {
      const [rows] = await connection.query<mysql.RowDataPacket[]>(
        `SELECT TABLE_SCHEMA AS table_schema, TABLE_NAME AS table_name, COLUMN_NAME AS column_name,
                DATA_TYPE AS data_type, IS_NULLABLE AS is_nullable
         FROM information_schema.columns
         WHERE TABLE_SCHEMA = DATABASE()
         ORDER BY TABLE_NAME, ORDINAL_POSITION`
      );

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
      connection.release();
    }
  }
}
