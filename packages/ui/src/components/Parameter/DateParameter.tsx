import type { Parameter } from '@querydash/types';
import { Input } from '../common';

export interface DateParameterProps {
  parameter: Parameter;
  value?: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}

export function DateParameter({ value, onChange, invalid }: DateParameterProps) {
  return (
    <Input type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)} error={invalid} className="w-40" />
  );
}
