import React from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, footer, width = 480 }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onMouseDown={onClose}>
      <div
        className="max-h-[85vh] overflow-auto rounded-qd-lg bg-white shadow-qd-lg"
        style={{ width }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-qd-neutral-200 px-5 py-3.5">
            <h3 className="text-base font-semibold text-qd-neutral-800">{title}</h3>
            <button onClick={onClose} className="text-qd-neutral-400 hover:text-qd-neutral-700" aria-label="닫기">
              ✕
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-qd-neutral-200 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}
