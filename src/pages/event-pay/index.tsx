import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, OfflineBanner } from '../../components/ui';
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
      <div className="flex min-h-[70vh] items-center justify-center bg-surface p-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error?.status === 404) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-surface p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-ink">Event Not Found</h2>
          <p className="mt-2 text-sm text-ink-muted">
            No active fundraiser for{' '}
            <span className="font-semibold text-ink">
              {username}/{eventSlug}
            </span>
            .
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (error?.status === 410) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-surface p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-ink">Event closed</h2>
          <p className="mt-2 text-sm text-ink-muted">
            {error.message || 'This event is no longer accepting payments.'}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link
              to="/"
              className="inline-flex justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Find a church
            </Link>
            <a
              href="mailto:support@sadaka.co.ke"
              className="text-sm font-semibold text-brand-700 hover:underline"
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
      <div className="flex min-h-[70vh] items-center justify-center bg-surface p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-ink">Connection Failed</h2>
          <p className="mt-2 text-sm text-ink-muted">
            {error.message || 'Unable to load event payment details.'}
          </p>
          <Button className="mt-5" onClick={() => refetch()}>
            Try again
          </Button>
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
    <div className="min-h-[70vh] bg-gradient-to-b from-brand-50/50 via-surface to-surface">
      <OfflineBanner />
      <div className="px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-md animate-fade-in">
          {paymentResult ? (
            <PaymentStatus
              username={username || ''}
              payment={paymentResult}
              phone={submittedPhone}
              onReset={handleReset}
              resetLabel="Make Another Contribution"
            />
          ) : (
            <div className="card p-5 shadow-card sm:p-6">
              <header className="mb-4 flex items-start gap-3">
                {church.logo_url && !logoLoadFailed ? (
                  <img
                    src={church.logo_url}
                    alt={`${church.name} logo`}
                    width={48}
                    height={48}
                    loading="lazy"
                    decoding="async"
                    className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 object-cover shadow-soft"
                    onError={() => setLogoLoadFailed(true)}
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700 ring-1 ring-brand-100">
                    {churchInitials || 'CH'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-brand-700">
                    Event fundraiser
                  </p>
                  <h1 className="mt-0.5 text-lg font-bold tracking-tight text-ink">
                    {event.title}
                  </h1>
                  <p className="text-xs text-ink-muted">{church.name}</p>
                </div>
              </header>

              {event.description ? (
                <p className="mb-4 text-sm leading-relaxed text-ink-muted">{event.description}</p>
              ) : null}

              {target != null && target > 0 ? (
                <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-muted">Goal progress</span>
                    <span className="font-semibold tabular-nums text-ink">
                      {formatKesCurrency(raised)}
                      <span className="font-normal text-ink-muted"> of {formatKesCurrency(target)}</span>
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all"
                      style={{ width: `${progress ?? 0}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[11px] text-ink-muted">
                    {raised === 0
                      ? 'Be the first to give toward this goal'
                      : `${progress ?? 0}% of goal`}
                  </p>
                </div>
              ) : null}

              <EventPaymentForm
                isSubmitting={submitMutation.isPending}
                platformFeeKes={platformFeeKes}
                onSubmit={(values) => void handleFormSubmit(values)}
                error={submitMutation.error?.message}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
