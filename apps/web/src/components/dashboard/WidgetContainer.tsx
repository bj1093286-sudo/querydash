'use client';

import { useEffect, useState } from 'react';
import { ChartRenderer, DataTable, useQueryExecution } from '@querydash/ui';
import type { ChartConfig, VisualizationType, Widget as WidgetModel } from '@querydash/types';
import { api, API_BASE_URL } from '../../lib/api';
import { getAuthHeaders } from '../../lib/authHeaders';

export interface WidgetContainerProps {
  widget: WidgetModel;
  extraParams?: Record<string, unknown>;
  refreshSignal: number;
}

export function WidgetContainer({ widget, extraParams, refreshSignal }: WidgetContainerProps) {
  const execution = useQueryExecution({ apiBaseUrl: API_BASE_URL, getAuthHeaders });
  const [visualization, setVisualization] = useState<{ type: VisualizationType; options: ChartConfig } | null>(null);
  const paramsKey = JSON.stringify(extraParams ?? {});

  useEffect(() => {
    if (!widget.visualizationId) return;
    let cancelled = false;
    api.visualizations.get(widget.visualizationId).then((vis) => {
      if (!cancelled) setVisualization({ type: vis.type, options: vis.options });
    });
    return () => {
      cancelled = true;
    };
  }, [widget.visualizationId]);

  useEffect(() => {
    if (!widget.queryId) return;
    execution.execute(widget.queryId, extraParams ?? {});
    // paramsKey/refreshSignal intentionally drive re-execution; execution.execute is a stable callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget.queryId, paramsKey, refreshSignal, execution.execute]);

  if (!widget.visualizationId) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-qd-neutral-400">
        시각화가 연결되어 있지 않습니다.
      </div>
    );
  }

  if (execution.status === 'queued' || execution.status === 'running') {
    return <div className="flex h-full items-center justify-center text-xs text-qd-neutral-400">불러오는 중...</div>;
  }

  if (execution.status === 'failed') {
    return (
      <div className="flex h-full items-center justify-center p-2 text-center text-xs text-qd-error">
        {execution.error?.message ?? '실행 오류'}
      </div>
    );
  }

  if (!execution.result || !visualization) {
    return <div className="flex h-full items-center justify-center text-xs text-qd-neutral-400">데이터 없음</div>;
  }

  if (visualization.type === 'table') {
    return (
      <DataTable
        columns={execution.result.columns.map((c) => ({ key: c.name, label: c.name, type: c.type }))}
        rows={execution.result.rows}
        runtimeSeconds={execution.result.runtimeSeconds}
        height="100%"
      />
    );
  }

  return <ChartRenderer type={visualization.type} data={execution.result} config={visualization.options} height="100%" />;
}
