import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { OfflineBanner } from '../../components/ui';
import { PaymentStatus } from '../pay/components/PaymentStatus';
import { Skeleton } from '../../components/shared/Skeleton';
import { formatKesCurrency } from '../../utils/formatters';
import { EventPaymentForm } from './components/EventPaymentForm';
import { useEventPaymentData, useSubmitEventPayment } from './hooks/useEventPayment';
import type { EventPaymentSubmission, PaymentResponse } from './types';

export const EventPayPage = () => {
  const { username, eventSlug } = useParams<{ username: string; eventSlug: string }>();
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);
  const [submittedPhone, setSubmittedPhone] = useState('');
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  const { data, isLoading, error, refetch } = useEventPaymentData(
    username || '',
    eventSlug || ''
  );
  const submitMutation = useSubmitEventPayment(username || '', eventSlug || '');

  const handleFormSubmit = async (formData: EventPaymentSubmission) => {
    try {
      setSubmittedPhone(formData.payer_phone);
      const res = await submitMutation.mutateAsync(formData);
      setPaymentResult(res);
    } catch {
      // Error captured on mutation
    }
  };

  const handleReset = () => {
    setPaymentResult(null);
    setSubmittedPhone('');
    submitMutation.reset();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-lg animate-pulse space-y-6 rounded-3xl border border-slate-100 bg-white p-8 shadow-xl">
          <div className="flex flex-col items-center space-y-3">
            <Skeleton className="h-20 w-20 rounded-2xl" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error?.status === 404) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-amber-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-500">
              We couldn&apos;t find an active fundraising event for{' '}
              <span className="font-semibold text-slate-800">
                {username}/{eventSlug}
              </span>
              . Check the link and try again.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800"
          >
            Go to Home Page
          </Link>
        </div>
      </div>
    );
  }

  if (error?.status === 410) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Event closed</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-500">
              {error.message || 'This event is no longer accepting payments.'}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Contact the church if you still need to give, or find another payment link.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800"
            >
              Find a church
            </Link>
            <a
              href="mailto:support@sadaka.co.ke"
              className="text-sm font-semibold text-emerald-700 hover:underline"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Connection Failed</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-500">
              {error.message || 'Unable to load event payment details.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { church, event, platform_fee_kes: platformFeeKes } = data;
  const churchInitials = church.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const target = event.target_amount != null ? Number(event.target_amount) : null;
  const raised = Number(event.paid_gross) || 0;
  const progress =
    target && target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : null;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <OfflineBanner />
      <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg animate-fade-in">
        {paymentResult ? (
          <PaymentStatus
            username={username || ''}
            payment={paymentResult}
            phone={submittedPhone}
            onReset={handleReset}
            resetLabel="Make Another Contribution"
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
            <div className="flex flex-col items-center border-b border-slate-100 pb-8 text-center">
              {church.logo_url && !logoLoadFailed ? (
                <img
                  src={church.logo_url}
                  alt={`${church.name} logo`}
                  width={80}
                  height={80}
                  loading="lazy"
                  decoding="async"
                  className="mb-4 h-20 w-20 rounded-2xl border border-slate-100 object-cover shadow-md"
                  onError={() => setLogoLoadFailed(true)}
                />
              ) : (
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-2xl font-black text-emerald-600 shadow-inner">
                  {churchInitials || 'CH'}
                </div>
              )}
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                Event fundraiser
              </p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                {event.title}
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-600">{church.name}</p>
              {event.description ? (
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
                  {event.description}
                </p>
              ) : (
                <p className="mt-3 max-w-sm text-sm text-slate-500">
                  Pay securely with M-Pesa. You&apos;ll receive a prompt on your phone to enter your PIN.
                </p>
              )}
            </div>

            {target != null && target > 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">Goal progress</span>
                  <span className="font-semibold text-slate-900">
                    {formatKesCurrency(raised)}
                    <span className="font-normal text-slate-500"> of {formatKesCurrency(target)}</span>
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${progress ?? 0}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-slate-500">
                  {raised === 0
                    ? 'Be the first to give toward this goal'
                    : `${progress ?? 0}% of goal`}
                </p>
              </div>
            ) : null}

            <div className="mx-0 mt-6 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-left text-sm text-sky-900">
              <p className="font-semibold">How it works</p>
              <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs text-sky-800 sm:text-sm">
                <li>Enter your M-Pesa number and contribution amount.</li>
                <li>Tap Pay Now to receive an STK Push prompt.</li>
                <li>Enter your M-Pesa PIN on your phone to complete payment.</li>
              </ol>
            </div>

            <div className="pt-6">
              <EventPaymentForm
                isSubmitting={submitMutation.isPending}
                platformFeeKes={platformFeeKes}
                onSubmit={(values) => void handleFormSubmit(values)}
                error={submitMutation.error?.message}
              />
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
