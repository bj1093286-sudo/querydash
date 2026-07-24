import type { DataSource, DatabaseSchema } from '@querydash/types';
import { createConnector } from './connectors';

export async function loadDataSourceSchema(datasource: DataSource): Promise<DatabaseSchema> {
  const connector = createConnector(datasource);
  try {
    await connector.connect();
    const schema = await connector.loadSchema();
    return { ...schema, dataSourceId: datasource.id };
  } finally {
    await connector.disconnect();
  }
}
