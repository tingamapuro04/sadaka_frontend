import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { AmountInput } from '../../../components/shared/AmountInput';
import type { Category, PaymentFormValues } from '../types';

interface CategoryRowProps {
  category: Category;
  disabled?: boolean;
}

export const CategoryRow = ({ category, disabled }: CategoryRowProps) => {
  const { control, setValue } = useFormContext<PaymentFormValues>();
  const selectedName = `selected_categories.${category.id}` as 'selected_categories';
  const amountName = `items.${category.id}` as 'items';
  const isSelected = useWatch({
    control,
    name: selectedName
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
      <div className="flex items-start gap-3">
        <Controller
          name={selectedName}
          control={control}
          defaultValue={{ [category.id]: false }}
          render={({ field: { value, onChange } }) => (
            <input
              type="checkbox"
              checked={Boolean(value)}
              disabled={disabled}
              onChange={(event) => {
                const checked = event.target.checked;
                onChange(checked);
                if (!checked) {
                  setValue(amountName, [], { shouldValidate: true });
                }
              }}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
          )}
        />
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 text-base">{category.name}</span>
          <span className="text-xs text-slate-500">Select category and set amount</span>
        </div>
      </div>
      <div className="w-full sm:w-48">
        <Controller
          name={amountName}
          control={control}
          defaultValue={[]}
          render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
            <AmountInput
              ref={ref}
              value={typeof value === 'number' || typeof value === 'string' ? value : 0}
              onChange={onChange}
              disabled={disabled || !isSelected}
              error={error?.message}
            />
          )}
        />
      </div>
    </div>
  );
};
