import React from 'react';

export interface TabItem {
  key: string;
  label: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ items, activeKey, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex flex-wrap items-center border-b border-qd-neutral-200 ${className}`} role="tablist">
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2 text-sm font-medium transition-colors ${
              active
                ? 'border-qd-primary-500 text-qd-primary-600'
                : 'border-transparent text-qd-neutral-500 hover:text-qd-neutral-800'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
