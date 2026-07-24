import React, { useState } from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  className?: string;
}

export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          className={`pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-qd-sm bg-qd-neutral-800 px-2 py-1 text-xs text-white ${className}`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
