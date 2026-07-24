import type { EChartsOption } from 'echarts';
import type { ChartConfig, QueryResult } from '@querydash/types';
import {
  buildCategoriesAndSeries,
  buildSeriesBase,
  buildYAxes,
  resolveCategoryAxisLabel,
  resolveColorPalette,
  resolveLegend,
} from './shared';

export function buildLineChartOption(data: QueryResult, config: ChartConfig): EChartsOption {
  const { categories, series } = buildCategoriesAndSeries(data, config);

  return {
    color: resolveColorPalette(config),
    legend: resolveLegend(config),
    grid: { left: 48, right: 24, top: 24, bottom: 40, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: categories,
      name: config.xAxisOptions?.label,
      axisLabel: resolveCategoryAxisLabel(categories),
    },
    yAxis: buildYAxes(config),
    series: series.map((s) => buildSeriesBase(s.key, s.values, config, 'line')),
  };
}
