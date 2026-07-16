import { useEffect, useId, useRef, useState } from 'react';
import { PhoneInput } from '../../../components/shared/PhoneInput';

type ChurchInfoValues = {
  name: string;
  username: string;
  phone: string;
  email: string;
};

type ChurchInfoFormProps = {
  values: ChurchInfoValues;
  disabled: boolean;
  onChange: (values: ChurchInfoValues) => void;
  onNext: () => void;
  onCheckUsername: (username: string) => Promise<boolean | null>;
  error: string | null;
  fieldErrors?: Record<string, string>;
};

export const ChurchInfoForm = ({
  values,
  disabled,
  onChange,
  onNext,
  onCheckUsername,
  error,
  fieldErrors
}: ChurchInfoFormProps) => {
  const [availability, setAvailability] = useState<string>('');
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (!values.username.trim()) {
      setAvailability('');
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      const available = await onCheckUsername(values.username);
      if (available === true) {
        setAvailability('Username is available');
      } else if (available === false) {
        setAvailability('Username is taken');
      } else {
        setAvailability('');
      }
    }, 450);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [onCheckUsername, values.username]);

  const update = (key: keyof ChurchInfoValues, value: string) => {
    onChange({ ...values, [key]: value });
  };

  const nameId = useId();
  const usernameId = useId();
  const emailId = useId();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Step 1 of 3: Church Info</h2>
      <div>
        <label htmlFor={nameId} className="mb-2 block text-sm font-semibold text-slate-700">
          Church name
        </label>
        <input
          id={nameId}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Church name"
          value={values.name}
          aria-invalid={Boolean(fieldErrors?.name)}
          aria-describedby={fieldErrors?.name ? `${nameId}-error` : undefined}
          onChange={(event) => update('name', event.target.value)}
          disabled={disabled}
        />
        {fieldErrors?.name ? (
          <p id={`${nameId}-error`} className="mt-1 text-xs text-red-600">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor={usernameId} className="mb-2 block text-sm font-semibold text-slate-700">
          Church username
        </label>
        <input
          id={usernameId}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="username"
          value={values.username}
          aria-invalid={Boolean(fieldErrors?.username)}
          aria-describedby={
            fieldErrors?.username ? `${usernameId}-error` : `${usernameId}-hint`
          }
          onChange={(event) => update('username', event.target.value.toLowerCase())}
          disabled={disabled}
        />
        <p id={`${usernameId}-hint`} className="mt-1 text-xs text-slate-500">
          Your username becomes part of your payment link and should include only lowercase letters, numbers, and hyphens.
        </p>
        {availability ? <p className="mt-1 text-xs text-slate-600">{availability}</p> : null}
        {fieldErrors?.username ? (
          <p id={`${usernameId}-error`} className="mt-1 text-xs text-red-600">
            {fieldErrors.username}
          </p>
        ) : null}
      </div>
      <PhoneInput
        label="M-Pesa phone number"
        value={values.phone}
        onChange={(phone) => update('phone', phone)}
        disabled={disabled}
        error={fieldErrors?.phone}
        autoComplete="tel"
      />
      <div>
        <label htmlFor={emailId} className="mb-2 block text-sm font-semibold text-slate-700">
          Email address (optional)
        </label>
        <input
          id={emailId}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Email (optional)"
          value={values.email}
          aria-invalid={Boolean(fieldErrors?.email)}
          aria-describedby={fieldErrors?.email ? `${emailId}-error` : undefined}
          onChange={(event) => update('email', event.target.value)}
          disabled={disabled}
        />
        {fieldErrors?.email ? (
          <p id={`${emailId}-error`} className="mt-1 text-xs text-red-600">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
      >
        Next
      </button>
    </div>
  );
};
