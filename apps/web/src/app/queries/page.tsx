'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Query } from '@querydash/types';
import { api } from '../../lib/api';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function QueriesListPage() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    api.queries
      .list()
      .then(setQueries)
      .catch(() => setQueries([]))
      .finally(() => setLoading(false));
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    queries.forEach((q) => q.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [queries]);

  function toggleTag(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  async function toggleFavorite(query: Query) {
    const updated = await api.queries.update(query.id, { isFavorite: !query.isFavorite });
    setQueries((prev) => prev.map((q) => (q.id === query.id ? updated : q)));
  }

  async function handleDelete(query: Query) {
    if (!window.confirm(`"${query.name}" 쿼리를 삭제하시겠습니까?`)) return;
    await api.queries.delete(query.id);
    setQueries((prev) => prev.filter((q) => q.id !== query.id));
  }

  const filtered = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();
    return queries.filter((q) => {
      if (favoritesOnly && !q.isFavorite) return false;
      if (activeTags.size > 0 && !q.tags.some((t) => activeTags.has(t))) return false;
      if (lowerSearch && !q.name.toLowerCase().includes(lowerSearch) && !q.sqlText.toLowerCase().includes(lowerSearch)) {
        return false;
      }
      return true;
    });
  }, [queries, search, activeTags, favoritesOnly]);

  const groups = useMemo(() => {
    const map = new Map<string, Query[]>();
    for (const q of filtered) {
      const key = q.folder?.trim() || '(폴더 없음)';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === '(폴더 없음)') return 1;
      if (b === '(폴더 없음)') return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-qd-neutral-800">쿼리</h1>
        <Link
          href="/queries/new"
          className="rounded-qd-md bg-qd-primary-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-qd-primary-600"
        >
          + 새 쿼리
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="쿼리 이름 또는 SQL 검색..."
          className="w-64 rounded-qd-md border border-qd-neutral-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-qd-primary-200"
        />
        <label className="flex items-center gap-1.5 text-sm text-qd-neutral-600">
          <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} />
          즐겨찾기만 보기
        </label>
        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`rounded-qd-full border px-2.5 py-1 text-xs font-medium ${
              activeTags.has(tag)
                ? 'border-qd-primary-500 bg-qd-primary-50 text-qd-primary-600'
                : 'border-qd-neutral-200 text-qd-neutral-600 hover:bg-qd-neutral-100'
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-qd-neutral-400">불러오는 중...</p>
      ) : (
        <div className="space-y-5">
          {groups.map(([folder, items]) => (
            <div key={folder}>
              <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-qd-neutral-400">{folder}</h2>
              <div className="overflow-hidden rounded-qd-md border border-qd-neutral-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-qd-neutral-50 text-qd-neutral-600">
                    <tr>
                      <th className="w-8 px-4 py-2" />
                      <th className="px-2 py-2 font-medium">이름</th>
                      <th className="px-4 py-2 font-medium">태그</th>
                      <th className="px-4 py-2 font-medium">수정일</th>
                      <th className="w-16 px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((q) => (
                      <tr key={q.id} className="border-t border-qd-neutral-100 hover:bg-qd-neutral-50">
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => toggleFavorite(q)}
                            className={q.isFavorite ? 'text-qd-warning' : 'text-qd-neutral-300 hover:text-qd-warning'}
                            title="즐겨찾기"
                          >
                            ★
                          </button>
                        </td>
                        <td className="px-2 py-2">
                          <Link href={`/queries/${q.id}`} className="text-qd-primary-600 hover:underline">
                            {q.name}
                          </Link>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            {q.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded-qd-full bg-qd-neutral-100 px-2 py-0.5 text-xs text-qd-neutral-600"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-qd-neutral-500">{formatDate(q.updatedAt)}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(q)}
                            className="text-xs text-qd-neutral-400 hover:text-qd-error"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-6 text-center text-qd-neutral-400">조건에 맞는 쿼리가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
