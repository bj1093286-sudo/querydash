import React, { useState } from 'react';
import type { AxisOption, ChartConfig, QueryResult, SeriesOption, VisualizationType } from '@querydash/types';
import { Dropdown, Input, Tabs } from '../common';
import { resolveSeriesKeys } from './types/shared';

export interface ChartEditorProps {
  visualizationType: VisualizationType;
  config: ChartConfig;
  data?: QueryResult;
  onVisualizationTypeChange: (type: VisualizationType) => void;
  onConfigChange: (config: ChartConfig) => void;
}

const CHART_TYPE_OPTIONS: Array<{ label: string; value: VisualizationType }> = [
  { label: '라인 차트', value: 'line' },
  { label: '바 차트', value: 'bar' },
  { label: '영역 차트', value: 'area' },
  { label: '파이 차트', value: 'pie' },
  { label: '산점도', value: 'scatter' },
  { label: '버블 차트', value: 'bubble' },
  { label: '퍼널 차트', value: 'funnel' },
  { label: '히트맵', value: 'heatmap' },
  { label: '박스 플롯', value: 'boxplot' },
  { label: '워드 클라우드', value: 'wordcloud' },
  { label: '생키 다이어그램', value: 'sankey' },
  { label: '선버스트 차트', value: 'sunburst' },
  { label: '카운터', value: 'counter' },
  { label: '피벗 테이블', value: 'pivot' },
];

const SCALE_OPTIONS = [
  { label: '선형', value: 'linear' },
  { label: '로그', value: 'log' },
];

const STACKING_OPTIONS = [
  { label: '없음', value: 'none' },
  { label: '쌓기', value: 'stack' },
  { label: '쌓기 (%)', value: 'percent' },
];

const SERIES_TYPE_OPTIONS = [
  { label: '라인', value: 'line' },
  { label: '바', value: 'bar' },
  { label: '영역', value: 'area' },
];

const Y_AXIS_SIDE_OPTIONS = [
  { label: '왼쪽', value: '0' },
  { label: '오른쪽', value: '1' },
];

const DECIMALS_OPTIONS = [
  { label: '0자리', value: '0' },
  { label: '1자리', value: '1' },
  { label: '2자리', value: '2' },
  { label: '3자리', value: '3' },
];

export function ChartEditor({ visualizationType, config, data, onVisualizationTypeChange, onConfigChange }: ChartEditorProps) {
  const [tab, setTab] = useState('general');
  const columns = data?.columns.map((c) => c.name) ?? [];
  const seriesKeys = resolveSeriesKeys(config, data);

  function toggleYAxis(column: string) {
    const yAxis = config.yAxis.includes(column)
      ? config.yAxis.filter((c) => c !== column)
      : [...config.yAxis, column];
    onConfigChange({ ...config, yAxis });
  }

  function updateXAxisOptions(patch: Partial<AxisOption>) {
    onConfigChange({ ...config, xAxisOptions: { ...config.xAxisOptions, ...patch } });
  }

  function updateYAxisOptions(patch: Partial<AxisOption>) {
    const current = config.yAxisOptions?.[0] ?? {};
    onConfigChange({ ...config, yAxisOptions: [{ ...current, ...patch }] });
  }

  function updateSeriesOption(key: string, patch: Partial<SeriesOption>) {
    const current = config.seriesOptions?.[key] ?? {};
    onConfigChange({
      ...config,
      seriesOptions: { ...config.seriesOptions, [key]: { ...current, ...patch } },
    });
  }

  function updateDataLabels(patch: Partial<ChartConfig['dataLabels']>) {
    onConfigChange({
      ...config,
      dataLabels: { enabled: config.dataLabels?.enabled ?? true, decimals: config.dataLabels?.decimals ?? 2, ...patch },
    });
  }

  return (
    <div className="qd-root flex w-72 min-w-[240px] shrink-0 flex-col border-l border-qd-neutral-200 bg-white">
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'general', label: '일반' },
          { key: 'xAxis', label: 'X축' },
          { key: 'yAxis', label: 'Y축' },
          { key: 'series', label: '시리즈' },
          { key: 'colors', label: '색상' },
        ]}
      />
      <div className="flex flex-col gap-4 overflow-y-auto p-3 text-sm">
        {tab === 'general' && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-qd-neutral-600">차트 타입</label>
              <Dropdown
                value={visualizationType}
                options={CHART_TYPE_OPTIONS}
                onChange={(value) => onVisualizationTypeChange(value as VisualizationType)}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-qd-neutral-600">X축</label>
              <Dropdown
                value={config.xAxis || undefined}
                placeholder="컬럼 선택"
                options={columns.map((c) => ({ label: c, value: c }))}
                onChange={(value) => onConfigChange({ ...config, xAxis: value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-qd-neutral-600">Y축</label>
              <div className="flex flex-col gap-1.5">
                {columns.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-qd-neutral-700">
                    <input type="checkbox" checked={config.yAxis.includes(c)} onChange={() => toggleYAxis(c)} />
                    {c}
                  </label>
                ))}
                {columns.length === 0 && <p className="text-xs text-qd-neutral-400">사용 가능한 컬럼이 없습니다.</p>}
              </div>
              {config.groupBy && (
                <p className="mt-1 text-xs text-qd-neutral-400">
                  그룹별 사용 시 첫 번째로 선택한 컬럼만 값으로 사용됩니다.
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-qd-neutral-600">그룹별</label>
              <Dropdown
                value={config.groupBy || undefined}
                placeholder="없음"
                options={columns.map((c) => ({ label: c, value: c }))}
                onChange={(value) => onConfigChange({ ...config, groupBy: value })}
                className="w-full"
              />
              {config.groupBy && (
                <button
                  type="button"
                  onClick={() => onConfigChange({ ...config, groupBy: undefined })}
                  className="mt-1 text-xs text-qd-primary-500 hover:underline"
                >
                  지우기
                </button>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-qd-neutral-600">쌓기</label>
              <Dropdown
                value={config.stacking ?? 'none'}
                options={STACKING_OPTIONS}
                onChange={(value) => onConfigChange({ ...config, stacking: value as ChartConfig['stacking'] })}
                className="w-full"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-qd-neutral-700">
                <input
                  type="checkbox"
                  checked={config.dataLabels?.enabled ?? true}
                  onChange={(e) => updateDataLabels({ enabled: e.target.checked })}
                />
                데이터 라벨
              </label>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-qd-neutral-600">소수점 자릿수</label>
              <Dropdown
                value={String(config.dataLabels?.decimals ?? 2)}
                options={DECIMALS_OPTIONS}
                onChange={(value) => updateDataLabels({ decimals: Number(value) })}
                className="w-full"
              />
            </div>
          </>
        )}

        {tab === 'xAxis' && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-qd-neutral-600">라벨</label>
              <Input
                value={config.xAxisOptions?.label ?? ''}
                onChange={(e) => updateXAxisOptions({ label: e.target.value })}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-qd-neutral-700">
                <input
                  type="checkbox"
                  checked={config.xAxisOptions?.sort ?? false}
                  onChange={(e) => updateXAxisOptions({ sort: e.target.checked })}
                />
                오름차순 정렬
              </label>
            </div>
          </>
        )}

        {tab === 'yAxis' && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-qd-neutral-600">라벨</label>
              <Input
                value={config.yAxisOptions?.[0]?.label ?? ''}
                onChange={(e) => updateYAxisOptions({ label: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-qd-neutral-600">최소</label>
                <Input
                  type="number"
                  value={config.yAxisOptions?.[0]?.min ?? ''}
                  onChange={(e) =>
                    updateYAxisOptions({ min: e.target.value === '' ? undefined : Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-qd-neutral-600">최대</label>
                <Input
                  type="number"
                  value={config.yAxisOptions?.[0]?.max ?? ''}
                  onChange={(e) =>
                    updateYAxisOptions({ max: e.target.value === '' ? undefined : Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-qd-neutral-600">스케일</label>
              <Dropdown
                value={config.yAxisOptions?.[0]?.scale ?? 'linear'}
                options={SCALE_OPTIONS}
                onChange={(value) => updateYAxisOptions({ scale: value as AxisOption['scale'] })}
                className="w-full"
              />
            </div>
          </>
        )}

        {tab === 'series' && (
          <>
            {seriesKeys.length === 0 && (
              <p className="text-xs text-qd-neutral-400">Y축(또는 그룹별) 컬럼을 먼저 선택하세요.</p>
            )}
            {seriesKeys.map((key) => {
              const option = config.seriesOptions?.[key] ?? {};
              return (
                <div key={key} className="rounded-qd-md border border-qd-neutral-200 p-2">
                  <div className="mb-2 truncate text-xs font-semibold text-qd-neutral-700">{key}</div>
                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-qd-neutral-500">타입</label>
                      <Dropdown
                        value={option.type ?? 'line'}
                        options={SERIES_TYPE_OPTIONS}
                        onChange={(value) => updateSeriesOption(key, { type: value as SeriesOption['type'] })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-qd-neutral-500">Y축</label>
                      <Dropdown
                        value={String(option.yAxis ?? 0)}
                        options={Y_AXIS_SIDE_OPTIONS}
                        onChange={(value) => updateSeriesOption(key, { yAxis: Number(value) as 0 | 1 })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-qd-neutral-500">Z-인덱스</label>
                      <Input
                        type="number"
                        value={option.zIndex ?? ''}
                        onChange={(e) =>
                          updateSeriesOption(key, {
                            zIndex: e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {tab === 'colors' && (
          <>
            {seriesKeys.length === 0 && (
              <p className="text-xs text-qd-neutral-400">Y축(또는 그룹별) 컬럼을 먼저 선택하세요.</p>
            )}
            {seriesKeys.map((key, index) => {
              const option = config.seriesOptions?.[key] ?? {};
              const fallback = config.colorPalette?.[index % (config.colorPalette.length || 1)];
              return (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="truncate text-qd-neutral-700">{key}</span>
                  <input
                    type="color"
                    value={option.color ?? fallback ?? '#2196F3'}
                    onChange={(e) => updateSeriesOption(key, { color: e.target.value })}
                    className="h-7 w-10 shrink-0 cursor-pointer rounded-qd-sm border border-qd-neutral-200"
                  />
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
