import React, { useId } from 'react';

interface AmountInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  onChange: (value: number) => void;
}

export const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  ({ label, error, onChange, value, ...props }, ref) => {
    const id = useId();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '') {
        onChange(0);
        return;
      }
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        onChange(Math.max(0, num));
      }
    };

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-slate-700">
            {label}
          </label>
        )}
        <div className={`relative flex rounded-xl border bg-white shadow-sm transition-all focus-within:ring-2 ${
          error
            ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500/20'
            : 'border-slate-200 focus-within:border-emerald-500 focus-within:ring-emerald-500/20'
        }`}>
          <div className="flex items-center justify-center rounded-l-xl bg-slate-50 border-r border-slate-200 px-3.5 text-slate-500 text-sm font-semibold select-none">
            KES
          </div>
          <input
            {...props}
            ref={ref}
            id={id}
            type="number"
            min="0"
            step="1"
            value={value || ''}
            onChange={handleChange}
            className="w-full rounded-r-xl border-0 py-2.5 px-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 text-base font-medium"
            placeholder="0"
          />
        </div>
        {error && (
          <span className="text-xs text-red-500 font-medium">
            {error}
          </span>
        )}
      </div>
    );
  }
);

AmountInput.displayName = 'AmountInput';
