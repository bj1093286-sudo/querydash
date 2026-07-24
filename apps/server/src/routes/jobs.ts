import { Hono } from 'hono';
import { getJob, cancelJob } from '../services/jobQueue';

export const jobRoutes = new Hono();

jobRoutes.get('/:id', (c) => {
  const job = getJob(c.req.param('id'));
  if (!job) return c.json({ error: { code: 'NOT_FOUND', message: 'Job을 찾을 수 없습니다.' } }, 404);
  return c.json(job);
});

jobRoutes.delete('/:id', async (c) => {
  const ok = await cancelJob(c.req.param('id'));
  if (!ok) return c.json({ error: { code: 'NOT_FOUND', message: 'Job을 찾을 수 없거나 이미 종료되었습니다.' } }, 404);
  return c.body(null, 204);
});
