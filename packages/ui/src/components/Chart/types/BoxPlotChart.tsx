import type { EChartsOption } from 'echarts';
import type { ChartConfig, QueryResult } from '@querydash/types';
import { resolveColorPalette } from './shared';

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function computeBoxStats(values: number[]): [number, number, number, number, number] {
  const sorted = [...values].sort((a, b) => a - b);
  return [sorted[0], quantile(sorted, 0.25), quantile(sorted, 0.5), quantile(sorted, 0.75), sorted[sorted.length - 1]];
}

/** Box plot: groups rows by xAxis and computes a five-number summary of yAxis[0]. */
export function buildBoxPlotChartOption(data: QueryResult, config: ChartConfig): EChartsOption {
  const categoryKey = config.xAxis;
  const valueKey = config.yAxis[0];

  const groups = new Map<string, number[]>();
  const categories: string[] = [];
  for (const row of data.rows) {
    const category = String(row[categoryKey] ?? '');
    const value = row[valueKey];
    const num = typeof value === 'number' ? value : Number(value ?? 0);
    if (!groups.has(category)) {
      groups.set(category, []);
      categories.push(category);
    }
    groups.get(category)!.push(num);
  }

  const boxData = categories.map((c) => computeBoxStats(groups.get(c) ?? []));

  return {
    color: resolveColorPalette(config),
    tooltip: { trigger: 'item' },
    grid: { left: 48, right: 24, top: 24, bottom: 40, containLabel: true },
    xAxis: { type: 'category', data: categories, name: config.xAxisOptions?.label },
    yAxis: {
      type: 'value',
      name: config.yAxisOptions?.[0]?.label,
      min: config.yAxisOptions?.[0]?.min,
      max: config.yAxisOptions?.[0]?.max,
    },
    series: [
      {
        name: valueKey,
        type: 'boxplot',
        data: boxData,
      },
    ],
  };
}
