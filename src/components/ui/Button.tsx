import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
};

const variantClass: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 border border-transparent shadow-soft focus-visible:outline-brand-600',
  secondary:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-soft focus-visible:outline-brand-600',
  danger:
    'bg-red-600 text-white hover:bg-red-500 border border-transparent focus-visible:outline-red-600',
  ghost:
    'bg-transparent text-slate-700 border border-transparent hover:bg-slate-100 focus-visible:outline-brand-600',
  success:
    'bg-brand-600 text-white hover:bg-brand-700 border border-transparent shadow-soft focus-visible:outline-brand-600'
};

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px] rounded-lg',
  md: 'px-3.5 py-2 text-sm min-h-[40px] rounded-lg',
  lg: 'px-4 py-2.5 text-sm font-semibold min-h-touch rounded-xl'
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) => {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${sizeClass[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  );
};
