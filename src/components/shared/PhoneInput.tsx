import React, { useId } from 'react';

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  onChange: (value: string) => void;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label = 'M-Pesa Phone Number', error, onChange, value, ...props }, ref) => {
    const id = useId();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/^\+/, '').replace(/\D/g, '');
      // If user typed the 254 country code or leading 0, strip it off for clean display
      if (val.startsWith('254')) {
        val = val.slice(3);
      } else if (val.startsWith('0')) {
        val = val.slice(1);
      }
      onChange(val ? '254' + val : '');
    };

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-semibold text-slate-700">
          {label}
        </label>
        <div className={`relative flex rounded-xl border bg-white shadow-sm transition-all focus-within:ring-2 ${
          error 
            ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500/20' 
            : 'border-slate-200 focus-within:border-emerald-500 focus-within:ring-emerald-500/20'
        }`}>
          <div className="flex items-center justify-center rounded-l-xl bg-slate-50 border-r border-slate-200 px-3.5 text-slate-500 text-sm font-medium select-none">
            +254
          </div>
          <input
            {...props}
            ref={ref}
            id={id}
            type="tel"
            value={value ? String(value).replace(/^254/, '') : ''}
            onChange={handleChange}
            className="w-full rounded-r-xl border-0 py-2.5 px-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 text-base"
            placeholder="712345678"
          />
        </div>
        {error ? (
          <span className="text-xs text-red-500 font-medium animate-pulse">
            {error}
          </span>
        ) : (
          <span className="text-xs text-slate-500">
            Enter the 9-digit mobile number (e.g. 712345678)
          </span>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
