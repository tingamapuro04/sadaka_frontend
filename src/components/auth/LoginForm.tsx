import { useEffect, useRef, useState, type FormEvent } from 'react';
import { OTP_CODE_LENGTH } from '../../config/constants';

type LoginFormValues = {
  phone: string;
  password: string;
  otpCode: string;
};

type LoginMode = 'credentials' | 'otp';

type LoginFormProps = {
  mode: LoginMode;
  isSubmitting: boolean;
  error: string | null;
  challengeMessage?: string;
  submitLabel?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onResend?: () => void;
  resendCooldownSeconds?: number;
  isResending?: boolean;
  /** Prefill phone when returning from OTP step */
  initialPhone?: string;
  onSubmit: (values: LoginFormValues) => Promise<void>;
};

export const LoginForm = ({
  mode,
  isSubmitting,
  error,
  challengeMessage,
  submitLabel,
  secondaryActionLabel,
  onSecondaryAction,
  onResend,
  resendCooldownSeconds = 0,
  isResending = false,
  initialPhone,
  onSubmit
}: LoginFormProps) => {
  const [values, setValues] = useState<LoginFormValues>({
    phone: initialPhone ?? '',
    password: '',
    otpCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'otp') {
      setValues((prev) => ({ ...prev, otpCode: '' }));
      // Focus after paint so the OTP field is ready for SMS autofill
      window.requestAnimationFrame(() => {
        otpInputRef.current?.focus();
      });
    }
  }, [mode]);

  useEffect(() => {
    if (initialPhone != null && mode === 'credentials') {
      setValues((prev) => ({ ...prev, phone: initialPhone || prev.phone }));
    }
  }, [initialPhone, mode]);

  const handleChange = (key: keyof LoginFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(values);
  };

  const resendDisabled = isSubmitting || isResending || resendCooldownSeconds > 0;
  const busy = isSubmitting || isResending;

  return (
    <form className="space-y-4" onSubmit={submit}>
      {mode === 'credentials' ? (
        <>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="254712345678"
              value={values.phone}
              onChange={(event) => handleChange('phone', event.target.value)}
              disabled={busy}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={values.password}
              onChange={(event) => handleChange('password', event.target.value)}
              disabled={busy}
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
              disabled={busy}
            />
            Show password
          </label>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">Enter the {OTP_CODE_LENGTH}-digit code we sent by SMS.</p>
            {challengeMessage ? <p className="mt-1 text-amber-800">{challengeMessage}</p> : null}
          </div>

          <div>
            <label htmlFor="otpCode" className="mb-1 block text-sm font-medium text-slate-700">
              Verification code
            </label>
            <input
              ref={otpInputRef}
              id="otpCode"
              name="otpCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_CODE_LENGTH}
              className="w-full rounded-md border border-slate-300 px-3 py-2 tracking-[0.4em]"
              placeholder="123456"
              value={values.otpCode}
              onChange={(event) =>
                handleChange('otpCode', event.target.value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH))
              }
              disabled={busy}
              required
            />
          </div>

          {onResend ? (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-500">Didn&apos;t get the code?</span>
              <button
                type="button"
                onClick={() => void onResend()}
                disabled={resendDisabled}
                className="font-medium text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {isResending
                  ? 'Sending…'
                  : resendCooldownSeconds > 0
                    ? `Resend in ${resendCooldownSeconds}s`
                    : 'Resend code'}
              </button>
            </div>
          ) : null}
        </>
      )}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {isSubmitting
            ? mode === 'otp'
              ? 'Verifying…'
              : 'Signing in…'
            : (submitLabel ?? 'Sign in')}
        </button>
        {secondaryActionLabel && onSecondaryAction ? (
          <button
            type="button"
            onClick={onSecondaryAction}
            disabled={busy}
            className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-700 disabled:opacity-60"
          >
            {secondaryActionLabel}
          </button>
        ) : null}
      </div>
    </form>
  );
};
