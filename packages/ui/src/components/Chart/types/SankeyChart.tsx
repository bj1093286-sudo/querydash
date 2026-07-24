import type { EChartsOption } from 'echarts';
import type { ChartConfig, QueryResult } from '@querydash/types';
import { resolveColorPalette } from './shared';

/** Sankey: xAxis is the source node, groupBy is the target node, yAxis[0] is the flow value. */
export function buildSankeyChartOption(data: QueryResult, config: ChartConfig): EChartsOption {
  const sourceKey = config.xAxis;
  const targetKey = config.groupBy;
  const valueKey = config.yAxis[0];

  if (!targetKey) {
    return { series: [] };
  }

  const nodeNames = new Set<string>();
  const links = data.rows.map((row) => {
    const source = String(row[sourceKey] ?? '');
    const target = String(row[targetKey] ?? '');
    const value = row[valueKey];
    nodeNames.add(source);
    nodeNames.add(target);
    return { source, target, value: typeof value === 'number' ? value : Number(value ?? 0) };
  });

  return {
    color: resolveColorPalette(config),
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'sankey',
        data: Array.from(nodeNames).map((name) => ({ name })),
        links,
        emphasis: { focus: 'adjacency' },
        label: { show: config.dataLabels?.enabled ?? true },
      },
    ],
  };
}
