import { useForm, Controller } from 'react-hook-form';
import { PhoneInput } from '../../../components/shared/PhoneInput';
import { formatKesCurrency } from '../../../utils/formatters';
import { TRANSACTION_FEE_KES } from '../../../config/constants';
import { isValidKenyanPhone, normalizePhone } from '../../../utils/phone';
import type { EventPaymentFormValues, EventPaymentSubmission } from '../types';

type EventPaymentFormProps = {
  isSubmitting: boolean;
  platformFeeKes?: number;
  onSubmit: (data: EventPaymentSubmission) => void;
  error?: string | null;
};

export const EventPaymentForm = ({
  isSubmitting,
  platformFeeKes = TRANSACTION_FEE_KES,
  onSubmit,
  error
}: EventPaymentFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm<EventPaymentFormValues>({
    defaultValues: {
      payer_name: '',
      payer_phone: '',
      amount: ''
    }
  });

  const amountValue = Number(watch('amount')) || 0;
  const fee = amountValue > 0 ? platformFeeKes : 0;
  const total = amountValue + fee;

  const onFormSubmit = (data: EventPaymentFormValues) => {
    clearErrors();
    const phone = normalizePhone(data.payer_phone);
    if (!isValidKenyanPhone(phone)) {
      setError('payer_phone', {
        message: 'Phone must be a valid Kenyan number (e.g. 0712345678 or 254712345678)'
      });
      return;
    }

    const amount = Number(String(data.amount).trim());
    if (!Number.isInteger(amount) || amount < 1) {
      setError('amount', { message: 'Amount must be a whole number of at least KES 1' });
      return;
    }

    onSubmit({
      payer_name: data.payer_name?.trim() || undefined,
      payer_phone: phone,
      amount
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
        <p className="font-semibold">KES {platformFeeKes} platform fee</p>
        <p className="mt-1 text-xs leading-relaxed text-emerald-900/90 sm:text-sm">
          Added on top of your contribution. The church receives your gift amount; the fee is retained by Sadaka. Secured via M-Pesa.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="event_payer_name" className="text-sm font-semibold text-slate-700">
          Your Name (Optional)
        </label>
        <input
          id="event_payer_name"
          type="text"
          autoComplete="name"
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          placeholder="Jane Doe"
          disabled={isSubmitting}
          {...register('payer_name')}
        />
      </div>

      <Controller
        name="payer_phone"
        control={control}
        render={({ field }) => (
          <PhoneInput
            label="M-Pesa Phone Number"
            value={field.value}
            onChange={field.onChange}
            disabled={isSubmitting}
            error={errors.payer_phone?.message}
          />
        )}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="event_amount" className="text-sm font-semibold text-slate-700">
          Amount (KES)
        </label>
        <input
          id="event_amount"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          placeholder="500"
          disabled={isSubmitting}
          {...register('amount')}
        />
        {errors.amount ? (
          <span className="text-xs font-medium text-red-500">{errors.amount.message}</span>
        ) : (
          <span className="text-xs text-slate-500">Enter a whole-number amount in Kenyan Shillings.</span>
        )}
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-label="Payment summary"
        className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-lg"
      >
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Payment Summary</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>Contribution</span>
            <span className="font-semibold">{formatKesCurrency(amountValue)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Platform Fee</span>
            <span className="font-semibold">
              {amountValue > 0 ? formatKesCurrency(fee) : 'KES 0'}
            </span>
          </div>
          <div className="my-3 flex items-baseline justify-between border-t border-slate-800 pt-3">
            <span className="text-base font-medium text-slate-200">Total Amount</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              {formatKesCurrency(total)}
            </span>
          </div>
        </div>
        {amountValue > 0 ? (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-800/80 p-3 text-center">
            <p className="text-xs font-medium leading-relaxed text-emerald-300/90">
              KES {platformFeeKes} fee is added by Sadaka.
            </p>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        <p className="font-semibold">Before you pay</p>
        <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-sky-900 sm:text-sm">
          <li>Confirm your M-Pesa number is correct and has float.</li>
          <li>Tap <span className="font-semibold">Pay Now</span> to receive an STK prompt.</li>
          <li>Enter your PIN on the phone and keep this page open.</li>
        </ol>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || amountValue < 1}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Sending M-Pesa prompt…' : 'Pay Now'}
      </button>
    </form>
  );
};
