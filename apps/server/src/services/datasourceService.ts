import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { loadDataSourceSchema } from '@querydash/query-engine';
import type { DataSource, DataSourceConnectionOptions, DataSourceType, DatabaseSchema } from '@querydash/types';
import { db, schema } from '../db';

function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('ENCRYPTION_KEY 환경변수가 설정되어 있지 않습니다.');
  }
  const hexKey = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, 'hex') : undefined;
  const key = hexKey ?? Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY는 32바이트(AES-256, 64자리 hex 또는 base64)여야 합니다.');
  }
  return key;
}

function encrypt(plainText: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function decrypt(payload: string): string {
  const key = getEncryptionKey();
  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

function toDataSource(row: typeof schema.datasources.$inferSelect): DataSource {
  return {
    id: row.id,
    name: row.name,
    type: row.type as DataSourceType,
    connectionOptions: JSON.parse(decrypt(row.connectionOptionsEncrypted)) as DataSourceConnectionOptions,
    readOnly: row.readOnly,
    maxConcurrentQueries: row.maxConcurrentQueries,
    queryTimeoutSeconds: row.queryTimeoutSeconds,
    maxConnectionPoolSize: row.maxConnectionPoolSize,
    createdBy: row.createdBy ?? '',
    createdAt: row.createdAt.toISOString(),
  };
}

export interface CreateDataSourceInput {
  name: string;
  type: DataSourceType;
  connectionOptions: DataSourceConnectionOptions;
  readOnly?: boolean;
  createdBy?: string;
}

export async function listDataSources(): Promise<DataSource[]> {
  const rows = await db.select().from(schema.datasources);
  return rows.map(toDataSource);
}

export async function getDataSource(id: string): Promise<DataSource | undefined> {
  const [row] = await db.select().from(schema.datasources).where(eq(schema.datasources.id, id));
  return row ? toDataSource(row) : undefined;
}

export async function createDataSource(input: CreateDataSourceInput): Promise<DataSource> {
  const [row] = await db
    .insert(schema.datasources)
    .values({
      name: input.name,
      type: input.type,
      connectionOptionsEncrypted: encrypt(JSON.stringify(input.connectionOptions)),
      readOnly: input.readOnly ?? false,
      createdBy: input.createdBy,
    })
    .returning();
  return toDataSource(row);
}

export async function updateDataSource(
  id: string,
  input: Partial<CreateDataSourceInput>
): Promise<DataSource | undefined> {
  const updates: Partial<typeof schema.datasources.$inferInsert> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.type !== undefined) updates.type = input.type;
  if (input.readOnly !== undefined) updates.readOnly = input.readOnly;
  if (input.connectionOptions !== undefined) {
    updates.connectionOptionsEncrypted = encrypt(JSON.stringify(input.connectionOptions));
  }
  const [row] = await db.update(schema.datasources).set(updates).where(eq(schema.datasources.id, id)).returning();
  return row ? toDataSource(row) : undefined;
}

export async function deleteDataSource(id: string): Promise<void> {
  await db.delete(schema.datasources).where(eq(schema.datasources.id, id));
}

export async function getDataSourceSchema(id: string): Promise<DatabaseSchema | undefined> {
  const datasource = await getDataSource(id);
  if (!datasource) return undefined;
  return loadDataSourceSchema(datasource);
}
