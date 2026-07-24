import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...rest }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-qd-md border px-3 py-2 text-sm text-qd-neutral-800 placeholder:text-qd-neutral-400 focus:outline-none focus:ring-2 focus:ring-qd-primary-200 ${
          error ? 'border-qd-error' : 'border-qd-neutral-200'
        } ${className}`}
        {...rest}
      />
    );
  }
);

Input.displayName = 'Input';
