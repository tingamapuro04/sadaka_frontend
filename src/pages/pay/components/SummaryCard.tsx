import { useFormContext } from 'react-hook-form';
import { formatKesCurrency } from '../../../utils/formatters';
import { TRANSACTION_FEE_KES } from '../../../config/constants';
import type { PaymentFormValues } from '../types';

export const SummaryCard = () => {
  const { watch } = useFormContext<PaymentFormValues>();
  const items = watch('items') || [];

  const subtotal = items.reduce<number>((acc, item) => {
    if (!item?.category_id) {
      return acc;
    }
    const num = Number(item.amount);
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  const fee = subtotal > 0 ? TRANSACTION_FEE_KES : 0;
  const total = subtotal + fee;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Payment summary"
      className="rounded-xl border border-brand-100 bg-gradient-to-br from-white to-brand-50/40 px-3.5 py-3.5"
    >
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-0.5 text-xs text-ink-muted sm:text-sm">
          <p>
            Offerings{' '}
            <span className="font-semibold tabular-nums text-ink">{formatKesCurrency(subtotal)}</span>
          </p>
          <p>
            Platform fee{' '}
            <span className="font-semibold tabular-nums text-ink">
              {subtotal > 0 ? formatKesCurrency(fee) : formatKesCurrency(0)}
            </span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xs font-semibold uppercase tracking-wide text-brand-700">You pay</p>
          <p className="text-xl font-bold tabular-nums tracking-tight text-ink sm:text-2xl">
            {formatKesCurrency(total)}
          </p>
        </div>
      </div>
    </div>
  );
};
