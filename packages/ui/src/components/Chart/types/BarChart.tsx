import type { EChartsOption } from 'echarts';
import type { ChartConfig, QueryResult } from '@querydash/types';
import {
  applyPercentStacking,
  buildCategoriesAndSeries,
  buildSeriesBase,
  buildYAxes,
  resolveCategoryAxisLabel,
  resolveColorPalette,
  resolveLegend,
} from './shared';

export function buildBarChartOption(data: QueryResult, config: ChartConfig): EChartsOption {
  let { categories, series } = buildCategoriesAndSeries(data, config);
  const stack = config.stacking && config.stacking !== 'none' ? 'total' : undefined;
  if (config.stacking === 'percent') {
    series = applyPercentStacking(series);
  }

  return {
    color: resolveColorPalette(config),
    legend: resolveLegend(config),
    grid: { left: 48, right: 24, top: 24, bottom: 40, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: categories,
      name: config.xAxisOptions?.label,
      axisLabel: resolveCategoryAxisLabel(categories),
    },
    yAxis: buildYAxes(config),
    series: series.map((s) => ({ ...buildSeriesBase(s.key, s.values, config, 'bar'), stack })),
  };
}
