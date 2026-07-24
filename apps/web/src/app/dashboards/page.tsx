'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Dashboard } from '@querydash/types';
import { api } from '../../lib/api';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DashboardsListPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboards
      .list()
      .then(setDashboards)
      .catch(() => setDashboards([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(dashboard: Dashboard) {
    if (!window.confirm(`"${dashboard.name}" 대시보드를 삭제하시겠습니까?`)) return;
    await api.dashboards.delete(dashboard.id);
    setDashboards((prev) => prev.filter((d) => d.id !== dashboard.id));
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-qd-neutral-800">대시보드</h1>
        <Link
          href="/dashboards/new"
          className="rounded-qd-md bg-qd-primary-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-qd-primary-600"
        >
          + 새 대시보드
        </Link>
      </div>
      {loading ? (
        <p className="text-sm text-qd-neutral-400">불러오는 중...</p>
      ) : (
        <div className="overflow-hidden rounded-qd-md border border-qd-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-qd-neutral-50 text-qd-neutral-600">
              <tr>
                <th className="px-4 py-2 font-medium">이름</th>
                <th className="px-4 py-2 font-medium">수정일</th>
                <th className="w-16 px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {dashboards.map((d) => (
                <tr key={d.id} className="border-t border-qd-neutral-100 hover:bg-qd-neutral-50">
                  <td className="px-4 py-2">
                    <Link href={`/dashboards/${d.id}`} className="text-qd-primary-600 hover:underline">
                      {d.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-qd-neutral-500">{formatDate(d.updatedAt)}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(d)}
                      className="text-xs text-qd-neutral-400 hover:text-qd-error"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {dashboards.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-qd-neutral-400">
                    대시보드가 없습니다.
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
