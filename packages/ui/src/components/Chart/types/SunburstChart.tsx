import type { EChartsOption } from 'echarts';
import type { ChartConfig, QueryResult } from '@querydash/types';
import { resolveColorPalette } from './shared';

/** Sunburst: xAxis is the outer-ring parent category, groupBy is the inner child category, yAxis[0] is the value. */
export function buildSunburstChartOption(data: QueryResult, config: ChartConfig): EChartsOption {
  const parentKey = config.xAxis;
  const childKey = config.groupBy;
  const valueKey = config.yAxis[0];

  const parents = new Map<string, Map<string, number>>();
  for (const row of data.rows) {
    const parent = String(row[parentKey] ?? '');
    const child = childKey ? String(row[childKey] ?? '') : parent;
    const value = row[valueKey];
    const num = typeof value === 'number' ? value : Number(value ?? 0);

    if (!parents.has(parent)) parents.set(parent, new Map());
    const children = parents.get(parent)!;
    children.set(child, (children.get(child) ?? 0) + num);
  }

  const seriesData = Array.from(parents.entries()).map(([name, children]) => {
    if (!childKey) {
      return { name, value: Array.from(children.values())[0] ?? 0 };
    }
    return {
      name,
      children: Array.from(children.entries()).map(([childName, value]) => ({ name: childName, value })),
    };
  });

  return {
    color: resolveColorPalette(config),
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'sunburst',
        radius: ['15%', '80%'],
        data: seriesData,
        label: { show: config.dataLabels?.enabled ?? true },
      },
    ],
  };
}
