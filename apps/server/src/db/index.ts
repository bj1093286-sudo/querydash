import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://querydash:querydash@localhost:5432/querydash',
});

export const db = drizzle(pool, { schema });
export { schema };
