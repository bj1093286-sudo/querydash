'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PublicDataSource } from '../../lib/api';
import { api } from '../../lib/api';

export default function DataSourcesPage() {
  const [items, setItems] = useState<PublicDataSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.datasources
      .list()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(ds: PublicDataSource) {
    if (!window.confirm(`"${ds.name}" 데이터소스를 삭제하시겠습니까?`)) return;
    try {
      await api.datasources.delete(ds.id);
      setItems((prev) => prev.filter((d) => d.id !== ds.id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-qd-neutral-800">데이터소스</h1>
        <Link
          href="/datasources/new"
          className="rounded-qd-md bg-qd-primary-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-qd-primary-600"
        >
          + 새 데이터소스
        </Link>
      </div>
      {loading ? (
        <p className="text-sm text-qd-neutral-400">불러오는 중...</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ds) => (
            <div
              key={ds.id}
              className="flex items-start justify-between rounded-qd-md border border-qd-neutral-200 bg-white p-4 shadow-qd-card"
            >
              <div>
                <div className="font-medium text-qd-neutral-800">{ds.name}</div>
                <div className="text-xs uppercase tracking-wide text-qd-neutral-400">{ds.type}</div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(ds)}
                className="text-xs text-qd-neutral-400 hover:text-qd-error"
              >
                삭제
              </button>
            </div>
          ))}
          {items.length === 0 && <p className="text-qd-neutral-400">등록된 데이터소스가 없습니다.</p>}
        </div>
      )}
    </div>
  );
}
