import type { EChartsOption } from 'echarts';
import type { ChartConfig, QueryResult } from '@querydash/types';
import { resolveColorPalette, resolveDataLabel, resolveLabelLayout, resolveLegend, resolveYAxisType } from './shared';

export function buildScatterChartOption(data: QueryResult, config: ChartConfig): EChartsOption {
  const series = config.yAxis.map((yKey) => {
    const override = config.seriesOptions?.[yKey];
    return {
      name: yKey,
      type: 'scatter' as const,
      data: data.rows.map((row) => [Number(row[config.xAxis] ?? 0), Number(row[yKey] ?? 0)]),
      itemStyle: override?.color ? { color: override.color } : undefined,
      z: override?.zIndex,
      label: resolveDataLabel(config, 'top'),
      labelLayout: resolveLabelLayout(),
    };
  });

  return {
    color: resolveColorPalette(config),
    legend: resolveLegend(config),
    grid: { left: 48, right: 24, top: 24, bottom: 40, containLabel: true },
    tooltip: { trigger: 'item' },
    xAxis: {
      type: 'value',
      name: config.xAxisOptions?.label,
    },
    yAxis: {
      type: resolveYAxisType(config),
      name: config.yAxisOptions?.[0]?.label,
      min: config.yAxisOptions?.[0]?.min,
      max: config.yAxisOptions?.[0]?.max,
    },
    series,
  };
}
