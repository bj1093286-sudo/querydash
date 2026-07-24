import type { ReactNode } from 'react';

export interface WidgetProps {
  title?: string;
  editing?: boolean;
  onRemove?: () => void;
  children: ReactNode;
}

export function Widget({ title, editing, onRemove, children }: WidgetProps) {
  return (
    <div className="qd-root flex h-full w-full flex-col overflow-hidden">
      {(title || editing) && (
        <div
          className={`qd-widget-drag-handle flex shrink-0 items-center justify-between border-b border-qd-neutral-100 px-2.5 py-1.5 ${
            editing ? 'cursor-move' : ''
          }`}
        >
          <span className="truncate text-xs font-medium text-qd-neutral-600">{title}</span>
          {editing && onRemove && (
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onRemove}
              className="text-qd-neutral-400 hover:text-qd-error"
              aria-label="위젯 삭제"
            >
              ✕
            </button>
          )}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
