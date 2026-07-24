import React from 'react';
import type { ChartConfig, QueryResult } from '@querydash/types';

export interface CounterProps {
  data: QueryResult;
  config: ChartConfig;
}

/** Big-number widget: sums yAxis[0] across all rows (a single aggregate row is the common case). */
export function Counter({ data, config }: CounterProps) {
  const valueColumn = config.yAxis[0];

  if (!valueColumn) {
    return (
      <div className="qd-root flex h-full items-center justify-center text-sm text-qd-neutral-400">
        값으로 사용할 컬럼을 선택하세요.
      </div>
    );
  }

  const total = data.rows.reduce((sum, row) => {
    const value = row[valueColumn];
    return sum + (typeof value === 'number' ? value : Number(value ?? 0));
  }, 0);

  const label = config.yAxisOptions?.[0]?.label ?? valueColumn;
  const decimals = config.dataLabels?.decimals ?? 2;
  const formatted = Number.isInteger(total)
    ? total.toLocaleString('ko-KR')
    : total.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return (
    <div className="qd-root flex h-full flex-col items-center justify-center gap-1">
      <div className="text-5xl font-semibold tabular-nums text-qd-neutral-800">{formatted}</div>
      <div className="text-sm text-qd-neutral-500">{label}</div>
    </div>
  );
}
