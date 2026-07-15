import { useId } from 'react';

type AdminAccountValues = {
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

type AdminAccountFormProps = {
  values: AdminAccountValues;
  disabled: boolean;
  onChange: (values: AdminAccountValues) => void;
  onBack: () => void;
  onNext: () => void;
  error: string | null;
  fieldErrors?: Record<string, string>;
};

const getPasswordStrength = (password: string): 'Weak' | 'Medium' | 'Strong' => {
  const checks = [/[A-Z]/.test(password), /[a-z]/.test(password), /\d/.test(password), password.length >= 8].filter(Boolean)
    .length;

  if (checks >= 4) return 'Strong';
  if (checks >= 3) return 'Medium';
  return 'Weak';
};

export const AdminAccountForm = ({
  values,
  disabled,
  onChange,
  onBack,
  onNext,
  error,
  fieldErrors
}: AdminAccountFormProps) => {
  const passwordId = useId();
  const confirmPasswordId = useId();
  const acceptTermsId = useId();

  const update = (key: keyof AdminAccountValues, value: string | boolean) => {
    onChange({ ...values, [key]: value });
  };

  const strength = getPasswordStrength(values.password);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Step 2 of 3: Admin Account</h2>
      <div>
        <label htmlFor={passwordId} className="mb-2 block text-sm font-semibold text-slate-700">
          Password
        </label>
        <input
          id={passwordId}
          type="password"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Password"
          value={values.password}
          aria-invalid={Boolean(fieldErrors?.password)}
          aria-describedby={fieldErrors?.password ? `${passwordId}-error` : `${passwordId}-hint`}
          onChange={(event) => update('password', event.target.value)}
          disabled={disabled}
        />
        <p id={`${passwordId}-hint`} className="mt-1 text-xs text-slate-500">
          Use at least 8 characters with uppercase, lowercase, and numbers.
        </p>
        {fieldErrors?.password ? (
          <p id={`${passwordId}-error`} className="mt-1 text-xs text-red-600">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor={confirmPasswordId} className="mb-2 block text-sm font-semibold text-slate-700">
          Confirm password
        </label>
        <input
          id={confirmPasswordId}
          type="password"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Confirm password"
          value={values.confirmPassword}
          aria-invalid={Boolean(fieldErrors?.confirmPassword)}
          aria-describedby={fieldErrors?.confirmPassword ? `${confirmPasswordId}-error` : undefined}
          onChange={(event) => update('confirmPassword', event.target.value)}
          disabled={disabled}
        />
        {fieldErrors?.confirmPassword ? (
          <p id={`${confirmPasswordId}-error`} className="mt-1 text-xs text-red-600">
            {fieldErrors.confirmPassword}
          </p>
        ) : null}
      </div>
      <p className="text-xs text-slate-600">Password strength: {strength}</p>
      <label htmlFor={acceptTermsId} className="flex items-center gap-2 text-sm text-slate-700">
        <input
          id={acceptTermsId}
          type="checkbox"
          checked={values.acceptTerms}
          onChange={(event) => update('acceptTerms', event.target.checked)}
          disabled={disabled}
        />
        I accept the terms and conditions
      </label>
      {fieldErrors?.acceptTerms ? (
        <p className="text-xs text-red-600">{fieldErrors.acceptTerms}</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={onBack} disabled={disabled} className="rounded-md border border-slate-300 px-4 py-2">
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={disabled}
          className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </div>
  );
};
