import type { ChartConfig, QueryResult, SeriesOption } from '@querydash/types';
import { colors as tokens } from '../../../theme/tokens';

export interface SeriesData {
  key: string;
  values: number[];
}

function toNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Formats date/datetime category values as YYYY-MM-DD (or with time) regardless of locale; other types pass through as-is. */
function formatCategoryLabel(value: unknown, columnType?: string): string {
  if (value === null || value === undefined) return '';
  if (columnType === 'date' || columnType === 'datetime') {
    const d = new Date(value as string);
    if (!isNaN(d.getTime())) {
      const datePart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      return columnType === 'date' ? datePart : `${datePart} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
  }
  return String(value);
}

function resolveColumnType(data: QueryResult, columnName: string): string | undefined {
  return data.columns.find((c) => c.name === columnName)?.type;
}

function sortedIndices(rows: QueryResult['rows'], xAxis: string, sort: boolean | undefined): number[] {
  const indices = rows.map((_, i) => i);
  if (sort) {
    indices.sort((a, b) => String(rows[a][xAxis] ?? '').localeCompare(String(rows[b][xAxis] ?? '')));
  }
  return indices;
}

/**
 * Pivots rows into one series per distinct value of config.groupBy, using
 * yAxis[0] as the value column. Only the first selected Y-axis column is
 * used once Group By is active - additional Y-axis checkboxes are ignored.
 */
function buildGroupedSeries(data: QueryResult, config: ChartConfig): { categories: string[]; series: SeriesData[] } {
  const groupKey = config.groupBy!;
  const valueKey = config.yAxis[0];
  const xColumnType = resolveColumnType(data, config.xAxis);

  const rawCategories: string[] = [];
  const seenCategories = new Set<string>();
  const groups: string[] = [];
  const seenGroups = new Set<string>();
  const lookup = new Map<string, Map<string, number>>();

  for (const row of data.rows) {
    const x = String(row[config.xAxis] ?? '');
    const g = String(row[groupKey] ?? '');
    if (!seenCategories.has(x)) {
      seenCategories.add(x);
      rawCategories.push(x);
    }
    if (!seenGroups.has(g)) {
      seenGroups.add(g);
      groups.push(g);
    }
    if (!lookup.has(x)) lookup.set(x, new Map());
    lookup.get(x)!.set(g, toNumber(row[valueKey]));
  }

  let orderedRaw = rawCategories;
  if (config.xAxisOptions?.sort) {
    orderedRaw = [...rawCategories].sort((a, b) => a.localeCompare(b));
  }

  const series = groups.map((g) => ({
    key: g,
    values: orderedRaw.map((x) => lookup.get(x)?.get(g) ?? 0),
  }));

  const categories = orderedRaw.map((x) => formatCategoryLabel(x, xColumnType));
  return { categories, series };
}

export function buildCategoriesAndSeries(
  data: QueryResult,
  config: ChartConfig
): { categories: string[]; series: SeriesData[] } {
  if (config.groupBy) {
    return buildGroupedSeries(data, config);
  }

  const xColumnType = resolveColumnType(data, config.xAxis);
  const indices = sortedIndices(data.rows, config.xAxis, config.xAxisOptions?.sort);
  const categories = indices.map((i) => formatCategoryLabel(data.rows[i][config.xAxis], xColumnType));
  const series = config.yAxis.map((key) => ({
    key,
    values: indices.map((i) => toNumber(data.rows[i][key])),
  }));
  return { categories, series };
}

/** Returns the series keys a Series/Colors tab should list: group values when
 * Group By is active, otherwise the selected Y-axis columns. */
export function resolveSeriesKeys(config: ChartConfig, data?: QueryResult): string[] {
  if (config.groupBy && data) {
    const seen = new Set<string>();
    for (const row of data.rows) seen.add(String(row[config.groupBy] ?? ''));
    return Array.from(seen);
  }
  return config.yAxis;
}

/**
 * Normalizes each category's series values to sum to 100, for 'percent'
 * stacking. Kept at full float precision here - display-time rounding to the
 * user's chosen decimal count happens in the label/tooltip formatter instead,
 * so switching decimal places doesn't need to re-derive the underlying data.
 */
export function applyPercentStacking(series: SeriesData[]): SeriesData[] {
  if (series.length === 0) return series;
  const length = series[0].values.length;
  const totals = Array.from({ length }, (_, i) => series.reduce((sum, s) => sum + s.values[i], 0));
  return series.map((s) => ({
    key: s.key,
    values: s.values.map((v, i) => (totals[i] === 0 ? 0 : (v / totals[i]) * 100)),
  }));
}

/** Decimal digit count for data labels/percent/tooltips, from ChartEditor's Data Labels tab. Defaults to 2. */
export function resolveDecimals(config: ChartConfig): number {
  return config.dataLabels?.decimals ?? 2;
}

/** Formats a number with the configured decimal precision and thousands separators (ko-KR grouping). */
export function formatValue(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function resolveColorPalette(config: ChartConfig): string[] {
  return config.colorPalette && config.colorPalette.length > 0 ? config.colorPalette : [...tokens.chartPalette];
}

export function resolveLegend(config: ChartConfig) {
  return {
    show: config.legend?.enabled ?? true,
    bottom: 0,
  };
}

export function resolveYAxisType(config: ChartConfig): 'value' | 'log' {
  return config.yAxisOptions?.[0]?.scale === 'log' ? 'log' : 'value';
}

export function resolveDataLabel(config: ChartConfig, position: 'top' | 'inside' = 'top') {
  const decimals = resolveDecimals(config);
  const isPercent = config.stacking === 'percent';
  return {
    show: config.dataLabels?.enabled ?? true,
    position,
    fontSize: 11,
    formatter: (params: { value?: unknown }) => {
      const num = typeof params.value === 'number' ? params.value : Number(params.value ?? 0);
      return isPercent ? `${formatValue(num, decimals)}%` : formatValue(num, decimals);
    },
  };
}

/**
 * ECharts' built-in overlap handling for data labels: automatically hides
 * labels that would collide with a neighbor (kept accessible via tooltip on
 * hover) instead of letting them overlap illegibly, and nudges surviving
 * labels vertically apart where there's room to do so.
 */
export function resolveLabelLayout() {
  return { hideOverlap: true, moveOverlap: 'shiftY' as const };
}

/**
 * Category axis label config that rotates labels once there are enough
 * categories (or long enough names) that horizontal text would overlap, and
 * hides any labels that still collide after rotation.
 */
export function resolveCategoryAxisLabel(categories: string[]) {
  const longLabel = categories.some((c) => c.length > 6);
  const crowded = categories.length > 8;
  const rotate = crowded || longLabel ? 35 : 0;
  return { hideOverlap: true, rotate, interval: rotate ? 0 : undefined };
}

/** Builds the dual Y-axis definition: a single value axis, or a [primary, secondary]
 * pair once any series has been assigned to the right-hand axis. Returned as `any`
 * because dynamically shaping ECharts' axis discriminated union is impractical. */
export function buildYAxes(config: ChartConfig): any {
  const decimals = resolveDecimals(config);
  const primary = {
    type: resolveYAxisType(config),
    name: config.yAxisOptions?.[0]?.label,
    min: config.yAxisOptions?.[0]?.min,
    max: config.yAxisOptions?.[0]?.max,
    axisLabel:
      config.stacking === 'percent' ? { formatter: (value: number) => `${formatValue(value, decimals)}%` } : undefined,
  };
  const hasSecondary = Object.values(config.seriesOptions ?? {}).some((option) => option.yAxis === 1);
  if (!hasSecondary) return primary;
  return [primary, { type: 'value' as const }];
}

/**
 * Builds the common series fields shared by Line/Bar/Area, applying any
 * per-series override from ChartConfig.seriesOptions (type, color, z-index, axis).
 * `defaultType` is our own domain type (which includes 'area'); 'area' has no
 * direct ECharts series type and is translated to a 'line' series + areaStyle.
 * Returned as `any` because dynamically shaping ECharts' series discriminated
 * union is impractical.
 */
export function buildSeriesBase(
  key: string,
  values: number[],
  config: ChartConfig,
  defaultType: NonNullable<SeriesOption['type']>
): any {
  const override = config.seriesOptions?.[key];
  const requestedType = override?.type ?? defaultType;
  const echartsType = requestedType === 'area' ? 'line' : requestedType;
  const color = override?.color;

  return {
    name: key,
    type: echartsType,
    data: values,
    label: resolveDataLabel(config, 'top'),
    labelLayout: resolveLabelLayout(),
    yAxisIndex: override?.yAxis ?? 0,
    z: override?.zIndex,
    itemStyle: color ? { color } : undefined,
    lineStyle: echartsType === 'line' && color ? { color } : undefined,
    areaStyle: requestedType === 'area' ? {} : undefined,
  };
}
