import type { EChartsOption } from 'echarts';
import type { ChartConfig, QueryResult } from '@querydash/types';
import { formatValue, resolveColorPalette, resolveDecimals, resolveLabelLayout, resolveLegend } from './shared';

/** Funnel: xAxis is the stage name, yAxis[0] is the stage value. */
export function buildFunnelChartOption(data: QueryResult, config: ChartConfig): EChartsOption {
  const nameKey = config.xAxis;
  const valueKey = config.yAxis[0];
  const decimals = resolveDecimals(config);

  const seriesData = data.rows.map((row) => {
    const value = row[valueKey];
    return {
      name: String(row[nameKey] ?? ''),
      value: typeof value === 'number' ? value : Number(value ?? 0),
    };
  });

  return {
    color: resolveColorPalette(config),
    legend: resolveLegend(config),
    tooltip: { trigger: 'item' },
    series: [
      {
        name: valueKey,
        type: 'funnel',
        left: '10%',
        right: '10%',
        sort: 'descending',
        data: seriesData,
        label: {
          show: config.dataLabels?.enabled ?? true,
          position: 'inside',
          formatter: (params: { name?: string; value?: unknown }) =>
            `${params.name}: ${formatValue(typeof params.value === 'number' ? params.value : Number(params.value ?? 0), decimals)}`,
        },
        labelLayout: resolveLabelLayout(),
      },
    ],
  };
}
