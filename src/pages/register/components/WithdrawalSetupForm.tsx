import { useId } from 'react';

type WithdrawalValues = {
  withdrawal_method: 'phone' | 'till' | 'paybill';
  withdrawal_number: string;
  logo: File | null;
};

type WithdrawalSetupFormProps = {
  values: WithdrawalValues;
  disabled: boolean;
  onChange: (values: WithdrawalValues) => void;
  onBack: () => void;
  onSubmit: () => void;
  error: string | null;
  fieldErrors?: Record<string, string>;
};


export const WithdrawalSetupForm = ({
  values,
  disabled,
  onChange,
  onBack,
  onSubmit,
  error,
  fieldErrors
}: WithdrawalSetupFormProps) => {
  const methodId = useId();
  const numberId = useId();
  const fileId = useId();
  const previewUrl = values.logo ? URL.createObjectURL(values.logo) : null;

  const update = (key: keyof WithdrawalValues, value: string | File | null) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Step 3 of 3: Withdrawal Setup</h2>
      <div>
        <label htmlFor={methodId} className="mb-2 block text-sm font-semibold text-slate-700">
          Withdrawal method
        </label>
        <select
          id={methodId}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          value={values.withdrawal_method}
          onChange={(event) => update('withdrawal_method', event.target.value as WithdrawalValues['withdrawal_method'])}
          disabled={disabled}
        >
          <option value="phone">Phone</option>
          <option value="till">Till</option>
          <option value="paybill">Paybill</option>
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Choose the withdrawal method your church will use for funds transfer.
        </p>
      </div>
      <div>
        <label htmlFor={numberId} className="mb-2 block text-sm font-semibold text-slate-700">
          Withdrawal number
        </label>
        <input
          id={numberId}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Withdrawal number"
          value={values.withdrawal_number}
          aria-invalid={Boolean(fieldErrors?.withdrawal_number)}
          aria-describedby={fieldErrors?.withdrawal_number ? `${numberId}-error` : undefined}
          onChange={(event) => update('withdrawal_number', event.target.value)}
          disabled={disabled}
        />
        {fieldErrors?.withdrawal_number ? (
          <p id={`${numberId}-error`} className="mt-1 text-xs text-red-600">
            {fieldErrors.withdrawal_number}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor={fileId} className="mb-2 block text-sm font-semibold text-slate-700">
          Church logo (optional)
        </label>
        <input
          id={fileId}
          type="file"
          accept="image/png,image/jpeg"
          onChange={(event) => update('logo', event.target.files?.[0] ?? null)}
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-slate-500">
          Upload a logo under 2MB in PNG or JPEG format.
        </p>
      </div>
      {previewUrl ? <img src={previewUrl} alt="Uploaded church logo preview" className="h-16 w-16 rounded object-cover" /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={onBack} disabled={disabled} className="rounded-md border border-slate-300 px-4 py-2">
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {disabled ? 'Submitting...' : 'Complete Registration'}
        </button>
      </div>
    </div>
  );
};
