'use client';

import { Tabs } from '@querydash/ui';

export interface VisualizationTabsProps {
  activeKey: string;
  onChange: (key: string) => void;
}

export function VisualizationTabs({ activeKey, onChange }: VisualizationTabsProps) {
  return (
    <Tabs
      activeKey={activeKey}
      onChange={onChange}
      items={[
        { key: 'table', label: '테이블' },
        { key: 'chart', label: '차트' },
      ]}
    />
  );
}
