import React, { useId } from 'react';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  onChange: (value: string) => void;
  /** Tighter labels/padding for compact layouts (e.g. public pay page). */
  compact?: boolean;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label = 'M-Pesa Phone Number', error, onChange, value, compact = false, className = '', ...props }, ref) => {
    const id = useId();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/^\+/, '').replace(/\D/g, '');
      if (val.startsWith('254')) {
        val = val.slice(3);
      } else if (val.startsWith('0')) {
        val = val.slice(1);
      }
      onChange(val ? '254' + val : '');
    };

    return (
      <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-1.5'}`}>
        <label
          htmlFor={id}
          className={compact ? 'text-xs font-medium text-slate-600' : 'field-label'}
        >
          {label}
        </label>
        <div
          className={`relative flex border bg-white shadow-soft transition-all focus-within:ring-2 ${
            compact ? 'rounded-lg' : 'rounded-lg'
          } ${
            error
              ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500/20'
              : 'border-slate-200 focus-within:border-brand-500 focus-within:ring-brand-500/20'
          } ${className}`}
        >
          <div
            className={`flex select-none items-center justify-center border-r border-slate-200 bg-slate-50 font-medium text-ink-muted ${
              compact ? 'rounded-l-lg px-2.5 text-xs' : 'rounded-l-lg px-3 text-sm'
            }`}
          >
            +254
          </div>
          <input
            {...props}
            ref={ref}
            id={id}
            type="tel"
            value={value ? String(value).replace(/^254/, '') : ''}
            onChange={handleChange}
            className={`w-full border-0 bg-transparent text-ink placeholder-slate-400 focus:outline-none focus:ring-0 ${
              compact
                ? 'rounded-r-lg py-2 px-3 text-sm'
                : 'min-h-touch rounded-r-lg py-2.5 px-3 text-sm'
            }`}
            placeholder="712345678"
          />
        </div>
        {error ? (
          <span className="text-xs font-medium text-red-500" role="alert">{error}</span>
        ) : compact ? null : (
          <span className="text-xs text-ink-muted">
            Enter the 9-digit mobile number (e.g. 712345678)
          </span>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
