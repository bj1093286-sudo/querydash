'use client';

import { useState } from 'react';
import type { Parameter } from '@querydash/types';
import { Dropdown, Input } from '../common';
import { computeQuickRange, QUICK_RANGE_OPTIONS, type DateRangeValue, type QuickRangeKey } from './quickRanges';

export type { DateRangeValue };

export interface DateRangeParameterProps {
  parameter: Parameter;
  value?: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  invalid?: boolean;
}

export function DateRangeParameter({ value, onChange, invalid }: DateRangeParameterProps) {
  const [quickRange, setQuickRange] = useState<QuickRangeKey>('custom');

  function handleQuickRangeChange(key: string) {
    setQuickRange(key as QuickRangeKey);
    const computed = computeQuickRange(key as QuickRangeKey);
    if (computed) onChange(computed);
  }

  return (
    <div className="flex items-center gap-1.5">
      <Dropdown
        className="w-32"
        options={QUICK_RANGE_OPTIONS.map((o) => ({ label: o.label, value: o.key }))}
        value={quickRange}
        onChange={handleQuickRangeChange}
      />
      <Input
        type="date"
        value={value?.start ?? ''}
        onChange={(e) => {
          setQuickRange('custom');
          onChange({ start: e.target.value, end: value?.end ?? e.target.value });
        }}
        error={invalid}
        className="w-36"
      />
      <span className="text-qd-neutral-400">~</span>
      <Input
        type="date"
        value={value?.end ?? ''}
        onChange={(e) => {
          setQuickRange('custom');
          onChange({ start: value?.start ?? e.target.value, end: e.target.value });
        }}
        error={invalid}
        className="w-36"
      />
    </div>
  );
}
