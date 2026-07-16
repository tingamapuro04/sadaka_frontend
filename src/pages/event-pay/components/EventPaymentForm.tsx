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

const fieldClass = 'field-control';

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
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="event_payer_name" className="text-xs font-medium text-slate-600">
            Name <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="event_payer_name"
            type="text"
            autoComplete="name"
            className={fieldClass}
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
              label="M-Pesa number"
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
              error={errors.payer_phone?.message}
              compact
            />
          )}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="event_amount" className="text-xs font-medium text-slate-600">
            Amount (KES)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-slate-400">
              KES
            </span>
            <input
              id="event_amount"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              className={`${fieldClass} pl-10 tabular-nums`}
              placeholder="500"
              disabled={isSubmitting}
              {...register('amount')}
            />
          </div>
          {errors.amount ? (
            <span className="text-xs font-medium text-red-500">{errors.amount.message}</span>
          ) : null}
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-label="Payment summary"
        className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3"
      >
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="min-w-0 text-slate-500">
            <span className="tabular-nums">{formatKesCurrency(amountValue)}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span>+ {amountValue > 0 ? formatKesCurrency(fee) : 'KES 0'} fee</span>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Total</p>
            <p className="text-lg font-bold tabular-nums text-slate-900">{formatKesCurrency(total)}</p>
          </div>
        </div>
        {amountValue > 0 ? (
          <p className="mt-1.5 text-[11px] text-slate-400">
            Includes KES {platformFeeKes} platform fee
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || amountValue < 1}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-soft transition-colors hover:bg-brand-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
      >
        {isSubmitting ? (
          <>
            <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Sending prompt…
          </>
        ) : (
          'Pay Now'
        )}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-slate-400">
        Includes KES {platformFeeKes} platform fee · STK prompt on your phone
      </p>
    </form>
  );
};
