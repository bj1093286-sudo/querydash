'use client';

import { useState } from 'react';
import { DataTable, Tag, Button, Dropdown } from '@querydash/ui';
import type { ExecutionStatus } from '@querydash/ui';
import type { QueryError, QueryResult } from '@querydash/types';
import { api, type ExportFormat } from '../../lib/api';

export interface QueryResultPanelProps {
  status: ExecutionStatus;
  result?: QueryResult;
  error?: QueryError;
  queuePosition?: number;
  elapsedSeconds?: number;
  onCancel?: () => void;
  queryId?: string;
  queryName?: string;
}

const ERROR_LABELS: Record<QueryError['code'], string> = {
  SYNTAX_ERROR: '문법 오류',
  PERMISSION_DENIED: '권한 없음',
  NOT_FOUND: '찾을 수 없음',
  TIMEOUT: '시간 초과',
  CONNECTION_ERROR: '연결 실패',
  RATE_LIMITED: '요청 제한',
  UNKNOWN: '알 수 없는 오류',
};

const EXPORT_OPTIONS = [
  { label: 'CSV', value: 'csv' },
  { label: 'Excel', value: 'xlsx' },
  { label: 'JSON', value: 'json' },
  { label: '클립보드 복사', value: 'clipboard' },
];

function toClipboardText(result: QueryResult): string {
  const header = result.columns.map((c) => c.name).join('\t');
  const lines = result.rows.map((row) => result.columns.map((c) => String(row[c.name] ?? '')).join('\t'));
  return [header, ...lines].join('\n');
}

export function QueryResultPanel({
  status,
  result,
  error,
  queuePosition,
  elapsedSeconds,
  onCancel,
  queryId,
  queryName,
}: QueryResultPanelProps) {
  const [exporting, setExporting] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string>();

  async function handleExport(format: string) {
    if (!result) return;
    if (format === 'clipboard') {
      await navigator.clipboard.writeText(toClipboardText(result));
      setCopyMessage('클립보드에 복사되었습니다.');
      setTimeout(() => setCopyMessage(undefined), 2000);
      return;
    }
    if (!queryId) return;
    setExporting(true);
    try {
      if (result.rows.length > 100000) {
        window.alert('대용량 파일입니다. 다운로드에 시간이 걸릴 수 있습니다.');
      }
      await api.queries.exportResult(queryId, format as ExportFormat, queryName ?? 'query');
    } finally {
      setExporting(false);
    }
  }

  if (status === 'queued') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-qd-neutral-500">
        <div>대기 중... {queuePosition ? `(앞에 ${queuePosition - 1}개 쿼리)` : ''}</div>
        {onCancel && (
          <Button variant="secondary" size="sm" onClick={onCancel}>
            취소
          </Button>
        )}
      </div>
    );
  }

  if (status === 'running') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-qd-neutral-500">
        <div>실행 중... ({(elapsedSeconds ?? 0).toFixed(1)}초 경과)</div>
        {onCancel && (
          <Button variant="danger" size="sm" onClick={onCancel}>
            취소
          </Button>
        )}
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-qd-neutral-400">
        쿼리가 취소되었습니다.
      </div>
    );
  }

  if (status === 'failed' && error) {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-qd-md border border-qd-error bg-red-50 p-3 text-sm text-qd-error">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <Tag tone="error">{ERROR_LABELS[error.code]}</Tag>
            {error.line !== undefined && (
              <span className="text-xs">
                {error.line}번째 줄, {error.column}번째 열
              </span>
            )}
          </div>
          <pre className="whitespace-pre-wrap font-mono text-xs">{error.message}</pre>
        </div>
      </div>
    );
  }

  if (status === 'completed' && result) {
    return (
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden p-3">
        <div className="mb-2 flex shrink-0 items-center justify-end gap-2">
          {copyMessage && <span className="text-xs text-qd-success">{copyMessage}</span>}
          <Dropdown
            placeholder={exporting ? '내보내는 중...' : '내보내기 ▾'}
            options={EXPORT_OPTIONS}
            onChange={handleExport}
            className="w-36"
          />
        </div>
        <div className="min-h-0 flex-1">
          <DataTable
            columns={result.columns.map((c) => ({ key: c.name, label: c.name, type: c.type }))}
            rows={result.rows}
            runtimeSeconds={result.runtimeSeconds}
            height="100%"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center text-sm text-qd-neutral-400">
      쿼리를 실행하면 결과가 여기에 표시됩니다.
    </div>
  );
}
