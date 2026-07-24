import React, { useEffect, useRef, useState } from 'react';

export interface DropdownOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Dropdown({ options, value, placeholder = '선택...', onChange, className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative inline-block text-sm ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-qd-md border border-qd-neutral-200 bg-white px-3 py-2 text-qd-neutral-800 hover:bg-qd-neutral-50"
      >
        <span className={selected ? '' : 'text-qd-neutral-400'}>{selected ? selected.label : placeholder}</span>
        <span className="text-qd-neutral-400">▾</span>
      </button>
      {open && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full min-w-[10rem] overflow-auto rounded-qd-md border border-qd-neutral-200 bg-white py-1 shadow-qd-md">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-1.5 text-left hover:bg-qd-neutral-50 disabled:opacity-40 ${
                  opt.value === value ? 'bg-qd-primary-50 text-qd-primary-600' : 'text-qd-neutral-800'
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
