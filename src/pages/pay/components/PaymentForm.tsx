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

  // Auto-focus newly added category row
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
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {error && (
          <div role="alert" aria-live="assertive" className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Payer Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="payer_name" className="text-sm font-semibold text-slate-700">
            Your Name (Optional)
          </label>
          <input
            id="payer_name"
            type="text"
            {...register('payer_name')}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm transition-all text-base"
            placeholder="John Doe"
          />
        </div>

        {/* Payer Phone */}
        <div>
          <Controller
            name="payer_phone"
            control={control}
            render={({ field: { onChange, value, ref } }) => (
              <PhoneInput
                ref={ref}
                value={value}
                onChange={onChange}
                disabled={isSubmitting}
                error={errors.payer_phone?.message}
              />
            )}
          />
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
          <p className="font-semibold">KES 2 platform fee</p>
          <p className="mt-1 text-xs leading-relaxed text-emerald-900/90 sm:text-sm">
            Sadaka adds a fixed KES 2 fee on top of your gift. The church receives your allocation; the fee is retained by Sadaka.
            Secured via M-Pesa.
          </p>
        </div>

        {/* Group Selector */}
        {church.groups_enabled && groups.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="group_id" className="text-sm font-semibold text-slate-700">
              Group / fellowship <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <div className="relative">
              <select
                id="group_id"
                {...register('group_id')}
                disabled={isSubmitting}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-10 text-base text-slate-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">No specific group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Optional: link this gift to a fellowship group for church reporting only.
            </p>
            {errors.group_id && (
              <span className="text-xs font-medium text-red-500">{errors.group_id.message}</span>
            )}
          </div>
        )}

        {/* Categories */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Your gift</h3>
            <p className="mt-1 text-xs text-slate-500">
              Choose categories and amounts. Already-selected categories are disabled to avoid duplicates.
            </p>
          </div>
          <div className="space-y-3">
            {fields.map((field, index) => {
              const selectedCategoryIds = new Set(
                (watchedItems || [])
                  .map((item, itemIndex) => itemIndex === index ? '' : item?.category_id)
                  .filter(Boolean)
              );
              const categoryError = errors.items?.[index]?.category_id?.message;
              const amountError = errors.items?.[index]?.amount?.message;
              const categoryRegister = register(`items.${index}.category_id`);
              return (
                <div key={field.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Category</label>
              <select
                {...categoryRegister}
                ref={(el) => {
                  categoryRegister.ref(el);
                  if (el) lastFieldRefMap.current[index] = el;
                }}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 text-slate-900 bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm transition-all text-base"
              >
                <option value="">-- Select a category --</option>
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
              {categoryError && <span className="text-xs text-red-500 font-medium">{categoryError}</span>}
            </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-700">Amount</label>
                      <Controller
                        name={`items.${index}.amount`}
                        control={control}
                        render={({ field: { onChange, value, ref } }) => (
                          <input
                            ref={ref}
                            type="number"
                            min="0"
                            step="1"
                            value={value || ''}
                            disabled={isSubmitting}
                            onChange={(event) => {
                              const raw = event.target.value;
                              onChange(raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0));
                            }}
                            className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 text-slate-900 bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm transition-all text-base"
                            placeholder="0"
                          />
                        )}
                      />
                      {amountError && <span className="text-xs text-red-500 font-medium">{amountError}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={isSubmitting || fields.length === 1}
                      title={fields.length === 1 ? 'At least one category must be selected' : 'Remove this category'}
                      className="h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => append({ category_id: categories[0]?.id || '', amount: 0 })}
              disabled={isSubmitting || fields.length >= categories.length}
              className="w-full rounded-xl border border-dashed border-emerald-300 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Category
            </button>
          </div>
          {errors.items && !Array.isArray(errors.items) && (
            <span className="text-xs text-red-500 font-semibold block mt-2">
              {errors.items.message}
            </span>
          )}
        </div>

        {/* Summary Card */}
        <SummaryCard />
        <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          <p className="font-semibold">Before you pay</p>
          <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-sky-900 sm:text-sm">
            <li>Confirm your M-Pesa number is correct and has float.</li>
            <li>Tap <span className="font-semibold">Pay Now</span> to receive an STK prompt.</li>
            <li>Enter your M-Pesa PIN on your phone and keep this page open.</li>
          </ol>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:scale-100"
        >
          {isSubmitting ? (
            <>
              <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending M-Pesa prompt…
            </>
          ) : (
            'Pay Now'
          )}
        </button>
      </form>
    </FormProvider>
  );
};
