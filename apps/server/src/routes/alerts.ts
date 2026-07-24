import { Hono } from 'hono';
import {
  listAlerts,
  getAlert,
  createAlert,
  updateAlert,
  deleteAlert,
  checkAlert,
  alertQueryColumns,
} from '../services/alertService';
import type { AuthEnv } from '../middleware/auth';

export const alertRoutes = new Hono<AuthEnv>();

alertRoutes.get('/', async (c) => c.json(await listAlerts()));

alertRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const createdBy = c.get('authUser')?.sub;
  return c.json(await createAlert(body, createdBy), 201);
});

alertRoutes.get('/columns', async (c) => {
  const queryId = c.req.query('queryId');
  if (!queryId) return c.json([]);
  return c.json(await alertQueryColumns(queryId));
});

alertRoutes.get('/:id', async (c) => {
  const item = await getAlert(c.req.param('id'));
  if (!item) return c.json({ error: { code: 'NOT_FOUND', message: '알림을 찾을 수 없습니다.' } }, 404);
  return c.json(item);
});

alertRoutes.put('/:id', async (c) => {
  const body = await c.req.json();
  const updated = await updateAlert(c.req.param('id'), body);
  if (!updated) return c.json({ error: { code: 'NOT_FOUND', message: '알림을 찾을 수 없습니다.' } }, 404);
  return c.json(updated);
});

alertRoutes.delete('/:id', async (c) => {
  await deleteAlert(c.req.param('id'));
  return c.body(null, 204);
});

alertRoutes.post('/:id/check', async (c) => {
  const updated = await checkAlert(c.req.param('id'));
  if (!updated) return c.json({ error: { code: 'NOT_FOUND', message: '알림을 찾을 수 없습니다.' } }, 404);
  return c.json(updated);
});
