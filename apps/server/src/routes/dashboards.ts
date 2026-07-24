import { Hono } from 'hono';
import {
  listDashboards,
  getDashboard,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  listWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
  updateWidgetsLayout,
} from '../services/dashboardService';
import type { AuthEnv } from '../middleware/auth';

export const dashboardRoutes = new Hono<AuthEnv>();

dashboardRoutes.get('/', async (c) => c.json(await listDashboards()));

dashboardRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const createdBy = c.get('authUser')?.sub;
  return c.json(await createDashboard(body.name ?? '새 대시보드', createdBy), 201);
});

dashboardRoutes.get('/:id', async (c) => {
  const item = await getDashboard(c.req.param('id'));
  if (!item) return c.json({ error: { code: 'NOT_FOUND', message: 'Dashboard를 찾을 수 없습니다.' } }, 404);
  return c.json(item);
});

dashboardRoutes.put('/:id', async (c) => {
  const body = await c.req.json();
  const updated = await updateDashboard(c.req.param('id'), body);
  if (!updated) return c.json({ error: { code: 'NOT_FOUND', message: 'Dashboard를 찾을 수 없습니다.' } }, 404);
  return c.json(updated);
});

dashboardRoutes.delete('/:id', async (c) => {
  await deleteDashboard(c.req.param('id'));
  return c.body(null, 204);
});

dashboardRoutes.get('/:id/widgets', async (c) => c.json(await listWidgets(c.req.param('id'))));

dashboardRoutes.post('/:id/widgets', async (c) => {
  const body = await c.req.json();
  return c.json(await createWidget(c.req.param('id'), body), 201);
});

dashboardRoutes.put('/:id/widgets/layout', async (c) => {
  const body = await c.req.json();
  await updateWidgetsLayout(body.updates ?? []);
  return c.body(null, 204);
});

export const widgetRoutes = new Hono();

widgetRoutes.put('/:id', async (c) => {
  const body = await c.req.json();
  const updated = await updateWidget(c.req.param('id'), body);
  if (!updated) return c.json({ error: { code: 'NOT_FOUND', message: 'Widget을 찾을 수 없습니다.' } }, 404);
  return c.json(updated);
});

widgetRoutes.delete('/:id', async (c) => {
  await deleteWidget(c.req.param('id'));
  return c.body(null, 204);
});
