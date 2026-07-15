import { useEffect, useRef, useState } from 'react';
import { OTP_CODE_LENGTH, OTP_RESEND_COOLDOWN_SECONDS } from '../../../config/constants';

type RegisterOtpStepProps = {
  maskedPhone: string;
  challengeMessage?: string;
  isSubmitting: boolean;
  isResending: boolean;
  error: string | null;
  onBack: () => void;
  onResend: () => void;
  onVerify: (code: string) => void;
};

export const RegisterOtpStep = ({
  maskedPhone,
  challengeMessage,
  isSubmitting,
  isResending,
  error,
  onBack,
  onResend,
  onVerify
}: RegisterOtpStepProps) => {
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(OTP_RESEND_COOLDOWN_SECONDS);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = window.setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const busy = isSubmitting || isResending;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">Verify your phone number</p>
        <p className="mt-1 text-amber-800">
          {challengeMessage ??
            `We sent a ${OTP_CODE_LENGTH}-digit code to ${maskedPhone}. Enter it below to finish registration.`}
        </p>
      </div>

      <div>
        <label htmlFor="register-otp" className="mb-1 block text-sm font-medium text-slate-700">
          Verification code
        </label>
        <input
          ref={inputRef}
          id="register-otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={OTP_CODE_LENGTH}
          className="w-full rounded-md border border-slate-300 px-3 py-2 tracking-[0.4em]"
          placeholder="123456"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH))}
          disabled={busy}
        />
      </div>

      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-slate-500">Didn&apos;t get the code?</span>
        <button
          type="button"
          onClick={() => {
            onResend();
            setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
          }}
          disabled={busy || cooldown > 0}
          className="font-medium text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {isResending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => onVerify(code)}
          disabled={busy || code.length !== OTP_CODE_LENGTH}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account…' : 'Verify & register'}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-700 disabled:opacity-60"
        >
          Back
        </button>
      </div>
    </div>
  );
};
