export type VisualizationType =
  | 'table'
  | 'line'
  | 'bar'
  | 'area'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'bubble'
  | 'heatmap'
  | 'boxplot'
  | 'counter'
  | 'pivot'
  | 'funnel'
  | 'cohort'
  | 'wordcloud'
  | 'sankey'
  | 'sunburst'
  | 'map';

export interface AxisOption {
  label?: string;
  min?: number;
  max?: number;
  sort?: boolean;
  scale?: 'linear' | 'log' | 'datetime';
}

export interface SeriesOption {
  type?: 'line' | 'bar' | 'area';
  color?: string;
  zIndex?: number;
  yAxis?: 0 | 1;
}

export interface DataLabelOption {
  enabled: boolean;
  fields?: string[];
  /** Decimal digits shown in data labels / percent formatting / table cells. Defaults to 2. */
  decimals?: number;
}

export interface ChartConfig {
  xAxis: string;
  yAxis: string[];
  groupBy?: string;
  seriesOptions?: Record<string, SeriesOption>;
  xAxisOptions?: AxisOption;
  yAxisOptions?: AxisOption[];
  colorPalette?: string[];
  stacking?: 'none' | 'stack' | 'percent';
  legend?: { enabled: boolean; position: string };
  dataLabels?: DataLabelOption;
}

export interface Visualization {
  id: string;
  queryId: string;
  name: string;
  type: VisualizationType;
  options: ChartConfig;
  createdAt: string;
  updatedAt: string;
}
