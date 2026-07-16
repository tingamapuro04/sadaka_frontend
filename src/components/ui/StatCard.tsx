import type { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: 'brand' | 'neutral' | 'sky';
  icon?: ReactNode;
};

const accentRing: Record<NonNullable<StatCardProps['accent']>, string> = {
  brand: 'border-brand-100 bg-gradient-to-br from-white to-brand-50/40',
  neutral: 'border-slate-200/80 bg-white',
  sky: 'border-sky-100 bg-gradient-to-br from-white to-sky-50/50'
};

export const StatCard = ({ label, value, hint, accent = 'neutral', icon }: StatCardProps) => (
  <div className={`rounded-xl border p-4 shadow-card sm:p-5 ${accentRing[accent]}`}>
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      {icon ? <div className="text-ink-subtle">{icon}</div> : null}
    </div>
    <p className="mt-2 text-2xl font-bold tracking-tight text-ink tabular-nums">{value}</p>
    {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
  </div>
);
