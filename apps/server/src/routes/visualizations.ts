import { Hono } from 'hono';
import {
  listVisualizationsByQuery,
  getVisualization,
  createVisualization,
  updateVisualization,
  deleteVisualization,
} from '../services/visualizationService';

export const visualizationRoutes = new Hono();

visualizationRoutes.get('/', async (c) => {
  const queryId = c.req.query('queryId');
  if (!queryId) return c.json({ error: { code: 'UNKNOWN', message: 'queryId 쿼리 파라미터가 필요합니다.' } }, 400);
  return c.json(await listVisualizationsByQuery(queryId));
});

visualizationRoutes.post('/', async (c) => {
  const body = await c.req.json();
  return c.json(await createVisualization(body), 201);
});

visualizationRoutes.get('/:id', async (c) => {
  const item = await getVisualization(c.req.param('id'));
  if (!item) return c.json({ error: { code: 'NOT_FOUND', message: 'Visualization을 찾을 수 없습니다.' } }, 404);
  return c.json(item);
});

visualizationRoutes.put('/:id', async (c) => {
  const body = await c.req.json();
  const updated = await updateVisualization(c.req.param('id'), body);
  if (!updated) return c.json({ error: { code: 'NOT_FOUND', message: 'Visualization을 찾을 수 없습니다.' } }, 404);
  return c.json(updated);
});

visualizationRoutes.delete('/:id', async (c) => {
  await deleteVisualization(c.req.param('id'));
  return c.body(null, 204);
});
