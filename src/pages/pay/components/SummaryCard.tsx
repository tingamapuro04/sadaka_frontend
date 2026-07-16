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
      className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3"
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="min-w-0 text-slate-500">
          <span className="tabular-nums">{formatKesCurrency(subtotal)}</span>
          <span className="mx-1.5 text-slate-300">·</span>
          <span>
            + {subtotal > 0 ? formatKesCurrency(fee) : 'KES 0'} fee
          </span>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Total</p>
          <p className="text-lg font-bold tabular-nums text-slate-900">{formatKesCurrency(total)}</p>
        </div>
      </div>
      {subtotal > 0 && (
        <p className="mt-1.5 text-[11px] text-slate-400">
          Includes KES {TRANSACTION_FEE_KES} platform fee
        </p>
      )}
    </div>
  );
};
