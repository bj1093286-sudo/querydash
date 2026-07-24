import type { Parameter } from '@querydash/types';
import { Input } from '../common';

export interface NumberParameterProps {
  parameter: Parameter;
  value?: number | string;
  onChange: (value: number | '') => void;
  invalid?: boolean;
}

export function NumberParameter({ parameter, value, onChange, invalid }: NumberParameterProps) {
  return (
    <Input
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      placeholder={parameter.title ?? parameter.name}
      error={invalid}
      className="w-32"
    />
  );
}
