import { useForm, FormProvider, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useEffect } from 'react';
import { PhoneInput } from '../../../components/shared/PhoneInput';
import { SummaryCard } from './SummaryCard';
import { kenyanPhoneSchema } from '../../../utils/validation';
import type { Church, Category, Group, PaymentFormValues, PaymentSubmission } from '../types';

const paymentFormSchema = z.object({
  payer_name: z.string().trim().optional(),
  payer_phone: kenyanPhoneSchema,
  group_id: z.string().uuid().nullable().optional().or(z.literal('')),
  items: z.array(z.object({
    category_id: z.string().min(1, 'Please select a category'),
    amount: z.number().int().min(1, 'Amount must be at least KES 1')
  })).min(1, 'Add at least one category allocation')
}).superRefine((data, ctx) => {
  const seen = new Set<string>();
  let subtotal = 0;
  data.items.forEach((item, index) => {
    if (seen.has(item.category_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['items', index, 'category_id'],
        message: 'This category is already selected'
      });
      return;
    }
    seen.add(item.category_id);
    if (item.category_id) {
      subtotal += item.amount || 0;
    }
  });
  if (subtotal <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['items'],
      message: 'Enter at least KES 1 in total offerings before paying'
    });
  }
});

interface PaymentFormProps {
  church: Church;
  categories: Category[];
  groups: Group[];
  isSubmitting: boolean;
  onSubmit: (data: PaymentSubmission) => void;
  error?: string | null;
}

const fieldClass = 'field-control';

export const PaymentForm = ({
  church,
  categories,
  groups,
  isSubmitting,
  onSubmit,
  error
}: PaymentFormProps) => {
  const methods = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      payer_name: '',
      payer_phone: '',
      group_id: '',
      items: categories[0] ? [{ category_id: categories[0].id, amount: 0 }] : []
    }
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors }
  } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });
  const lastFieldRefMap = useRef<Record<number, HTMLSelectElement | null>>({});
  const watchedItems = watch('items');

  useEffect(() => {
    const lastIndex = fields.length - 1;
    if (lastIndex >= 0 && lastFieldRefMap.current[lastIndex]) {
      lastFieldRefMap.current[lastIndex]?.focus();
    }
  }, [fields.length]);

  const onFormSubmit = (data: PaymentFormValues) => {
    const submission: PaymentSubmission = {
      payer_name: data.payer_name || undefined,
      payer_phone: data.payer_phone,
      items: data.items
    };

    if (church.groups_enabled && data.group_id) {
      submission.group_id = data.group_id;
    }

    onSubmit(submission);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="payer_name" className="text-xs font-medium text-slate-600">
              Name <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="payer_name"
              type="text"
              {...register('payer_name')}
              disabled={isSubmitting}
              className={fieldClass}
              placeholder="John Doe"
              autoComplete="name"
            />
          </div>

          <Controller
            name="payer_phone"
            control={control}
            render={({ field: { onChange, value, ref } }) => (
              <PhoneInput
                ref={ref}
                label="M-Pesa number"
                value={value}
                onChange={onChange}
                disabled={isSubmitting}
                error={errors.payer_phone?.message}
                compact
              />
            )}
          />

          {church.groups_enabled && groups.length > 0 && (
            <div className="flex flex-col gap-1">
              <label htmlFor="group_id" className="text-xs font-medium text-slate-600">
                Group / fellowship <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <div className="relative">
                <select
                  id="group_id"
                  {...register('group_id')}
                  disabled={isSubmitting}
                  className={`${fieldClass} appearance-none pr-9`}
                >
                  <option value="">No specific group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.group_id && (
                <span className="text-xs font-medium text-red-500">{errors.group_id.message}</span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Offering</h3>
            {fields.length < categories.length && (
              <button
                type="button"
                onClick={() => append({ category_id: '', amount: 0 })}
                disabled={isSubmitting}
                className="text-xs font-semibold text-brand-700 hover:text-brand-800 disabled:opacity-50"
              >
                + Add category
              </button>
            )}
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => {
              const selectedCategoryIds = new Set(
                (watchedItems || [])
                  .map((item, itemIndex) => (itemIndex === index ? '' : item?.category_id))
                  .filter(Boolean)
              );
              const categoryError = errors.items?.[index]?.category_id?.message;
              const amountError = errors.items?.[index]?.amount?.message;
              const categoryRegister = register(`items.${index}.category_id`);

              return (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <select
                      {...categoryRegister}
                      ref={(el) => {
                        categoryRegister.ref(el);
                        if (el) lastFieldRefMap.current[index] = el;
                      }}
                      disabled={isSubmitting}
                      aria-label={`Category ${index + 1}`}
                      className={fieldClass}
                    >
                      <option value="">Category</option>
                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                          disabled={selectedCategoryIds.has(category.id)}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {categoryError && (
                      <span className="mt-0.5 block text-xs font-medium text-red-500">{categoryError}</span>
                    )}
                  </div>
                  <div className="w-[7.5rem] shrink-0">
                    <Controller
                      name={`items.${index}.amount`}
                      control={control}
                      render={({ field: { onChange, value, ref } }) => (
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-slate-400">
                            KES
                          </span>
                          <input
                            ref={ref}
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            value={value || ''}
                            disabled={isSubmitting}
                            aria-label={`Amount ${index + 1}`}
                            onChange={(event) => {
                              const raw = event.target.value;
                              onChange(raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0));
                            }}
                            className={`${fieldClass} pl-10 tabular-nums`}
                            placeholder="0"
                          />
                        </div>
                      )}
                    />
                    {amountError && (
                      <span className="mt-0.5 block text-xs font-medium text-red-500">{amountError}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={isSubmitting || fields.length === 1}
                    title={fields.length === 1 ? 'At least one category required' : 'Remove'}
                    aria-label="Remove category"
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {errors.items && !Array.isArray(errors.items) && (
            <span className="block text-xs font-semibold text-red-500">{errors.items.message}</span>
          )}
        </div>

        <SummaryCard />

        <button
          type="submit"
          disabled={isSubmitting}
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
          Includes KES 2 platform fee · STK prompt on your phone
        </p>
      </form>
    </FormProvider>
  );
};
