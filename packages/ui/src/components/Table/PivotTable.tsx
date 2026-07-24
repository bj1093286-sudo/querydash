import React, { useMemo } from 'react';
import type { ChartConfig, QueryResult } from '@querydash/types';

export interface PivotTableProps {
  data: QueryResult;
  config: ChartConfig;
}

const VALUE_COLUMN_KEY = '값';

function formatNumber(value: number): string {
  return value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Pivots rows into a 2D grid: xAxis is the row dimension, groupBy is the
 * column dimension (falls back to a single value column when unset), and
 * yAxis[0] is the value summed into each cell.
 */
export function PivotTable({ data, config }: PivotTableProps) {
  const rowKey = config.xAxis;
  const colKey = config.groupBy;
  const valueKey = config.yAxis[0];

  const { rowValues, colValues, grid, rowTotals, colTotals, grandTotal } = useMemo(() => {
    const rows: string[] = [];
    const rowSeen = new Set<string>();
    const cols: string[] = [];
    const colSeen = new Set<string>();
    const grid = new Map<string, Map<string, number>>();

    for (const row of data.rows) {
      const r = String(row[rowKey] ?? '');
      const c = colKey ? String(row[colKey] ?? '') : VALUE_COLUMN_KEY;
      const value = row[valueKey];
      const num = typeof value === 'number' ? value : Number(value ?? 0);

      if (!rowSeen.has(r)) {
        rowSeen.add(r);
        rows.push(r);
      }
      if (!colSeen.has(c)) {
        colSeen.add(c);
        cols.push(c);
      }
      if (!grid.has(r)) grid.set(r, new Map());
      const rowMap = grid.get(r)!;
      rowMap.set(c, (rowMap.get(c) ?? 0) + num);
    }

    const rowTotals = new Map<string, number>();
    const colTotals = new Map<string, number>();
    let grandTotal = 0;
    for (const r of rows) {
      let rowTotal = 0;
      for (const c of cols) {
        const value = grid.get(r)?.get(c) ?? 0;
        rowTotal += value;
        colTotals.set(c, (colTotals.get(c) ?? 0) + value);
      }
      rowTotals.set(r, rowTotal);
      grandTotal += rowTotal;
    }

    return { rowValues: rows, colValues: cols, grid, rowTotals, colTotals, grandTotal };
  }, [data, rowKey, colKey, valueKey]);

  if (!rowKey || !valueKey) {
    return (
      <div className="qd-root flex h-full items-center justify-center text-sm text-qd-neutral-400">
        행(X축)과 값(Y축) 컬럼을 선택하세요.
      </div>
    );
  }

  return (
    <div className="qd-root h-full overflow-auto text-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-qd-neutral-50">
            <th className="sticky left-0 z-10 border-b border-r border-qd-neutral-200 bg-qd-neutral-50 px-3 py-2 text-left font-medium text-qd-neutral-600">
              {rowKey}
            </th>
            {colValues.map((c) => (
              <th
                key={c}
                className="border-b border-qd-neutral-200 px-3 py-2 text-right font-medium text-qd-neutral-600"
              >
                {c}
              </th>
            ))}
            <th className="border-b border-qd-neutral-200 px-3 py-2 text-right font-semibold text-qd-neutral-700">
              합계
            </th>
          </tr>
        </thead>
        <tbody>
          {rowValues.map((r) => (
            <tr key={r} className="hover:bg-qd-neutral-50">
              <td className="sticky left-0 z-10 border-r border-qd-neutral-200 bg-white px-3 py-1.5 font-medium text-qd-neutral-700">
                {r}
              </td>
              {colValues.map((c) => (
                <td key={c} className="px-3 py-1.5 text-right tabular-nums text-qd-neutral-800">
                  {formatNumber(grid.get(r)?.get(c) ?? 0)}
                </td>
              ))}
              <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-qd-neutral-800">
                {formatNumber(rowTotals.get(r) ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-qd-neutral-200 bg-qd-neutral-50 font-semibold">
            <td className="sticky left-0 z-10 bg-qd-neutral-50 px-3 py-1.5 text-qd-neutral-700">합계</td>
            {colValues.map((c) => (
              <td key={c} className="px-3 py-1.5 text-right tabular-nums text-qd-neutral-800">
                {formatNumber(colTotals.get(c) ?? 0)}
              </td>
            ))}
            <td className="px-3 py-1.5 text-right tabular-nums text-qd-neutral-800">
              {formatNumber(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
