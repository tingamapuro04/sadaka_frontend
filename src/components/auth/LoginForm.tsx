import { useEffect, useRef, useState, type FormEvent } from 'react';
import { OTP_CODE_LENGTH } from '../../config/constants';
import { Button, Input } from '../ui';
import { PhoneInput } from '../shared/PhoneInput';

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
          <PhoneInput
            label="Phone"
            value={values.phone}
            onChange={(phone) => handleChange('phone', phone)}
            disabled={busy}
            autoComplete="tel"
            required
          />

          <Input
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={values.password}
            onChange={(event) => handleChange('password', event.target.value)}
            disabled={busy}
            required
          />

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
              disabled={busy}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Show password
          </label>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">Enter the {OTP_CODE_LENGTH}-digit code we sent by SMS.</p>
            {challengeMessage ? <p className="mt-1 text-amber-900/90">{challengeMessage}</p> : null}
          </div>

          <Input
            ref={otpInputRef}
            id="otpCode"
            name="otpCode"
            label="Verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_CODE_LENGTH}
            className="tracking-[0.35em]"
            placeholder="123456"
            value={values.otpCode}
            onChange={(event) =>
              handleChange('otpCode', event.target.value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH))
            }
            disabled={busy}
            required
          />

          {onResend ? (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-ink-muted">Didn&apos;t get the code?</span>
              <button
                type="button"
                onClick={() => void onResend()}
                disabled={resendDisabled}
                className="font-semibold text-brand-700 hover:text-brand-800 disabled:cursor-not-allowed disabled:text-slate-400"
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
        <Button type="submit" loading={isSubmitting} fullWidth disabled={busy} size="lg">
          {isSubmitting
            ? mode === 'otp'
              ? 'Verifying…'
              : 'Signing in…'
            : (submitLabel ?? 'Sign in')}
        </Button>
        {secondaryActionLabel && onSecondaryAction ? (
          <Button type="button" variant="secondary" onClick={onSecondaryAction} disabled={busy} fullWidth>
            {secondaryActionLabel}
          </Button>
        ) : null}
      </div>
    </form>
  );
};
