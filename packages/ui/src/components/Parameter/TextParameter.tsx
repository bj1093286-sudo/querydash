import type { Parameter } from '@querydash/types';
import { Input } from '../common';

export interface TextParameterProps {
  parameter: Parameter;
  value?: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}

export function TextParameter({ parameter, value, onChange, invalid }: TextParameterProps) {
  return (
    <Input
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={parameter.title ?? parameter.name}
      error={invalid}
      className="w-40"
    />
  );
}
