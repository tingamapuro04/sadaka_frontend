type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

type StatusBadgeProps = {
  label: string;
  tone?: Tone;
  className?: string;
};

const toneClass: Record<Tone, string> = {
  // High-contrast badges (WCAG-friendlier on white)
  neutral: 'border-slate-300 bg-slate-100 text-slate-800',
  success: 'border-emerald-300 bg-emerald-100 text-emerald-900',
  warning: 'border-amber-400 bg-amber-100 text-amber-950',
  danger: 'border-red-300 bg-red-100 text-red-900',
  info: 'border-sky-300 bg-sky-100 text-sky-950'
};

/** Map common domain statuses to badge tones */
export const statusToTone = (status: string): Tone => {
  const s = status.toLowerCase().replace(/\s+/g, '_');
  if (['paid', 'completed', 'active', 'success'].includes(s)) return 'success';
  if (['pending', 'awaiting_payment', 'processing', 'draft'].includes(s)) return 'warning';
  if (['failed', 'closed', 'cancelled', 'canceled', 'error'].includes(s)) return 'danger';
  return 'neutral';
};

export const StatusBadge = ({ label, tone, className = '' }: StatusBadgeProps) => {
  const resolved = tone ?? statusToTone(label);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${toneClass[resolved]} ${className}`}
    >
      {label.replace(/_/g, ' ')}
    </span>
  );
};
