'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AlertOp, Query } from '@querydash/types';
import { Button, Dropdown, Input } from '@querydash/ui';
import { api } from '../../../lib/api';

const OP_OPTIONS: { label: string; value: AlertOp }[] = [
  { label: '초과 (greater than)', value: 'greater' },
  { label: '미만 (less than)', value: 'less' },
  { label: '같음 (equals)', value: 'equals' },
];

const INTERVAL_OPTIONS = [
  { label: '5분마다', value: '5' },
  { label: '15분마다', value: '15' },
  { label: '30분마다', value: '30' },
  { label: '1시간마다', value: '60' },
];

export default function NewAlertPage() {
  const router = useRouter();
  const [queries, setQueries] = useState<Query[]>([]);
  const [name, setName] = useState('');
  const [queryId, setQueryId] = useState('');
  const [columns, setColumns] = useState<string[]>([]);
  const [column, setColumn] = useState('');
  const [op, setOp] = useState<AlertOp>('greater');
  const [value, setValue] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState('60');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.queries.list().then(setQueries).catch(() => setQueries([]));
  }, []);

  useEffect(() => {
    if (!queryId) {
      setColumns([]);
      return;
    }
    setColumn('');
    api.alerts
      .columns(queryId)
      .then(setColumns)
      .catch(() => setColumns([]));
  }, [queryId]);

  const canSave = name.trim().length > 0 && queryId && column.trim().length > 0 && value.trim().length > 0;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      await api.alerts.create({
        name: name.trim(),
        queryId,
        column: column.trim(),
        op,
        value: Number(value),
        schedule: { enabled: scheduleEnabled, intervalMinutes: Number(intervalMinutes) },
      });
      router.push('/alerts');
    } catch (e) {
      setError(e instanceof Error ? e.message : '알림 생성에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <h1 className="mb-4 text-xl font-semibold text-qd-neutral-800">새 알림</h1>
      <div className="max-w-lg space-y-4 rounded-qd-md border border-qd-neutral-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-qd-neutral-500">알림 이름</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 일일 매출 이상 감지" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-qd-neutral-500">쿼리</label>
          <Dropdown
            value={queryId}
            placeholder="쿼리 선택"
            options={queries.map((q) => ({ label: q.name, value: q.id }))}
            onChange={setQueryId}
            className="w-full"
          />
          {queryId && columns.length === 0 && (
            <p className="mt-1 text-xs text-qd-neutral-400">
              이 쿼리의 저장된 결과가 없습니다. 먼저 쿼리를 한 번 실행해 두면 컬럼을 선택할 수 있습니다.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-qd-neutral-500">감시할 컬럼 (첫 번째 행 기준)</label>
          {columns.length > 0 ? (
            <Dropdown
              value={column}
              placeholder="컬럼 선택"
              options={columns.map((c) => ({ label: c, value: c }))}
              onChange={setColumn}
              className="w-full"
            />
          ) : (
            <Input value={column} onChange={(e) => setColumn(e.target.value)} placeholder="컬럼명 직접 입력" />
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-qd-neutral-500">조건</label>
            <Dropdown value={op} options={OP_OPTIONS} onChange={(v) => setOp(v as AlertOp)} className="w-full" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-qd-neutral-500">기준값</label>
            <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="예: 1000" />
          </div>
        </div>

        <div className="rounded-qd-md border border-qd-neutral-100 bg-qd-neutral-50 p-3">
          <label className="flex items-center gap-2 text-sm text-qd-neutral-700">
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={(e) => setScheduleEnabled(e.target.checked)}
              className="h-4 w-4"
            />
            자동 스케줄 확인 사용
          </label>
          {scheduleEnabled && (
            <div className="mt-2">
              <Dropdown
                value={intervalMinutes}
                options={INTERVAL_OPTIONS}
                onChange={setIntervalMinutes}
                className="w-40"
              />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-qd-error">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => router.push('/alerts')}>
            취소
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!canSave} loading={saving}>
            생성
          </Button>
        </div>
      </div>
    </div>
  );
}
