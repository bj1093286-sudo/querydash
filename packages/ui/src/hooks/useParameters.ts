import { useMemo } from 'react';
import type { Parameter, ParameterType } from '@querydash/types';

const PARAM_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

/**
 * Deliberately duplicated from @querydash/query-engine's parameter-parser:
 * that package pulls in Node-only DB drivers, so ui (browser bundle) keeps
 * its own dependency-free copy of this regex instead of importing it.
 */
export function extractParameterNames(sqlText: string): string[] {
  const names = new Set<string>();
  const re = new RegExp(PARAM_PATTERN);
  let match: RegExpExecArray | null;
  while ((match = re.exec(sqlText))) {
    names.add(match[1].trim());
  }
  return Array.from(names);
}

export function inferParameterType(name: string): ParameterType {
  const lower = name.toLowerCase();
  if (lower.includes('date')) return 'date';
  return 'text';
}

/**
 * Groups raw {{name}} placeholders into user-facing parameters. A pair like
 * {{date_range.start}} / {{date_range.end}} (Redash's dot convention) becomes
 * a single date-range parameter named "date_range" instead of two.
 */
export function groupParameters(rawNames: string[]): Parameter[] {
  const seen = new Set<string>();
  const params: Parameter[] = [];
  for (const raw of rawNames) {
    const base = raw.includes('.') ? raw.split('.')[0] : raw;
    if (seen.has(base)) continue;
    seen.add(base);
    const isRangePair = rawNames.includes(`${base}.start`) && rawNames.includes(`${base}.end`);
    params.push({ name: base, type: isRangePair ? 'date-range' : inferParameterType(base) });
  }
  return params;
}

export function useDetectedParameters(sqlText: string): Parameter[] {
  return useMemo(() => groupParameters(extractParameterNames(sqlText)), [sqlText]);
}

export interface DateRangeParamValue {
  start?: string;
  end?: string;
}

export function isParameterMissing(parameter: Parameter, value: unknown): boolean {
  if (parameter.type === 'date-range') {
    const v = value as DateRangeParamValue | undefined;
    return !v?.start || !v?.end;
  }
  return value === undefined || value === null || value === '';
}

/** Expands date-range values ({start, end}) back into the dotted keys the SQL/backend expects. */
export function flattenParameterValues(
  parameters: Parameter[],
  values: Record<string, unknown>
): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  for (const p of parameters) {
    const v = values[p.name];
    if (p.type === 'date-range' && v && typeof v === 'object') {
      const range = v as DateRangeParamValue;
      flat[`${p.name}.start`] = range.start;
      flat[`${p.name}.end`] = range.end;
    } else {
      flat[p.name] = v;
    }
  }
  return flat;
}
