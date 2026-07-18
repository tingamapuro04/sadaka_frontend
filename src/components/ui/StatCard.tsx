import type { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: 'brand' | 'neutral' | 'sky';
  icon?: ReactNode;
  /** Tighter layout for dense mobile metric grids */
  compact?: boolean;
};

const accentRing: Record<NonNullable<StatCardProps['accent']>, string> = {
  brand: 'border-brand-100 bg-gradient-to-br from-white to-brand-50/40',
  neutral: 'border-slate-200/80 bg-white',
  sky: 'border-sky-100 bg-gradient-to-br from-white to-sky-50/50'
};

export const StatCard = ({
  label,
  value,
  hint,
  accent = 'neutral',
  icon,
  compact = false
}: StatCardProps) => (
  <div
    className={`stat-card ${accentRing[accent]} ${compact ? 'min-h-[5.5rem] sm:min-h-0' : ''}`}
  >
    <div className="flex items-start justify-between gap-2">
      <p
        className={`font-medium uppercase tracking-wide text-ink-muted ${
          compact ? 'text-[0.65rem] leading-tight sm:text-xs' : 'text-xs'
        }`}
      >
        {label}
      </p>
      {icon ? <div className="shrink-0 text-ink-subtle">{icon}</div> : null}
    </div>
    <p
      className={`stat-card-value ${
        compact ? 'text-[1.125rem] leading-snug sm:text-2xl' : ''
      }`}
    >
      {value}
    </p>
    {hint ? (
      <p className={`text-ink-muted ${compact ? 'mt-0.5 text-[0.65rem] sm:mt-1 sm:text-xs' : 'mt-1 text-xs'}`}>
        {hint}
      </p>
    ) : null}
  </div>
);
