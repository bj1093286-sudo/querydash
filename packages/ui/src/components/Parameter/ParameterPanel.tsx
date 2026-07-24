import type { Parameter } from '@querydash/types';
import { Button } from '../common';
import { TextParameter } from './TextParameter';
import { NumberParameter } from './NumberParameter';
import { DateParameter } from './DateParameter';
import { DateRangeParameter, type DateRangeValue } from './DateRangeParameter';
import { DropdownParameter } from './DropdownParameter';

export interface ParameterPanelProps {
  parameters: Parameter[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onApply: () => void;
  invalidNames?: string[];
  applying?: boolean;
}

export function ParameterPanel({
  parameters,
  values,
  onChange,
  onApply,
  invalidNames = [],
  applying,
}: ParameterPanelProps) {
  if (parameters.length === 0) return null;

  return (
    <div className="qd-root flex flex-wrap items-end gap-3 border-b border-qd-neutral-200 bg-qd-neutral-50 px-3 py-2.5">
      {parameters.map((param) => {
        const invalid = invalidNames.includes(param.name);
        return (
          <div key={param.name} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-qd-neutral-500">{param.title ?? param.name}</label>
            {param.type === 'date' && (
              <DateParameter
                parameter={param}
                value={values[param.name] as string}
                onChange={(v) => onChange(param.name, v)}
                invalid={invalid}
              />
            )}
            {param.type === 'date-range' && (
              <DateRangeParameter
                parameter={param}
                value={values[param.name] as DateRangeValue}
                onChange={(v) => onChange(param.name, v)}
                invalid={invalid}
              />
            )}
            {param.type === 'number' && (
              <NumberParameter
                parameter={param}
                value={values[param.name] as number}
                onChange={(v) => onChange(param.name, v)}
                invalid={invalid}
              />
            )}
            {param.type === 'dropdown' && (
              <DropdownParameter
                parameter={param}
                value={values[param.name] as string}
                onChange={(v) => onChange(param.name, v)}
              />
            )}
            {param.type === 'text' && (
              <TextParameter
                parameter={param}
                value={values[param.name] as string}
                onChange={(v) => onChange(param.name, v)}
                invalid={invalid}
              />
            )}
          </div>
        );
      })}
      <Button variant="primary" size="sm" onClick={onApply} loading={applying}>
        적용
      </Button>
    </div>
  );
}
