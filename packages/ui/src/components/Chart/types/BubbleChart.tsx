import type { EChartsOption } from 'echarts';
import type { ChartConfig, QueryResult } from '@querydash/types';
import { resolveColorPalette, resolveDataLabel, resolveLabelLayout, resolveLegend, resolveYAxisType } from './shared';

/**
 * Bubble charts need a third numeric dimension for bubble size. We reuse the
 * existing Y-axis multi-select for this: the first checked column is the Y
 * value, the second (if any) drives bubble size.
 */
export function buildBubbleChartOption(data: QueryResult, config: ChartConfig): EChartsOption {
  const yKey = config.yAxis[0];
  const sizeKey = config.yAxis[1];

  const points = data.rows.map((row) => [
    Number(row[config.xAxis] ?? 0),
    Number(row[yKey] ?? 0),
    sizeKey ? Number(row[sizeKey] ?? 0) : 1,
  ]);
  const maxSize = Math.max(1, ...points.map((p) => p[2]));

  const override = config.seriesOptions?.[yKey];

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
    series: [
      {
        name: yKey,
        type: 'scatter',
        data: points,
        symbolSize: (value: number[]) => 8 + (value[2] / maxSize) * 32,
        itemStyle: override?.color ? { color: override.color } : undefined,
        z: override?.zIndex,
        label: resolveDataLabel(config, 'top'),
        labelLayout: resolveLabelLayout(),
      },
    ],
  };
}
