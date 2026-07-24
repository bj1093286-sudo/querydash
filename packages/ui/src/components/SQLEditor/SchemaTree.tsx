import React, { useEffect, useMemo, useState } from 'react';
import type { DatabaseSchema, SchemaTable } from '@querydash/types';

export interface SchemaTreeProps {
  schema: DatabaseSchema;
  onInsert: (text: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

const AUTO_COLLAPSE_BREAKPOINT = 900;

function matches(table: SchemaTable, term: string) {
  if (!term) return true;
  const lower = term.toLowerCase();
  if (table.name.toLowerCase().includes(lower)) return true;
  return table.columns.some((c) => c.name.toLowerCase().includes(lower));
}

export function SchemaTree({ schema, onInsert, onRefresh, loading }: SchemaTreeProps) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse on small screens so the schema browser doesn't crowd out
  // the editor/results; users can still toggle it back open manually.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < AUTO_COLLAPSE_BREAKPOINT) setCollapsed(true);
  }, []);

  const filteredTables = useMemo(
    () => schema.tables.filter((t) => matches(t, search)),
    [schema.tables, search]
  );

  function toggle(tableName: string) {
    setExpanded((prev) => ({ ...prev, [tableName]: !prev[tableName] }));
  }

  if (collapsed) {
    return (
      <div className="qd-root flex h-full w-9 shrink-0 flex-col items-center border-r border-qd-neutral-200 bg-white py-2">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="스키마 브라우저 펼치기"
          className="text-qd-neutral-400 hover:text-qd-neutral-700"
        >
          ▸
        </button>
      </div>
    );
  }

  return (
    <div className="qd-root flex h-full w-60 shrink-0 flex-col border-r border-qd-neutral-200 bg-white text-sm">
      <div className="flex items-center gap-2 border-b border-qd-neutral-200 p-2">
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          title="스키마 브라우저 접기"
          className="shrink-0 text-qd-neutral-400 hover:text-qd-neutral-700"
        >
          ◂
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="테이블/컬럼 검색"
          className="w-full min-w-0 rounded-qd-sm border border-qd-neutral-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-qd-primary-300"
        />
        <button
          type="button"
          onClick={onRefresh}
          title="스키마 새로고침"
          disabled={loading}
          className="shrink-0 text-qd-neutral-400 hover:text-qd-neutral-700 disabled:opacity-40"
        >
          {loading ? '…' : '⟳'}
        </button>
      </div>
      <div className="flex-1 overflow-auto py-1">
        {filteredTables.length === 0 && (
          <div className="px-3 py-2 text-xs text-qd-neutral-400">테이블이 없습니다</div>
        )}
        {filteredTables.map((table) => {
          const isOpen = expanded[table.name] ?? Boolean(search);
          return (
            <div key={table.name}>
              <div className="group flex items-center gap-1 px-2 py-1 hover:bg-qd-neutral-50">
                <button
                  type="button"
                  onClick={() => toggle(table.name)}
                  className="flex flex-1 items-center gap-1 truncate text-left text-qd-neutral-800"
                >
                  <span className="text-qd-neutral-400">{isOpen ? '▾' : '▸'}</span>
                  <span className="truncate font-medium">{table.name}</span>
                </button>
                <button
                  type="button"
                  title={`${table.name} 삽입`}
                  onClick={() => onInsert(table.name)}
                  className="hidden shrink-0 text-xs text-qd-primary-500 group-hover:inline"
                >
                  {'>>'}
                </button>
              </div>
              {isOpen &&
                table.columns
                  .filter((c) => !search || matches(table, search))
                  .map((column) => (
                    <div
                      key={column.name}
                      className="group flex items-center gap-1 py-1 pl-7 pr-2 hover:bg-qd-neutral-50"
                    >
                      <span className="flex-1 truncate text-qd-neutral-700">{column.name}</span>
                      <span className="shrink-0 text-xs text-qd-neutral-400">{column.type}</span>
                      <button
                        type="button"
                        title={`${column.name} 삽입`}
                        onClick={() => onInsert(column.name)}
                        className="hidden shrink-0 text-xs text-qd-primary-500 group-hover:inline"
                      >
                        {'>>'}
                      </button>
                    </div>
                  ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
