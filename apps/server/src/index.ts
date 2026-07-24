import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { datasourceRoutes } from './routes/datasources';
import { queryRoutes } from './routes/queries';
import { jobRoutes } from './routes/jobs';
import { visualizationRoutes } from './routes/visualizations';
import { dashboardRoutes, widgetRoutes } from './routes/dashboards';
import { authRoutes } from './routes/auth';
import { alertRoutes } from './routes/alerts';
import { authMiddleware, requireAuth, type AuthEnv } from './middleware/auth';
import { startAlertScheduler } from './services/alertScheduler';

const app = new Hono<AuthEnv>();

app.use('*', logger());
app.use('*', cors());
app.use('/api/*', authMiddleware);

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/api/auth', authRoutes);

app.use('/api/datasources/*', requireAuth);
app.use('/api/queries/*', requireAuth);
app.use('/api/jobs/*', requireAuth);
app.use('/api/visualizations/*', requireAuth);
app.use('/api/dashboards/*', requireAuth);
app.use('/api/widgets/*', requireAuth);
app.use('/api/alerts/*', requireAuth);

app.route('/api/datasources', datasourceRoutes);
app.route('/api/queries', queryRoutes);
app.route('/api/jobs', jobRoutes);
app.route('/api/visualizations', visualizationRoutes);
app.route('/api/dashboards', dashboardRoutes);
app.route('/api/widgets', widgetRoutes);
app.route('/api/alerts', alertRoutes);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: { code: 'UNKNOWN', message: 'Internal server error' } }, 500);
});

const port = Number(process.env.PORT ?? 8000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`QueryDash server listening on http://localhost:${info.port}`);
});

startAlertScheduler();
