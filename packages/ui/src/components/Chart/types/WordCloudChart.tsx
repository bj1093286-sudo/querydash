import type { EChartsOption } from 'echarts';
import type { ChartConfig, QueryResult } from '@querydash/types';
import { resolveColorPalette } from './shared';

// echarts-wordcloud touches `window` as soon as it's evaluated, which breaks
// Next.js server-side rendering/prerendering (client components still run
// once on the server for the initial HTML). Only register it in the browser.
if (typeof window !== 'undefined') {
  void import('echarts-wordcloud');
}

/** Word cloud: xAxis is the word/text, yAxis[0] is its weight. */
export function buildWordCloudChartOption(data: QueryResult, config: ChartConfig): EChartsOption {
  const nameKey = config.xAxis;
  const valueKey = config.yAxis[0];
  const palette = resolveColorPalette(config);

  const seriesData = data.rows.map((row) => {
    const value = row[valueKey];
    return {
      name: String(row[nameKey] ?? ''),
      value: typeof value === 'number' ? value : Number(value ?? 0),
    };
  });

  return {
    tooltip: {},
    series: [
      {
        type: 'wordCloud',
        shape: 'circle',
        sizeRange: [14, 60],
        rotationRange: [0, 0],
        gridSize: 8,
        data: seriesData,
        textStyle: {
          color: () => palette[Math.floor(Math.random() * palette.length)],
        },
      },
    ],
  } as EChartsOption;
}
