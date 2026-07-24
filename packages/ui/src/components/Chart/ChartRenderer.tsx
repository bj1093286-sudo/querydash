import React, { useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { ChartConfig, QueryResult, VisualizationType } from '@querydash/types';
import {
  buildLineChartOption,
  buildBarChartOption,
  buildAreaChartOption,
  buildPieChartOption,
  buildScatterChartOption,
  buildBubbleChartOption,
  buildFunnelChartOption,
  buildHeatmapChartOption,
  buildBoxPlotChartOption,
  buildWordCloudChartOption,
  buildSankeyChartOption,
  buildSunburstChartOption,
} from './types';
import { Counter } from '../Counter';
import { PivotTable } from '../Table';

export interface ChartRendererProps {
  type: VisualizationType;
  data: QueryResult;
  config: ChartConfig;
  width?: number | string;
  height?: number | string;
  loading?: boolean;
  onConfigChange?: (config: ChartConfig) => void;
}

type ChartOptionBuilder = (data: QueryResult, config: ChartConfig) => EChartsOption;

const CHART_BUILDERS: Partial<Record<VisualizationType, ChartOptionBuilder>> = {
  line: buildLineChartOption,
  bar: buildBarChartOption,
  area: buildAreaChartOption,
  pie: buildPieChartOption,
  scatter: buildScatterChartOption,
  bubble: buildBubbleChartOption,
  funnel: buildFunnelChartOption,
  heatmap: buildHeatmapChartOption,
  boxplot: buildBoxPlotChartOption,
  wordcloud: buildWordCloudChartOption,
  sankey: buildSankeyChartOption,
  sunburst: buildSunburstChartOption,
};

// Counter and Pivot Table aren't ECharts option builders - they render their
// own plain components directly from the raw query result + config.
const CUSTOM_RENDERERS: Partial<
  Record<VisualizationType, React.ComponentType<{ data: QueryResult; config: ChartConfig }>>
> = {
  counter: Counter,
  pivot: PivotTable,
};

export function ChartRenderer({ type, data, config, width = '100%', height = 360, loading }: ChartRendererProps) {
  const builder = CHART_BUILDERS[type];
  const CustomRenderer = CUSTOM_RENDERERS[type];
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReactECharts>(null);

  // echarts-for-react only re-sizes on the window's resize event; it doesn't
  // notice the chart's own container shrinking/growing (e.g. the schema
  // sidebar collapsing, or a dashboard widget being resized), so drive that
  // explicitly with a ResizeObserver.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      chartRef.current?.getEchartsInstance().resize();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const option = useMemo(() => {
    if (!builder || !config.xAxis || config.yAxis.length === 0) return undefined;
    return builder(data, config);
  }, [builder, data, config]);

  if (CustomRenderer) {
    return (
      <div style={{ width, height }}>
        <CustomRenderer data={data} config={config} />
      </div>
    );
  }

  if (!builder) {
    return (
      <div
        className="flex items-center justify-center text-sm text-qd-neutral-400"
        style={{ width, height }}
      >
        아직 지원하지 않는 차트 유형입니다: {type}
      </div>
    );
  }

  if (!option) {
    return (
      <div
        className="flex items-center justify-center text-sm text-qd-neutral-400"
        style={{ width, height }}
      >
        X축과 Y축 컬럼을 선택하세요.
      </div>
    );
  }

  // ECharts can fail to fully redraw when the chart's structural shape changes
  // (e.g. bars going from grouped to stacked, or Group By pivoting the series
  // list) even with notMerge. Keying on those structural inputs forces a clean
  // remount instead of a partial, sometimes-broken in-place update.
  const structuralKey = `${type}:${config.stacking ?? 'none'}:${config.groupBy ?? ''}:${
    Object.values(config.seriesOptions ?? {}).some((o) => o.yAxis === 1) ? 'dual' : 'single'
  }`;

  return (
    <div ref={containerRef} style={{ width, height, minWidth: 0 }}>
      <ReactECharts
        key={structuralKey}
        ref={chartRef}
        option={option}
        style={{ width: '100%', height: '100%' }}
        showLoading={loading}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
