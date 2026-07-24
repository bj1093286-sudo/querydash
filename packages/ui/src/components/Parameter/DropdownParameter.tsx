import type { Parameter } from '@querydash/types';
import { Dropdown } from '../common';

export interface DropdownParameterProps {
  parameter: Parameter;
  value?: string;
  onChange: (value: string) => void;
}

export function DropdownParameter({ parameter, value, onChange }: DropdownParameterProps) {
  const options = (parameter.options ?? []).map((o) => ({ label: o.label, value: String(o.value) }));
  return (
    <Dropdown
      options={options}
      value={value}
      onChange={onChange}
      placeholder={parameter.title ?? parameter.name}
      className="w-40"
    />
  );
}
