'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DashboardGrid,
  Widget,
  TextWidget,
  Button,
  Dropdown,
  Modal,
  ParameterPanel,
  groupParameters,
  extractParameterNames,
  type WidgetLayoutUpdate,
} from '@querydash/ui';
import type { Dashboard, Widget as WidgetModel, Parameter, RefreshInterval } from '@querydash/types';
import type { DateRangeValue } from '@querydash/ui';
import { api } from '../../lib/api';
import { WidgetContainer } from './WidgetContainer';
import { AddWidgetModal } from './AddWidgetModal';

export interface DashboardViewProps {
  dashboardId: string;
}

const REFRESH_OPTIONS = [
  { label: '끔', value: '' },
  { label: '1분', value: '60' },
  { label: '5분', value: '300' },
  { label: '10분', value: '600' },
  { label: '30분', value: '1800' },
  { label: '1시간', value: '3600' },
];

export function DashboardView({ dashboardId }: DashboardViewProps) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<WidgetModel[]>([]);
  const [queryParams, setQueryParams] = useState<Record<string, Parameter[]>>({});
  const [filterValue, setFilterValue] = useState<DateRangeValue>({ start: '', end: '' });
  const [editing, setEditing] = useState(false);
  const [addingWidget, setAddingWidget] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const loadAll = useCallback(async () => {
    const [dash, widgetList] = await Promise.all([
      api.dashboards.get(dashboardId),
      api.dashboards.listWidgets(dashboardId),
    ]);
    setDashboard(dash);
    setWidgets(widgetList);

    const uniqueQueryIds = Array.from(
      new Set(widgetList.map((w) => w.queryId).filter((v): v is string => Boolean(v)))
    );
    const queries = await Promise.all(uniqueQueryIds.map((qid) => api.queries.get(qid).catch(() => undefined)));
    const paramsMap: Record<string, Parameter[]> = {};
    queries.forEach((q, idx) => {
      if (!q) return;
      paramsMap[uniqueQueryIds[idx]] = groupParameters(extractParameterNames(q.sqlText));
    });
    setQueryParams(paramsMap);
    setLoading(false);
  }, [dashboardId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Auto-detect a single dashboard-wide "기간" (period) filter: the first
  // date-range parameter shared by any widget's underlying query.
  const filterParamName = useMemo(() => {
    for (const params of Object.values(queryParams)) {
      const rangeParam = params.find((p) => p.type === 'date-range');
      if (rangeParam) return rangeParam.name;
    }
    return undefined;
  }, [queryParams]);

  const affectedQueryIds = useMemo(() => {
    if (!filterParamName) return new Set<string>();
    const ids = new Set<string>();
    for (const [queryId, params] of Object.entries(queryParams)) {
      if (params.some((p) => p.name === filterParamName)) ids.add(queryId);
    }
    return ids;
  }, [queryParams, filterParamName]);

  useEffect(() => {
    if (!dashboard?.refreshInterval) return;
    const interval = setInterval(() => setRefreshTick((t) => t + 1), dashboard.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [dashboard?.refreshInterval]);

  async function handleRefreshIntervalChange(value: string) {
    const parsed = value ? (Number(value) as RefreshInterval) : null;
    const updated = await api.dashboards.update(dashboardId, { refreshInterval: parsed });
    setDashboard(updated);
  }

  async function handleLayoutSettled(layout: WidgetLayoutUpdate[]) {
    setWidgets((prev) =>
      prev.map((w) => {
        const match = layout.find((l) => l.id === w.id);
        return match ? { ...w, options: { x: match.x, y: match.y, w: match.w, h: match.h } } : w;
      })
    );
    await api.dashboards.updateWidgetsLayout(
      dashboardId,
      layout.map((l) => ({ id: l.id, options: { x: l.x, y: l.y, w: l.w, h: l.h } }))
    );
  }

  async function handleRemoveWidget(widgetId: string) {
    await api.widgets.delete(widgetId);
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
  }

  async function handleDeleteDashboard() {
    if (!dashboard) return;
    if (!window.confirm(`"${dashboard.name}" 대시보드를 삭제하시겠습니까? 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    try {
      await api.dashboards.delete(dashboardId);
      router.push('/dashboards');
    } finally {
      setDeleting(false);
    }
  }

  if (loading || !dashboard) {
    return <div className="flex flex-1 items-center justify-center text-sm text-qd-neutral-400">불러오는 중...</div>;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-qd-neutral-200 bg-white px-4 py-2.5">
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-qd-neutral-800">{dashboard.name}</h1>
        <Dropdown
          value={dashboard.refreshInterval ? String(dashboard.refreshInterval) : ''}
          options={REFRESH_OPTIONS}
          onChange={handleRefreshIntervalChange}
          placeholder="자동 새로고침"
          className="w-28"
        />
        <Button variant={editing ? 'primary' : 'secondary'} size="sm" onClick={() => setEditing((e) => !e)}>
          {editing ? '편집 완료' : '편집'}
        </Button>
        {editing && (
          <Button variant="secondary" size="sm" onClick={() => setAddingWidget(true)}>
            + 위젯 추가
          </Button>
        )}
        <Button variant="danger" size="sm" onClick={handleDeleteDashboard} loading={deleting}>
          삭제
        </Button>
      </div>

      {filterParamName && (
        <ParameterPanel
          parameters={[{ name: filterParamName, type: 'date-range', title: '기간' }]}
          values={{ [filterParamName]: filterValue }}
          onChange={(_key, value) => setFilterValue(value as DateRangeValue)}
          onApply={() => setRefreshTick((t) => t + 1)}
        />
      )}

      <div className="flex-1 overflow-auto p-4">
        {widgets.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-qd-neutral-400">
            위젯이 없습니다. {editing ? '+ 위젯 추가로 추가하세요.' : '편집 모드에서 위젯을 추가하세요.'}
          </div>
        ) : (
          <DashboardGrid
            widgets={widgets}
            editing={editing}
            onLayoutSettled={handleLayoutSettled}
            renderWidget={(widget) => {
              if (widget.text !== undefined) {
                return (
                  <Widget title="텍스트" editing={editing} onRemove={() => handleRemoveWidget(widget.id)}>
                    <TextWidget text={widget.text} />
                  </Widget>
                );
              }
              const extraParams =
                widget.queryId && filterParamName && affectedQueryIds.has(widget.queryId)
                  ? { [`${filterParamName}.start`]: filterValue.start, [`${filterParamName}.end`]: filterValue.end }
                  : undefined;
              return (
                <Widget
                  title={widget.visualizationName ?? widget.queryName}
                  editing={editing}
                  onRemove={() => handleRemoveWidget(widget.id)}
                >
                  <WidgetContainer widget={widget} extraParams={extraParams} refreshSignal={refreshTick} />
                </Widget>
              );
            }}
          />
        )}
      </div>

      <Modal open={addingWidget} onClose={() => setAddingWidget(false)} title="위젯 추가" width={520}>
        <AddWidgetModal
          onAdd={async (input) => {
            const maxY = widgets.reduce((max, w) => Math.max(max, w.options.y + w.options.h), 0);
            await api.dashboards.addWidget(dashboardId, { ...input, options: { ...input.options, y: maxY } });
            setAddingWidget(false);
            await loadAll();
          }}
        />
      </Modal>
    </div>
  );
}
