import { useEffect, useMemo, useRef, useState } from 'react';
import { env } from '../../../config/env.config';
import { OTP_CODE_LENGTH, OTP_RESEND_COOLDOWN_SECONDS } from '../../../config/constants';
import { formatKesCurrency } from '../../../utils/formatters';
import type { AdminChurch } from '../types';

export type WithdrawalFormValues = {
  amount: string;
  password: string;
  scheduled_for: string;
  challenge_id?: string;
  code?: string;
};

type WithdrawalFormProps = {
  church: AdminChurch;
  availableBalance: number;
  isSubmitting: boolean;
  isRequestingOtp?: boolean;
  error: string | null;
  otpStep?: boolean;
  challengeMessage?: string;
  onClose: () => void;
  onRequestOtp: (values: WithdrawalFormValues) => void;
  onConfirmWithOtp: (values: WithdrawalFormValues) => void;
  onResendOtp?: () => void;
  onBackFromOtp?: () => void;
};

const toLocalDatetimeValue = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes())
  ].join('');
};

export const WithdrawalForm = ({
  church,
  availableBalance,
  isSubmitting,
  isRequestingOtp = false,
  error,
  otpStep = false,
  challengeMessage,
  onClose,
  onRequestOtp,
  onConfirmWithOtp,
  onResendOtp,
  onBackFromOtp
}: WithdrawalFormProps) => {
  const withdrawalMode = env.VITE_WITHDRAWAL_MODE;
  const [values, setValues] = useState<WithdrawalFormValues>({
    amount: '',
    password: '',
    scheduled_for: '',
    code: ''
  });
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const minDateTime = useMemo(() => toLocalDatetimeValue(new Date(Date.now() + 60_000)), []);
  const instantScheduledFor = useMemo(() => new Date().toISOString(), []);
  const busy = isSubmitting || isRequestingOtp;

  useEffect(() => {
    if (!values.scheduled_for) {
      setValues((current) => ({
        ...current,
        scheduled_for: withdrawalMode === 'instant' ? instantScheduledFor : minDateTime
      }));
    }
  }, [instantScheduledFor, minDateTime, values.scheduled_for, withdrawalMode]);

  useEffect(() => {
    if (otpStep) {
      setValues((current) => ({ ...current, code: '' }));
      setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
      window.requestAnimationFrame(() => otpInputRef.current?.focus());
    }
  }, [otpStep]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const id = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendCooldown]);

  const close = () => {
    setValues({
      amount: '',
      password: '',
      scheduled_for: withdrawalMode === 'instant' ? instantScheduledFor : minDateTime,
      code: ''
    });
    onClose();
  };

  const credentialsValid =
    values.password.trim().length > 0 &&
    Number(values.amount) > 0 &&
    Number(values.amount) <= availableBalance &&
    (withdrawalMode !== 'scheduled' ||
      (Boolean(values.scheduled_for) && new Date(values.scheduled_for).getTime() > Date.now()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <form
        className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (otpStep) {
            onConfirmWithOtp(values);
            return;
          }
          onRequestOtp(values);
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {otpStep ? 'Confirm with SMS code' : 'Request withdrawal'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {otpStep
                ? 'Enter the code sent to the church admin phone to authorize this payout.'
                : 'Destination is pulled from the church profile automatically.'}
            </p>
          </div>
          <button type="button" onClick={close} className="rounded border border-slate-300 px-2 py-1 text-sm">
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="text-slate-500">Method</p>
            <p className="font-medium capitalize text-slate-900">{church.withdrawal_method}</p>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="text-slate-500">Destination</p>
            <p className="font-medium text-slate-900">{church.withdrawal_number}</p>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm sm:col-span-2">
            <p className="text-slate-500">Available balance</p>
            <p className="font-medium text-slate-900">{formatKesCurrency(availableBalance)}</p>
          </div>
        </div>

        {!otpStep ? (
          <div className="mt-4 grid gap-3">
            <div className="rounded border border-slate-200 bg-amber-50 p-3 text-sm sm:col-span-2">
              <p className="text-amber-700">Withdrawal mode</p>
              <p className="font-medium capitalize text-amber-950">
                {withdrawalMode === 'instant' ? 'Instant' : 'Scheduled'}
              </p>
              <p className="mt-1 text-amber-800">
                {withdrawalMode === 'instant'
                  ? 'Withdrawals are processed immediately in development.'
                  : 'Withdrawals are queued for the next scheduled processing window.'}
              </p>
            </div>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Amount</span>
              <input
                type="number"
                min="1"
                max={Math.max(availableBalance, 0)}
                step="1"
                value={values.amount}
                onChange={(event) => setValues((current) => ({ ...current, amount: event.target.value }))}
                disabled={busy}
                className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </label>

            {withdrawalMode === 'scheduled' ? (
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Scheduled for</span>
                <input
                  type="datetime-local"
                  min={minDateTime}
                  value={values.scheduled_for}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, scheduled_for: event.target.value }))
                  }
                  disabled={busy}
                  className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-50"
                />
              </label>
            ) : (
              <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-500">Scheduled for</p>
                <p className="font-medium text-slate-900">Immediate processing</p>
              </div>
            )}

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Password</span>
              <input
                type="password"
                value={values.password}
                onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
                disabled={busy}
                className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </label>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-slate-500">Amount</p>
              <p className="font-medium text-slate-900">{formatKesCurrency(Number(values.amount) || 0)}</p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-medium">Enter the {OTP_CODE_LENGTH}-digit code we sent by SMS.</p>
              {challengeMessage ? <p className="mt-1 text-amber-800">{challengeMessage}</p> : null}
            </div>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Verification code</span>
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={OTP_CODE_LENGTH}
                value={values.code ?? ''}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    code: event.target.value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH)
                  }))
                }
                disabled={busy}
                className="w-full rounded border border-slate-300 px-3 py-2 tracking-[0.4em] disabled:bg-slate-50"
              />
            </label>

            {onResendOtp ? (
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-500">Didn&apos;t get the code?</span>
                <button
                  type="button"
                  onClick={() => {
                    onResendOtp();
                    setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
                  }}
                  disabled={busy || resendCooldown > 0}
                  className="font-medium text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {isRequestingOtp
                    ? 'Sending…'
                    : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend code'}
                </button>
              </div>
            ) : null}
          </div>
        )}

        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {otpStep && onBackFromOtp ? (
            <button
              type="button"
              onClick={onBackFromOtp}
              disabled={busy}
              className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={close}
              className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={
              busy ||
              (otpStep
                ? (values.code ?? '').length !== OTP_CODE_LENGTH
                : !credentialsValid)
            }
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {otpStep
              ? isSubmitting
                ? 'Confirming…'
                : 'Confirm withdrawal'
              : isRequestingOtp
                ? 'Sending code…'
                : isSubmitting
                  ? 'Submitting…'
                  : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};
