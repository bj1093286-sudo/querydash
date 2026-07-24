import type { EChartsOption } from 'echarts';
import type { ChartConfig, QueryResult } from '@querydash/types';
import { formatValue, resolveDecimals } from './shared';

/**
 * Heatmap needs two categorical dimensions plus a value: xAxis is the X
 * category, yAxis[0] is the Y category, and yAxis[1] is the numeric value
 * (falls back to yAxis[0] if only one column was picked, treating it as
 * both category and value is meaningless, so a value column is required).
 */
export function buildHeatmapChartOption(data: QueryResult, config: ChartConfig): EChartsOption {
  const xKey = config.xAxis;
  const yKey = config.yAxis[0];
  const valueKey = config.yAxis[1] ?? config.yAxis[0];

  const xCategories: string[] = [];
  const xSeen = new Set<string>();
  const yCategories: string[] = [];
  const ySeen = new Set<string>();

  for (const row of data.rows) {
    const x = String(row[xKey] ?? '');
    const y = String(row[yKey] ?? '');
    if (!xSeen.has(x)) {
      xSeen.add(x);
      xCategories.push(x);
    }
    if (!ySeen.has(y)) {
      ySeen.add(y);
      yCategories.push(y);
    }
  }

  const seriesData = data.rows.map((row) => {
    const x = String(row[xKey] ?? '');
    const y = String(row[yKey] ?? '');
    const value = row[valueKey];
    return [xCategories.indexOf(x), yCategories.indexOf(y), typeof value === 'number' ? value : Number(value ?? 0)];
  });

  const values = seriesData.map((d) => d[2] as number);
  const max = values.length > 0 ? Math.max(...values) : 1;
  const min = values.length > 0 ? Math.min(...values) : 0;

  return {
    tooltip: { position: 'top' },
    grid: { left: 80, right: 24, top: 24, bottom: 60 },
    xAxis: {
      type: 'category',
      data: xCategories,
      splitArea: { show: true, areaStyle: { color: ['#FAFAFA', '#F0F0F0'] } },
    },
    yAxis: {
      type: 'category',
      data: yCategories,
      splitArea: { show: true, areaStyle: { color: ['#FAFAFA', '#F0F0F0'] } },
    },
    visualMap: {
      min,
      // ECharts' default visualMap gradient can end up with an undefined
      // color stop if min === max (a single distinct value in the data), so
      // always give it an explicit, well-defined color range.
      max: max > min ? max : min + 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: {
        color: ['#4DC4FF', '#FFD43B', '#FF6B6B'],
      },
    },
    series: [
      {
        type: 'heatmap',
        data: seriesData,
        label: {
          show: config.dataLabels?.enabled ?? true,
          formatter: (params: { value?: unknown }) => {
            const v = Array.isArray(params.value) ? params.value[2] : params.value;
            return formatValue(typeof v === 'number' ? v : Number(v ?? 0), resolveDecimals(config));
          },
        },
      },
    ],
  };
}
