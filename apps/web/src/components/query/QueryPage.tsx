'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  SQLEditor,
  SchemaTree,
  Dropdown,
  Button,
  Input,
  Modal,
  ParameterPanel,
  useSchema,
  useQueryExecution,
  useDetectedParameters,
  isParameterMissing,
  flattenParameterValues,
  type SQLEditorHandle,
} from '@querydash/ui';
import type { ChartConfig, VisualizationType } from '@querydash/types';
import { api, API_BASE_URL } from '../../lib/api';
import { getAuthHeaders } from '../../lib/authHeaders';
import { useQueryStore } from '../../store/queryStore';
import { useDatasourceStore } from '../../store/datasourceStore';
import { QueryResultPanel } from './QueryResultPanel';
import { ChartPanel } from './ChartPanel';
import { VisualizationTabs } from './VisualizationTabs';
import { QueryVersionHistoryModal } from './QueryVersionHistoryModal';

export interface QueryPageProps {
  queryId: string | 'new';
}

export function QueryPage({ queryId }: QueryPageProps) {
  const editorRef = useRef<SQLEditorHandle>(null);
  const [activeTab, setActiveTab] = useState('table');
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chartType, setChartType] = useState<VisualizationType>('line');
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    xAxis: '',
    yAxis: [],
    dataLabels: { enabled: true, decimals: 2 },
  });
  const [parameterValues, setParameterValues] = useState<Record<string, unknown>>({});
  const [folder, setFolder] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const { id, name, sqlText, datasourceId, setName, setSqlText, setDatasourceId, loadQuery, markSaved, reset } =
    useQueryStore();

  const { items: datasources, fetchAll } = useDatasourceStore();
  const { schema, loading: schemaLoading, refresh: refreshSchema } = useSchema(datasourceId, API_BASE_URL, getAuthHeaders);
  const execution = useQueryExecution({ apiBaseUrl: API_BASE_URL, getAuthHeaders });

  const detectedParameters = useDetectedParameters(sqlText);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Drop values for parameters no longer referenced in the SQL text.
  useEffect(() => {
    const validNames = new Set(detectedParameters.map((p) => p.name));
    setParameterValues((prev) => {
      let changed = false;
      const next: Record<string, unknown> = {};
      for (const key of Object.keys(prev)) {
        if (validNames.has(key)) {
          next[key] = prev[key];
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [detectedParameters]);

  // A newly executed query can return a different column set than the one the
  // chart was configured against. Drop any axis/group-by selections that no
  // longer refer to a real column so the chart doesn't keep plotting phantom
  // zero-value series for removed columns.
  useEffect(() => {
    if (!execution.result) return;
    const validColumns = new Set(execution.result.columns.map((c) => c.name));
    setChartConfig((prev) => {
      const xAxis = validColumns.has(prev.xAxis) ? prev.xAxis : '';
      const yAxis = prev.yAxis.filter((c) => validColumns.has(c));
      const groupBy = prev.groupBy && validColumns.has(prev.groupBy) ? prev.groupBy : undefined;
      if (xAxis === prev.xAxis && yAxis.length === prev.yAxis.length && groupBy === prev.groupBy) {
        return prev;
      }
      return { ...prev, xAxis, yAxis, groupBy };
    });
  }, [execution.result]);

  // Tracks the queryId this component has already loaded/handled, so that navigating
  // via our own persist() -> window.history.replaceState() doesn't trigger a redundant
  // refetch that would clobber execution state we just set locally.
  const loadedQueryIdRef = useRef<string>('new');

  useEffect(() => {
    if (queryId === loadedQueryIdRef.current) return;
    loadedQueryIdRef.current = queryId;

    if (queryId === 'new') {
      reset();
      setFolder('');
      setTagsInput('');
      setIsFavorite(false);
      return;
    }
    api.queries.get(queryId).then((query) => {
      loadQuery({
        id: query.id,
        name: query.name,
        sqlText: query.sqlText,
        datasourceId: query.datasourceId,
      });
      setFolder(query.folder ?? '');
      setTagsInput(query.tags.join(', '));
      setIsFavorite(query.isFavorite);
    });
  }, [queryId, loadQuery, reset]);

  useEffect(() => {
    if (execution.status === 'failed' && execution.requiresConfirmation) {
      setPendingConfirm(true);
    }
  }, [execution.status, execution.requiresConfirmation]);

  function parsedTags(): string[] {
    return tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  async function persist(): Promise<string | undefined> {
    if (!datasourceId) return undefined;
    setSaving(true);
    try {
      const orgFields = { folder: folder.trim() || undefined, tags: parsedTags(), isFavorite };
      if (id) {
        await api.queries.update(id, { name, sqlText, datasourceId, ...orgFields });
        markSaved(id);
        return id;
      }
      const created = await api.queries.create({ name, sqlText, datasourceId, ...orgFields });
      markSaved(created.id);
      loadedQueryIdRef.current = created.id;
      // Update the URL bar without going through Next's router: /queries/new and
      // /queries/[id] are different route templates, so a router-driven navigation
      // would unmount and remount this component, dropping in-flight execution state.
      window.history.replaceState(null, '', `/queries/${created.id}`);
      return created.id;
    } finally {
      setSaving(false);
    }
  }

  async function toggleFavorite() {
    const next = !isFavorite;
    setIsFavorite(next);
    if (id) await api.queries.update(id, { isFavorite: next });
  }

  const missingParamNames = useMemo(
    () => detectedParameters.filter((p) => isParameterMissing(p, parameterValues[p.name])).map((p) => p.name),
    [detectedParameters, parameterValues]
  );

  async function handleExecute(confirmed = false) {
    if (missingParamNames.length > 0) return;
    const targetId = await persist();
    if (!targetId) return;
    const flatParams = flattenParameterValues(detectedParameters, parameterValues);
    await execution.execute(targetId, flatParams, confirmed);
  }

  async function handleConfirmRun() {
    setPendingConfirm(false);
    await handleExecute(true);
  }

  const canExecute = Boolean(datasourceId) && sqlText.trim().length > 0 && missingParamNames.length === 0;
  const isBusy = execution.status === 'queued' || execution.status === 'running';

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-qd-neutral-200 bg-white px-3 py-2">
        {id && (
          <button
            type="button"
            onClick={toggleFavorite}
            title="즐겨찾기"
            className={isFavorite ? 'text-qd-warning' : 'text-qd-neutral-300 hover:text-qd-warning'}
          >
            ★
          </button>
        )}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded-qd-sm border border-transparent px-2 py-1 text-sm font-medium hover:border-qd-neutral-200 focus:border-qd-neutral-200 focus:outline-none"
        />
        <Dropdown
          value={datasourceId}
          placeholder="데이터소스 선택"
          options={datasources.map((ds) => ({ label: ds.name, value: ds.id }))}
          onChange={setDatasourceId}
        />
        {id && (
          <Button variant="secondary" size="sm" onClick={() => setShowVersions(true)}>
            버전 기록
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={persist} loading={saving}>
          저장
        </Button>
        {isBusy ? (
          <Button variant="danger" size="sm" onClick={execution.cancel}>
            취소
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={() => handleExecute(false)} disabled={!canExecute}>
            실행
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-qd-neutral-200 bg-qd-neutral-50 px-3 py-1.5 text-xs">
        <span className="shrink-0 font-medium text-qd-neutral-500">폴더</span>
        <Input
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          placeholder="예: 마케팅/주간리포트"
          className="w-40 py-1 text-xs"
        />
        <span className="shrink-0 font-medium text-qd-neutral-500">태그</span>
        <Input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="쉼표로 구분 (예: 매출, 주간)"
          className="w-56 py-1 text-xs"
        />
      </div>

      <div className="flex min-w-0 flex-1 overflow-hidden">
        {schema && (
          <SchemaTree
            schema={schema}
            loading={schemaLoading}
            onRefresh={refreshSchema}
            onInsert={(text) => editorRef.current?.insertText(text)}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="p-3">
            <SQLEditor
              ref={editorRef}
              value={sqlText}
              onChange={setSqlText}
              onExecute={() => handleExecute(false)}
              onSave={persist}
              schema={schema}
              height={220}
              placeholder="SELECT * FROM ..."
            />
          </div>
          <ParameterPanel
            parameters={detectedParameters}
            values={parameterValues}
            onChange={(key, value) => setParameterValues((prev) => ({ ...prev, [key]: value }))}
            onApply={() => handleExecute(false)}
            invalidNames={missingParamNames}
            applying={isBusy}
          />
          <VisualizationTabs activeKey={activeTab} onChange={setActiveTab} />
          {activeTab === 'table' ? (
            <QueryResultPanel
              status={execution.status}
              result={execution.result}
              error={execution.error}
              queuePosition={execution.queuePosition}
              elapsedSeconds={execution.elapsedSeconds}
              onCancel={execution.cancel}
              queryId={id}
              queryName={name}
            />
          ) : (
            <ChartPanel
              result={execution.result}
              visualizationType={chartType}
              config={chartConfig}
              onVisualizationTypeChange={setChartType}
              onConfigChange={setChartConfig}
              queryId={id}
            />
          )}
        </div>
      </div>

      <Modal
        open={pendingConfirm}
        onClose={() => setPendingConfirm(false)}
        title="데이터 변경 쿼리 확인"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setPendingConfirm(false)}>
              취소
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmRun}>
              실행
            </Button>
          </>
        }
      >
        이 쿼리는 데이터를 변경하는 작업(DROP/DELETE/TRUNCATE/ALTER 등)을 포함하고 있습니다. 계속 진행하시겠습니까?
      </Modal>

      {id && (
        <QueryVersionHistoryModal
          open={showVersions}
          queryId={id}
          onClose={() => setShowVersions(false)}
          onReverted={(revertedSql) => setSqlText(revertedSql)}
        />
      )}
    </div>
  );
}
