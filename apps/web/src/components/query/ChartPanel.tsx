'use client';

import { useState } from 'react';
import { ChartEditor, ChartRenderer, Button, Input } from '@querydash/ui';
import type { ChartConfig, QueryResult, VisualizationType } from '@querydash/types';
import { api } from '../../lib/api';

export interface ChartPanelProps {
  result?: QueryResult;
  visualizationType: VisualizationType;
  config: ChartConfig;
  onVisualizationTypeChange: (type: VisualizationType) => void;
  onConfigChange: (config: ChartConfig) => void;
  queryId?: string;
}

export function ChartPanel({
  result,
  visualizationType,
  config,
  onVisualizationTypeChange,
  onConfigChange,
  queryId,
}: ChartPanelProps) {
  const [visName, setVisName] = useState('');
  const [savingVis, setSavingVis] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  if (!result) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-qd-neutral-400">
        쿼리를 실행하면 차트를 만들 수 있습니다.
      </div>
    );
  }

  async function handleSaveVisualization() {
    if (!queryId || !visName.trim()) return;
    setSavingVis(true);
    try {
      await api.visualizations.create({ queryId, name: visName.trim(), type: visualizationType, options: config });
      setSavedMessage(`"${visName.trim()}" 저장됨 — 대시보드에 추가할 수 있습니다.`);
      setVisName('');
    } finally {
      setSavingVis(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-1 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-auto p-3">
        <ChartRenderer type={visualizationType} data={result} config={config} width="100%" height={440} />
        {queryId && (
          <div className="mt-3 flex items-center gap-2 border-t border-qd-neutral-100 pt-3">
            <Input
              value={visName}
              onChange={(e) => {
                setVisName(e.target.value);
                setSavedMessage('');
              }}
              placeholder="시각화 이름"
              className="w-56"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveVisualization}
              loading={savingVis}
              disabled={!visName.trim()}
            >
              + 시각화로 저장
            </Button>
            {savedMessage && <span className="text-xs text-qd-success">{savedMessage}</span>}
          </div>
        )}
      </div>
      <ChartEditor
        visualizationType={visualizationType}
        config={config}
        data={result}
        onVisualizationTypeChange={onVisualizationTypeChange}
        onConfigChange={onConfigChange}
      />
    </div>
  );
}
