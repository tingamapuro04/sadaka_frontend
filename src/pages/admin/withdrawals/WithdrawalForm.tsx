import { useEffect, useMemo, useRef, useState } from 'react';
import { env } from '../../../config/env.config';
import { OTP_CODE_LENGTH, OTP_RESEND_COOLDOWN_SECONDS } from '../../../config/constants';
import { Button } from '../../../components/ui';
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) close();
      }}
    >
      <form
        className="max-h-[min(92vh,40rem)] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-overlay safe-pb sm:rounded-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (otpStep) {
            onConfirmWithOtp(values);
            return;
          }
          onRequestOtp(values);
        }}
      >
        <div className="sticky top-0 z-[1] flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-4 py-3.5 backdrop-blur-sm sm:px-5">
          <div className="min-w-0">
            <p className="text-2xs font-semibold uppercase tracking-wider text-brand-700">Payout</p>
            <h2 className="mt-0.5 text-lg font-semibold text-ink">
              {otpStep ? 'Confirm with SMS code' : 'Request withdrawal'}
            </h2>
            <p className="mt-1 text-xs text-ink-muted sm:text-sm">
              {otpStep
                ? 'Enter the code sent to the church admin phone.'
                : 'Destination comes from your church profile.'}
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={close} disabled={busy}>
            Close
          </Button>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-2xs text-ink-muted sm:text-xs">Method</p>
              <p className="mt-0.5 font-semibold capitalize text-ink">{church.withdrawal_method}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-2xs text-ink-muted sm:text-xs">Destination</p>
              <p className="mt-0.5 truncate font-semibold tabular-nums text-ink">
                {church.withdrawal_number}
              </p>
            </div>
            <div className="col-span-2 rounded-xl border border-brand-100 bg-gradient-to-br from-white to-brand-50/40 p-3 text-sm">
              <p className="text-2xs text-brand-700 sm:text-xs">Available balance</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-ink">
                {formatKesCurrency(availableBalance)}
              </p>
            </div>
          </div>

          {!otpStep ? (
            <div className="grid gap-3">
              <div className="rounded-xl border border-amber-200/80 bg-amber-50 p-3 text-sm">
                <p className="text-2xs font-semibold uppercase tracking-wide text-amber-800">
                  Withdrawal mode
                </p>
                <p className="mt-0.5 font-semibold capitalize text-amber-950">
                  {withdrawalMode === 'instant' ? 'Instant' : 'Scheduled'}
                </p>
                <p className="mt-1 text-xs text-amber-900/90">
                  {withdrawalMode === 'instant'
                    ? 'Withdrawals are processed immediately in development.'
                    : 'Withdrawals are queued for the next scheduled processing window.'}
                </p>
              </div>

              <label className="text-sm">
                <span className="mb-1 block field-label">Amount</span>
                <input
                  type="number"
                  min="1"
                  max={Math.max(availableBalance, 0)}
                  step="1"
                  value={values.amount}
                  onChange={(event) => setValues((current) => ({ ...current, amount: event.target.value }))}
                  disabled={busy}
                  className="field-control"
                />
              </label>

              {withdrawalMode === 'scheduled' ? (
                <label className="text-sm">
                  <span className="mb-1 block field-label">Scheduled for</span>
                  <input
                    type="datetime-local"
                    min={minDateTime}
                    value={values.scheduled_for}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, scheduled_for: event.target.value }))
                    }
                    disabled={busy}
                    className="field-control"
                  />
                </label>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="text-2xs text-ink-muted">Scheduled for</p>
                  <p className="mt-0.5 font-medium text-ink">Immediate processing</p>
                </div>
              )}

              <label className="text-sm">
                <span className="mb-1 block field-label">Password</span>
                <input
                  type="password"
                  value={values.password}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, password: event.target.value }))
                  }
                  disabled={busy}
                  className="field-control"
                  autoComplete="current-password"
                />
              </label>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-2xs text-ink-muted">Amount</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-ink">
                  {formatKesCurrency(Number(values.amount) || 0)}
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-950">
                <p className="font-medium">Enter the {OTP_CODE_LENGTH}-digit code we sent by SMS.</p>
                {challengeMessage ? <p className="mt-1 text-xs text-amber-900/90">{challengeMessage}</p> : null}
              </div>

              <label className="text-sm">
                <span className="mb-1 block field-label">Verification code</span>
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
                  className="field-control tracking-[0.35em]"
                />
              </label>

              {onResendOtp ? (
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-ink-muted">Didn&apos;t get the code?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onResendOtp();
                      setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
                    }}
                    disabled={busy || resendCooldown > 0}
                    className="font-semibold text-brand-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
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
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mobile-actions sm:flex-row sm:justify-end">
            {otpStep && onBackFromOtp ? (
              <Button type="button" variant="secondary" onClick={onBackFromOtp} disabled={busy}>
                Back
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={close} disabled={busy}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={
                busy ||
                (otpStep
                  ? (values.code ?? '').length !== OTP_CODE_LENGTH
                  : !credentialsValid)
              }
              loading={busy}
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
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
