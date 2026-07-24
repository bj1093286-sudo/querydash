'use client';

import { useEffect, useState } from 'react';
import { Dropdown, Button } from '@querydash/ui';
import type { Query, Visualization, WidgetOptions } from '@querydash/types';
import { api } from '../../lib/api';

export interface AddWidgetModalProps {
  onAdd: (input: { visualizationId?: string; text?: string; options: WidgetOptions }) => Promise<void>;
}

const DEFAULT_OPTIONS: WidgetOptions = { x: 0, y: 0, w: 4, h: 8 };

export function AddWidgetModal({ onAdd }: AddWidgetModalProps) {
  const [mode, setMode] = useState<'chart' | 'text'>('chart');
  const [queries, setQueries] = useState<Query[]>([]);
  const [queryId, setQueryId] = useState<string>('');
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [visualizationChoice, setVisualizationChoice] = useState<string>('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.queries.list().then(setQueries);
  }, []);

  useEffect(() => {
    if (!queryId) {
      setVisualizations([]);
      return;
    }
    api.visualizations.listByQuery(queryId).then(setVisualizations);
  }, [queryId]);

  async function handleAdd() {
    setSubmitting(true);
    try {
      if (mode === 'text') {
        await onAdd({ text: text || '텍스트를 입력하세요', options: DEFAULT_OPTIONS });
        return;
      }
      let visualizationId = visualizationChoice;
      if (!visualizationId && queryId) {
        const created = await api.visualizations.create({
          queryId,
          name: '테이블',
          type: 'table',
          options: { xAxis: '', yAxis: [] },
        });
        visualizationId = created.id;
      }
      if (!visualizationId) return;
      await onAdd({ visualizationId, options: DEFAULT_OPTIONS });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={mode === 'chart' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('chart')}>
          시각화
        </Button>
        <Button variant={mode === 'text' ? 'primary' : 'secondary'} size="sm" onClick={() => setMode('text')}>
          텍스트
        </Button>
      </div>

      {mode === 'chart' ? (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-qd-neutral-500">쿼리</label>
            <Dropdown
              options={queries.map((q) => ({ label: q.name, value: q.id }))}
              value={queryId}
              onChange={(v) => {
                setQueryId(v);
                setVisualizationChoice('');
              }}
              placeholder="쿼리 선택"
            />
          </div>
          {queryId && (
            <div>
              <label className="mb-1 block text-xs font-medium text-qd-neutral-500">시각화</label>
              <Dropdown
                options={[
                  { label: '테이블 (기본)', value: '' },
                  ...visualizations.map((v) => ({ label: `${v.name} (${v.type})`, value: v.id })),
                ]}
                value={visualizationChoice}
                onChange={setVisualizationChoice}
                placeholder="테이블 (기본)"
              />
            </div>
          )}
        </div>
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'# 제목\n마크다운 텍스트를 입력하세요'}
          className="h-32 w-full rounded-qd-md border border-qd-neutral-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-qd-primary-200"
        />
      )}

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleAdd} loading={submitting} disabled={mode === 'chart' && !queryId}>
          위젯 추가
        </Button>
      </div>
    </div>
  );
}
