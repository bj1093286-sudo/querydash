'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Alert } from '@querydash/types';
import { Tag } from '@querydash/ui';
import { api } from '../../lib/api';

const OP_LABEL: Record<Alert['op'], string> = {
  greater: '초과',
  less: '미만',
  equals: '같음',
};

const STATE_TAG: Record<Alert['state'], { label: string; tone: 'success' | 'error' | 'neutral' }> = {
  ok: { label: '정상', tone: 'success' },
  triggered: { label: '트리거됨', tone: 'error' },
  unknown: { label: '알 수 없음', tone: 'neutral' },
};

function formatDateTime(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AlertsListPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  function load() {
    api.alerts
      .list()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCheck(id: string) {
    setCheckingId(id);
    try {
      const updated = await api.alerts.check(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } finally {
      setCheckingId(null);
    }
  }

  async function handleDelete(alert: Alert) {
    if (!window.confirm(`"${alert.name}" 알림을 삭제하시겠습니까?`)) return;
    await api.alerts.delete(alert.id);
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-qd-neutral-800">알림</h1>
        <Link
          href="/alerts/new"
          className="rounded-qd-md bg-qd-primary-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-qd-primary-600"
        >
          + 새 알림
        </Link>
      </div>
      {loading ? (
        <p className="text-sm text-qd-neutral-400">불러오는 중...</p>
      ) : (
        <div className="overflow-x-auto rounded-qd-md border border-qd-neutral-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-qd-neutral-50 text-qd-neutral-600">
              <tr>
                <th className="px-4 py-2 font-medium">이름</th>
                <th className="px-4 py-2 font-medium">쿼리</th>
                <th className="px-4 py-2 font-medium">조건</th>
                <th className="px-4 py-2 font-medium">상태</th>
                <th className="px-4 py-2 font-medium">최근 값</th>
                <th className="px-4 py-2 font-medium">마지막 확인</th>
                <th className="w-32 px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => {
                const stateInfo = STATE_TAG[alert.state];
                return (
                  <tr key={alert.id} className="border-t border-qd-neutral-100 hover:bg-qd-neutral-50">
                    <td className="px-4 py-2 font-medium text-qd-neutral-800">{alert.name}</td>
                    <td className="px-4 py-2 text-qd-neutral-600">{alert.queryName ?? '-'}</td>
                    <td className="px-4 py-2 text-qd-neutral-600">
                      {alert.column} {OP_LABEL[alert.op]} {alert.value.toLocaleString('ko-KR')}
                    </td>
                    <td className="px-4 py-2">
                      <Tag tone={stateInfo.tone}>{stateInfo.label}</Tag>
                    </td>
                    <td className="px-4 py-2 text-qd-neutral-600">
                      {alert.lastValue !== undefined ? alert.lastValue.toLocaleString('ko-KR') : '-'}
                    </td>
                    <td className="px-4 py-2 text-qd-neutral-500">{formatDateTime(alert.lastCheckedAt)}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleCheck(alert.id)}
                        disabled={checkingId === alert.id}
                        className="mr-2 text-xs text-qd-primary-600 hover:underline disabled:opacity-40"
                      >
                        {checkingId === alert.id ? '확인 중...' : '지금 확인'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(alert)}
                        className="text-xs text-qd-neutral-400 hover:text-qd-error"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-qd-neutral-400">
                    알림이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
