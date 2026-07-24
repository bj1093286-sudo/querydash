import { Hono } from 'hono';
import {
  listQueries,
  getQuery,
  createQuery,
  updateQuery,
  deleteQuery,
  getLatestResult,
  listQueryVersions,
  revertQueryToVersion,
} from '../services/queryService';
import { enqueueJob } from '../services/jobQueue';
import { buildCsv, buildExcel, buildJson } from '../services/exportService';
import type { AuthEnv } from '../middleware/auth';

export const queryRoutes = new Hono<AuthEnv>();

queryRoutes.get('/', async (c) => c.json(await listQueries()));

queryRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const createdBy = c.get('authUser')?.sub;
  return c.json(await createQuery({ ...body, createdBy }), 201);
});

queryRoutes.get('/:id', async (c) => {
  const item = await getQuery(c.req.param('id'));
  if (!item) return c.json({ error: { code: 'NOT_FOUND', message: 'Query not found' } }, 404);
  return c.json(item);
});

queryRoutes.put('/:id', async (c) => {
  const body = await c.req.json();
  const editorUserId = c.get('authUser')?.sub;
  const updated = await updateQuery(c.req.param('id'), body, editorUserId);
  if (!updated) return c.json({ error: { code: 'NOT_FOUND', message: 'Query not found' } }, 404);
  return c.json(updated);
});

queryRoutes.delete('/:id', async (c) => {
  await deleteQuery(c.req.param('id'));
  return c.body(null, 204);
});

queryRoutes.get('/:id/versions', async (c) => c.json(await listQueryVersions(c.req.param('id'))));

queryRoutes.post('/:id/versions/:versionId/revert', async (c) => {
  const editorUserId = c.get('authUser')?.sub;
  const updated = await revertQueryToVersion(c.req.param('id'), c.req.param('versionId'), editorUserId);
  if (!updated) return c.json({ error: { code: 'NOT_FOUND', message: 'Version not found' } }, 404);
  return c.json(updated);
});

queryRoutes.post('/:id/execute', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const query = await getQuery(c.req.param('id'));
  if (!query) return c.json({ error: { code: 'NOT_FOUND', message: 'Query를 찾을 수 없습니다.' } }, 404);

  const job = enqueueJob(c.req.param('id'), body.params ?? {}, body.confirmed ?? false);
  return c.json({ jobId: job.id, status: job.status, queuePosition: job.queuePosition }, 202);
});

queryRoutes.get('/:id/result', async (c) => {
  const result = await getLatestResult(c.req.param('id'));
  if (!result) return c.json({ error: { code: 'NOT_FOUND', message: 'Result not found' } }, 404);
  return c.json(result);
});

queryRoutes.get('/:id/result/export', async (c) => {
  const format = c.req.query('format') ?? 'csv';
  const query = await getQuery(c.req.param('id'));
  const result = await getLatestResult(c.req.param('id'));
  if (!result) return c.json({ error: { code: 'NOT_FOUND', message: '결과를 찾을 수 없습니다.' } }, 404);

  const rawName = query?.name ?? 'query';
  // Content-Disposition must be a Latin-1 ByteString: Korean (or any non-ASCII)
  // filenames need the RFC 5987 filename* form, with a plain-ASCII fallback
  // for clients that only understand the legacy filename= form.
  const asciiFallback = rawName.replace(/[^\x20-\x7e]+/g, '_').replace(/[^\w.-]+/g, '_') || 'query';
  const encoded = encodeURIComponent(rawName);
  function contentDisposition(ext: string): string {
    return `attachment; filename="${asciiFallback}.${ext}"; filename*=UTF-8''${encoded}.${ext}`;
  }

  if (format === 'json') {
    c.header('Content-Type', 'application/json; charset=utf-8');
    c.header('Content-Disposition', contentDisposition('json'));
    return c.body(buildJson(result));
  }

  if (format === 'xlsx') {
    const buffer = await buildExcel(result, query?.name ?? 'Sheet1');
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', contentDisposition('xlsx'));
    return c.body(new Uint8Array(buffer));
  }

  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', contentDisposition('csv'));
  return c.body(buildCsv(result));
});
