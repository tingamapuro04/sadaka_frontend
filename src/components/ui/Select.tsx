import { forwardRef, type ReactNode, type SelectHTMLAttributes, useId } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, optional, className = '', id, children, ...rest }, ref) => {
    const autoId = useId();
    const selectId = id ?? autoId;
    const describedBy = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={selectId} className="field-label">
            {label}
            {optional ? <span className="ml-1 font-normal text-ink-subtle">(optional)</span> : null}
          </label>
        ) : null}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`field-control appearance-none pr-10 ${error ? 'field-control-error' : ''} ${className}`}
            {...rest}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-ink-subtle">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error ? (
          <span id={`${selectId}-error`} className="text-xs font-medium text-red-600" role="alert">
            {error}
          </span>
        ) : hint ? (
          <span id={`${selectId}-hint`} className="text-xs text-ink-muted">
            {hint}
          </span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
