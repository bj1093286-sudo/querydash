import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-qd-primary-500 text-white hover:bg-qd-primary-600 border-transparent',
  secondary: 'bg-white text-qd-neutral-800 hover:bg-qd-neutral-50 border-qd-neutral-200',
  ghost: 'bg-transparent text-qd-neutral-700 hover:bg-qd-neutral-100 border-transparent',
  danger: 'bg-qd-error text-white hover:opacity-90 border-transparent',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs px-2.5 py-1.5 rounded-qd-sm',
  md: 'text-sm px-3.5 py-2 rounded-qd-md',
  lg: 'text-base px-4 py-2.5 rounded-qd-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 border font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="qd-spin h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  );
}
