import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  trailing?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, optional, trailing, className = '', id, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-semibold text-slate-700">
            {label}
            {optional ? <span className="ml-1 font-normal text-slate-400">(optional)</span> : null}
          </label>
        ) : null}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 disabled:bg-slate-50 ${
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20'
            } ${trailing ? 'pr-10' : ''} ${className}`}
            {...rest}
          />
          {trailing ? (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              {trailing}
            </div>
          ) : null}
        </div>
        {error ? (
          <span id={`${inputId}-error`} className="text-xs font-medium text-red-600" role="alert">
            {error}
          </span>
        ) : hint ? (
          <span id={`${inputId}-hint`} className="text-xs text-slate-500">
            {hint}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
