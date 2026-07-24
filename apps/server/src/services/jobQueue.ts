import { randomUUID } from 'node:crypto';
import { createConnector } from '@querydash/query-engine';
import type { DataSource, Job, JobStatus, QueryError, QueryResult } from '@querydash/types';
import { executeQuery, getQuery } from './queryService';
import { getDataSource } from './datasourceService';

const MAX_CONCURRENT_JOBS = 5;
const JOB_RETENTION_MS = 10 * 60 * 1000;

interface JobRecord {
  id: string;
  queryId: string;
  status: JobStatus;
  parameterValues: Record<string, unknown>;
  confirmed: boolean;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  error?: QueryError;
  requiresConfirmation?: boolean;
  result?: QueryResult;
  cancelRequested?: boolean;
  pid?: number;
  datasource?: DataSource;
}

const jobs = new Map<string, JobRecord>();
const queue: string[] = [];
let runningCount = 0;

function pump() {
  while (runningCount < MAX_CONCURRENT_JOBS && queue.length > 0) {
    const id = queue.shift()!;
    const job = jobs.get(id);
    if (!job || job.status !== 'queued') continue;
    runningCount++;
    job.status = 'running';
    job.startedAt = Date.now();
    void runJob(job);
  }
}

async function runJob(job: JobRecord): Promise<void> {
  try {
    job.datasource = await getDataSource((await getQuery(job.queryId))?.datasourceId ?? '');
    const outcome = await executeQuery(job.queryId, job.parameterValues, job.confirmed, (pid) => {
      job.pid = pid;
    });
    if (job.cancelRequested) {
      job.status = 'cancelled';
    } else if (outcome.error) {
      job.status = 'failed';
      job.error = outcome.error;
      job.requiresConfirmation = outcome.requiresConfirmation;
    } else {
      job.status = 'completed';
      job.result = outcome.result;
    }
  } catch (e) {
    job.status = job.cancelRequested ? 'cancelled' : 'failed';
    job.error = { code: 'UNKNOWN', message: e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.' };
  } finally {
    job.finishedAt = Date.now();
    runningCount--;
    setTimeout(() => jobs.delete(job.id), JOB_RETENTION_MS).unref();
    pump();
  }
}

export function enqueueJob(
  queryId: string,
  parameterValues: Record<string, unknown> = {},
  confirmed = false
): Job {
  const id = randomUUID();
  const job: JobRecord = {
    id,
    queryId,
    status: 'queued',
    parameterValues,
    confirmed,
    createdAt: Date.now(),
  };
  jobs.set(id, job);
  queue.push(id);
  pump();
  return toPublicJob(job);
}

export function getJob(id: string): Job | undefined {
  const job = jobs.get(id);
  return job ? toPublicJob(job) : undefined;
}

export async function cancelJob(id: string): Promise<boolean> {
  const job = jobs.get(id);
  if (!job) return false;

  if (job.status === 'queued') {
    job.status = 'cancelled';
    job.finishedAt = Date.now();
    const idx = queue.indexOf(id);
    if (idx >= 0) queue.splice(idx, 1);
    setTimeout(() => jobs.delete(job.id), JOB_RETENTION_MS).unref();
    return true;
  }

  if (job.status === 'running') {
    job.cancelRequested = true;
    if (job.pid && job.datasource) {
      const connector = createConnector(job.datasource);
      await connector.cancel?.(job.pid).catch(() => {});
    }
    return true;
  }

  return false;
}

function toPublicJob(job: JobRecord): Job {
  return {
    id: job.id,
    queryId: job.queryId,
    status: job.status,
    queuePosition: job.status === 'queued' ? queue.indexOf(job.id) + 1 : undefined,
    elapsedSeconds:
      job.status === 'running' && job.startedAt !== undefined ? (Date.now() - job.startedAt) / 1000 : undefined,
    error: job.error,
    requiresConfirmation: job.requiresConfirmation,
    resultId: job.result?.id,
    result: job.result,
    createdAt: new Date(job.createdAt).toISOString(),
    updatedAt: new Date(job.finishedAt ?? job.startedAt ?? job.createdAt).toISOString(),
  };
}
