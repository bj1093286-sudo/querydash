import { useCallback, useEffect, useRef, useState } from 'react';
import type { QueryError, QueryResult } from '@querydash/types';

export type ExecutionStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface QueryExecutionState {
  status: ExecutionStatus;
  result?: QueryResult;
  error?: QueryError;
  requiresConfirmation?: boolean;
  queuePosition?: number;
  elapsedSeconds?: number;
  jobId?: string;
}

export interface UseQueryExecutionOptions {
  apiBaseUrl?: string;
  pollIntervalMs?: number;
  /** Called fresh on every request so a refreshed/rotated token is always picked up (e.g. `() => ({ Authorization: 'Bearer ' + token })`). */
  getAuthHeaders?: () => Record<string, string>;
}

export function useQueryExecution(options: UseQueryExecutionOptions = {}) {
  const baseUrl = options.apiBaseUrl ?? '';
  const pollIntervalMs = options.pollIntervalMs ?? 1000;
  const [state, setState] = useState<QueryExecutionState>({ status: 'idle' });
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const getAuthHeadersRef = useRef(options.getAuthHeaders);
  getAuthHeadersRef.current = options.getAuthHeaders;

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const poll = useCallback(
    (jobId: string) => {
      stopPolling();
      timerRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${baseUrl}/api/jobs/${jobId}`, { headers: getAuthHeadersRef.current?.() });
          if (!res.ok) return;
          const job = await res.json();
          if (job.status === 'queued') {
            setState((s) => ({ ...s, status: 'queued', queuePosition: job.queuePosition }));
          } else if (job.status === 'running') {
            setState((s) => ({ ...s, status: 'running', elapsedSeconds: job.elapsedSeconds }));
          } else if (job.status === 'completed') {
            stopPolling();
            setState({ status: 'completed', result: job.result, jobId });
          } else if (job.status === 'failed') {
            stopPolling();
            setState({ status: 'failed', error: job.error, requiresConfirmation: job.requiresConfirmation, jobId });
          } else if (job.status === 'cancelled') {
            stopPolling();
            setState({ status: 'cancelled', jobId });
          }
        } catch {
          // transient network error while polling; keep trying on the next tick
        }
      }, pollIntervalMs);
    },
    [baseUrl, pollIntervalMs, stopPolling]
  );

  const execute = useCallback(
    async (queryId: string, params?: Record<string, unknown>, confirmed = false) => {
      stopPolling();
      setState({ status: 'queued' });
      try {
        const res = await fetch(`${baseUrl}/api/queries/${queryId}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeadersRef.current?.() },
          body: JSON.stringify({ params, confirmed }),
        });
        const body = await res.json();
        if (!res.ok) {
          setState({ status: 'failed', error: body.error, requiresConfirmation: body.requiresConfirmation });
          return;
        }
        setState({ status: 'queued', jobId: body.jobId, queuePosition: body.queuePosition });
        poll(body.jobId);
      } catch (e) {
        setState({
          status: 'failed',
          error: { code: 'CONNECTION_ERROR', message: e instanceof Error ? e.message : 'Unknown error' },
        });
      }
    },
    [baseUrl, poll, stopPolling]
  );

  const cancel = useCallback(async () => {
    if (!state.jobId) return;
    stopPolling();
    await fetch(`${baseUrl}/api/jobs/${state.jobId}`, { method: 'DELETE', headers: getAuthHeadersRef.current?.() }).catch(
      () => {}
    );
    setState((s) => ({ ...s, status: 'cancelled' }));
  }, [baseUrl, state.jobId, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setState({ status: 'idle' });
  }, [stopPolling]);

  return { ...state, execute, cancel, reset };
}
