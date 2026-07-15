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
    <div role="status" aria-live="polite" aria-label="Payment summary" className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-5 shadow-lg transition-all duration-300">
      <h3 className="text-sm font-bold tracking-wider uppercase text-slate-400">Payment Summary</h3>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-slate-300">
          <span>Subtotal Allocation</span>
          <span className="font-semibold">{formatKesCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Platform Fee</span>
          <span className="font-semibold">{subtotal > 0 ? formatKesCurrency(fee) : 'KES 0'}</span>
        </div>
        <div className="border-t border-slate-800 my-3 pt-3 flex justify-between items-baseline">
          <span className="text-base font-medium text-slate-200">Total Amount</span>
          <span className="text-2xl font-extrabold text-emerald-400">{formatKesCurrency(total)}</span>
        </div>
      </div>
      {subtotal > 0 && (
        <div className="mt-4 rounded-xl bg-slate-800/80 p-3 text-center border border-slate-800">
          <p className="text-xs font-medium text-emerald-300/90 leading-relaxed">
            KES {TRANSACTION_FEE_KES} fee is added by Sadaka.
          </p>
        </div>
      )}
    </div>
  );
};
