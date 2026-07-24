import React from 'react';

export type TagTone = 'neutral' | 'success' | 'warning' | 'error' | 'info';

export interface TagProps {
  children: React.ReactNode;
  tone?: TagTone;
  className?: string;
}

const toneClasses: Record<TagTone, string> = {
  neutral: 'bg-qd-neutral-100 text-qd-neutral-700',
  success: 'bg-green-50 text-qd-success',
  warning: 'bg-yellow-50 text-yellow-700',
  error: 'bg-red-50 text-qd-error',
  info: 'bg-qd-primary-50 text-qd-primary-600',
};

export function Tag({ children, tone = 'neutral', className = '' }: TagProps) {
  return (
    <span className={`inline-flex items-center rounded-qd-full px-2 py-0.5 text-xs font-medium ${toneClasses[tone]} ${className}`}>
      {children}
    </span>
  );
}
