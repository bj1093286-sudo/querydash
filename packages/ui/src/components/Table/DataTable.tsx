import React, { useMemo, useRef, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnSizingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

export type DataTableColumnType = 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'datetime';

export interface DataTableColumn {
  key: string;
  label?: string;
  type?: DataTableColumnType;
}

export interface DataTableProps {
  columns: DataTableColumn[];
  rows: Array<Record<string, unknown>>;
  loading?: boolean;
  runtimeSeconds?: number;
  pageSize?: number;
  height?: number | string;
}

const NUMERIC_TYPES = new Set(['integer', 'float']);
const DATE_TYPES = new Set(['date', 'datetime']);

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Formats as YYYY-MM-DD (date) or YYYY-MM-DD HH:mm:ss (datetime) regardless of locale. */
function formatDate(value: unknown, type: DataTableColumnType): string {
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return String(value);
  const datePart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (type === 'date') return datePart;
  return `${datePart} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatNumber(value: number, type: DataTableColumnType): string {
  if (type === 'integer' && Number.isInteger(value)) {
    return value.toLocaleString('ko-KR');
  }
  return value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCell(value: unknown, type?: DataTableColumnType) {
  if (value === null || value === undefined) return '';
  if (DATE_TYPES.has(type ?? '')) {
    return formatDate(value, type as DataTableColumnType);
  }
  if (NUMERIC_TYPES.has(type ?? '')) {
    // Postgres NUMERIC/DECIMAL columns come back from the driver as strings
    // (to avoid float precision loss), not JS numbers, so coerce rather than
    // relying on typeof.
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isNaN(num)) return formatNumber(num, type as DataTableColumnType);
  }
  return String(value);
}

export function DataTable({ columns, rows, loading, runtimeSeconds, pageSize = 50, height = 400 }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [search, setSearch] = useState('');

  const columnHelper = useMemo(() => createColumnHelper<Record<string, unknown>>(), []);

  const tableColumns = useMemo(
    () =>
      columns.map((col) =>
        columnHelper.accessor((row) => row[col.key], {
          id: col.key,
          header: col.label ?? col.key,
          cell: (info) => formatCell(info.getValue(), col.type),
          enableSorting: true,
        })
      ),
    [columns, columnHelper]
  );

  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const lower = search.toLowerCase();
    return rows.filter((row) => columns.some((col) => String(row[col.key] ?? '').toLowerCase().includes(lower)));
  }, [rows, columns, search]);

  const table = useReactTable({
    data: filteredRows,
    columns: tableColumns,
    state: { sorting, columnSizing },
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize, pageIndex: 0 } },
  });

  const { rows: tableRows } = table.getRowModel();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end : 0;

  return (
    <div className="qd-root flex min-w-0 flex-col rounded-qd-md border border-qd-neutral-200 bg-white text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-qd-neutral-200 p-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="행 검색..."
          className="w-56 min-w-0 rounded-qd-sm border border-qd-neutral-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-qd-primary-300"
        />
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="rounded-qd-sm border border-qd-neutral-200 px-2 py-1 text-xs"
        >
          {[25, 50, 100, 250].map((size) => (
            <option key={size} value={size}>
              {size}행/페이지
            </option>
          ))}
        </select>
      </div>
      <div ref={parentRef} className="min-w-0" style={{ height, overflow: 'auto' }}>
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-qd-neutral-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const colType = columns.find((c) => c.key === header.id)?.type;
                  const sortDir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize(), position: 'relative' }}
                      className={`select-none border-b border-qd-neutral-200 px-3 py-2 font-medium text-qd-neutral-600 ${
                        NUMERIC_TYPES.has(colType ?? '') ? 'text-right' : 'text-left'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortDir === 'asc' ? '▲' : sortDir === 'desc' ? '▼' : null}
                      </button>
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-qd-primary-300"
                      />
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: paddingTop }} colSpan={columns.length} />
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const row = tableRows[virtualRow.index];
              return (
                <tr key={row.id} className="border-b border-qd-neutral-100 hover:bg-qd-neutral-50">
                  {row.getVisibleCells().map((cell) => {
                    const colType = columns.find((c) => c.key === cell.column.id)?.type;
                    return (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className={`px-3 py-1.5 text-qd-neutral-800 ${
                          NUMERIC_TYPES.has(colType ?? '') ? 'text-right tabular-nums' : ''
                        }`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: paddingBottom }} colSpan={columns.length} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-qd-neutral-200 px-3 py-2 text-xs text-qd-neutral-500">
        <div className="flex items-center gap-2">
          <button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            className="disabled:opacity-30"
          >
            ‹ 이전
          </button>
          <span>
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1} 페이지
          </span>
          <button disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} className="disabled:opacity-30">
            다음 ›
          </button>
        </div>
        <div>
          {loading
            ? '실행 중...'
            : `${filteredRows.length.toLocaleString('ko-KR')}행 표시${
                runtimeSeconds !== undefined ? ` | ${runtimeSeconds.toFixed(2)}초` : ''
              }`}
        </div>
      </div>
    </div>
  );
}
