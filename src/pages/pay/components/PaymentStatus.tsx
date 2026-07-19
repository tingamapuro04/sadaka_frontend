import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatKesCurrency, formatPhoneDisplay } from '../../../utils/formatters';
import { usePaymentStatusPolling } from '../hooks/usePayment';
import type { PaymentResponse, PaymentStatusValue } from '../types';

interface PaymentStatusProps {
  username: string;
  payment: PaymentResponse;
  phone: string;
  onReset: () => void;
  /** CTA after success / failure (default: offering copy) */
  resetLabel?: string;
}

const STEPS = [
  { id: 'sent', label: 'Prompt sent' },
  { id: 'pin', label: 'Enter M-Pesa PIN' },
  { id: 'confirm', label: 'Confirming payment' }
] as const;

export const PaymentStatus = ({
  username,
  payment,
  phone,
  onReset,
  resetLabel = 'Make Another Offering'
}: PaymentStatusProps) => {
  const [copied, setCopied] = useState(false);
  const shouldPoll = payment.status === 'awaiting_payment';
  const { data: polledPayment, timedOut } = usePaymentStatusPolling(
    username,
    payment,
    shouldPoll
  );

  const livePayment = polledPayment ?? payment;
  const status: PaymentStatusValue | 'timed_out' =
    timedOut && livePayment.status === 'awaiting_payment'
      ? 'timed_out'
      : livePayment.status;
  const maxPollSeconds = payment.max_poll_seconds ?? 120;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (status !== 'awaiting_payment') {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  const activeStep = useMemo(() => {
    if (status !== 'awaiting_payment') return 2;
    if (elapsedSeconds < 4) return 0;
    if (elapsedSeconds < 12) return 1;
    return 2;
  }, [elapsedSeconds, status]);

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const reference = livePayment.mpesa_ref || livePayment.transaction_id;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-card sm:p-8"
    >
      {status === 'awaiting_payment' && (
        <>
          <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 sm:mb-6 sm:h-20 sm:w-20">
            <span className="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-emerald-100 opacity-75 sm:h-16 sm:w-16" />
            <svg
              className="relative z-10 h-8 w-8 text-emerald-600 sm:h-10 sm:w-10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-extrabold tracking-tight text-ink">Check your phone</h2>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
            An M-Pesa prompt was sent to{' '}
            <span className="font-semibold text-ink">{formatPhoneDisplay(phone)}</span> for{' '}
            <span className="font-semibold text-brand-700">{formatKesCurrency(livePayment.total_amount)}</span>.
          </p>

          <ol className="mt-5 w-full space-y-2 text-left sm:mt-6 sm:space-y-3">
            {STEPS.map((step, index) => {
              const isComplete = index < activeStep;
              const isCurrent = index === activeStep;
              return (
                <li
                  key={step.id}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                    isCurrent
                      ? 'border-brand-200 bg-brand-50 text-brand-900'
                      : isComplete
                        ? 'border-slate-200 bg-slate-50 text-slate-600'
                        : 'border-slate-100 bg-white text-slate-400'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isComplete
                        ? 'bg-brand-600 text-white'
                        : isCurrent
                          ? 'bg-brand-100 text-brand-700'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isComplete ? '✓' : index + 1}
                  </span>
                  <span className="font-medium">{step.label}</span>
                </li>
              );
            })}
          </ol>

          <p className="mt-4 text-xs text-ink-muted sm:mt-5">
            Waiting for confirmation… {Math.min(elapsedSeconds, maxPollSeconds)}s / {maxPollSeconds}s
          </p>

          <div className="mt-5 w-full rounded-xl border border-amber-200/80 bg-amber-50 p-3.5 text-left text-xs text-amber-950 sm:mt-6">
            <p className="font-semibold">Didn&apos;t get a prompt?</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-amber-900/90">
              <li>Confirm the phone number is registered on M-Pesa.</li>
              <li>Ensure you have network coverage (M-Pesa float or Fuliza is fine).</li>
              <li>Keep this page open while you enter your PIN — confirmation can take longer with Fuliza.</li>
            </ul>
          </div>
        </>
      )}

      {status === 'timed_out' && (
        <>
          <div className="flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 text-amber-700 mb-6">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Still waiting for M-Pesa</h2>
          <p className="mt-3 text-slate-600 text-sm leading-relaxed">
            We did not receive a final confirmation in time. If you completed the payment on your phone,
            the church will still receive it once M-Pesa processes the callback.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={onReset}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        </>
      )}

      {status === 'paid' && (
        <>
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Payment successful</h2>
          <p className="mt-3 text-sm text-slate-600">
            Thank you. We received{' '}
            <span className="text-base font-semibold text-emerald-600">
              {formatKesCurrency(livePayment.total_amount)}
            </span>
            {phone ? (
              <>
                {' '}
                from <span className="font-medium text-slate-800">{formatPhoneDisplay(phone)}</span>
              </>
            ) : null}
            .
          </p>
          <div className="mt-4 flex w-full flex-col gap-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left">
              <p className="text-xs font-medium text-slate-500">M-Pesa reference</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <code className="break-all font-mono text-sm text-slate-900">{reference}</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(reference)}
                  className="shrink-0 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <p className="text-left text-xs text-slate-500">
              Keep this reference for your records. The church can see this payment in their dashboard.
            </p>
          </div>
          <div className="mt-6 flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={onReset}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-slate-800"
            >
              {resetLabel}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Print receipt
            </button>
            <Link
              to="/"
              className="w-full rounded-xl py-2.5 text-center text-sm font-semibold text-brand-700 hover:underline"
            >
              Back to home
            </Link>
          </div>
        </>
      )}

      {status === 'failed' && (
        <>
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Payment could not be completed</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {livePayment.failure_reason ||
              'The payment was cancelled, declined, or timed out on M-Pesa. No money was deducted if you did not enter your PIN.'}
          </p>
          <ul className="mt-4 w-full list-disc space-y-1 rounded-xl border border-slate-100 bg-slate-50 px-5 py-3 text-left text-xs text-slate-600 sm:text-sm">
            <li>Cancelled PIN or timeout on the phone</li>
            <li>Insufficient M-Pesa balance</li>
            <li>Network delay — try again in a moment</li>
          </ul>
          <div className="mt-6 flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={onReset}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-slate-800"
            >
              Try again
            </button>
            <a
              href="mailto:support@sadaka.co.ke?subject=Payment%20Issue"
              className="flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Contact support
            </a>
            <Link to="/" className="w-full py-2.5 text-center text-sm font-semibold text-ink-muted hover:underline">
              Back to home
            </Link>
          </div>
        </>
      )}
    </div>
  );
};
