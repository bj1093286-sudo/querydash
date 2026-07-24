import { Hono } from 'hono';
import {
  listDataSources,
  getDataSource,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  getDataSourceSchema,
} from '../services/datasourceService';

export const datasourceRoutes = new Hono();

datasourceRoutes.get('/', async (c) => {
  const items = await listDataSources();
  return c.json(items.map(({ connectionOptions: _connectionOptions, ...safe }) => safe));
});

datasourceRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const created = await createDataSource(body);
  const { connectionOptions: _connectionOptions, ...safe } = created;
  return c.json(safe, 201);
});

datasourceRoutes.get('/:id', async (c) => {
  const item = await getDataSource(c.req.param('id'));
  if (!item) return c.json({ error: { code: 'NOT_FOUND', message: 'Datasource not found' } }, 404);
  const { connectionOptions: _connectionOptions, ...safe } = item;
  return c.json(safe);
});

datasourceRoutes.put('/:id', async (c) => {
  const body = await c.req.json();
  const updated = await updateDataSource(c.req.param('id'), body);
  if (!updated) return c.json({ error: { code: 'NOT_FOUND', message: 'Datasource not found' } }, 404);
  const { connectionOptions: _connectionOptions, ...safe } = updated;
  return c.json(safe);
});

datasourceRoutes.delete('/:id', async (c) => {
  try {
    await deleteDataSource(c.req.param('id'));
    return c.body(null, 204);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23503') {
      return c.json(
        { error: { code: 'UNKNOWN', message: '이 데이터소스를 참조하는 쿼리가 있어 삭제할 수 없습니다.' } },
        409
      );
    }
    throw error;
  }
});

datasourceRoutes.get('/:id/schema', async (c) => {
  try {
    const schemaResult = await getDataSourceSchema(c.req.param('id'));
    if (!schemaResult) return c.json({ error: { code: 'NOT_FOUND', message: 'Datasource not found' } }, 404);
    return c.json(schemaResult);
  } catch (error) {
    return c.json(
      { error: { code: 'CONNECTION_ERROR', message: error instanceof Error ? error.message : 'Unknown error' } },
      502
    );
  }
});
