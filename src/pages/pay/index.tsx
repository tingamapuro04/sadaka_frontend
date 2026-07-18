import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { OfflineBanner } from '../../components/ui';
import { usePaymentData, useSubmitPayment } from './hooks/usePayment';
import { PaymentForm } from './components/PaymentForm';
import { PaymentStatus } from './components/PaymentStatus';
import { Skeleton } from '../../components/shared/Skeleton';
import type { PaymentResponse, PaymentSubmission } from './types';

export const PayPage = () => {
  const { username } = useParams<{ username: string }>();
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);
  const [submittedPhone, setSubmittedPhone] = useState<string>('');
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  const { data, isLoading, error, refetch } = usePaymentData(username || '');
  const submitMutation = useSubmitPayment(username || '');

  const handleFormSubmit = async (formData: PaymentSubmission) => {
    try {
      setSubmittedPhone(formData.payer_phone);
      const res = await submitMutation.mutateAsync(formData);
      setPaymentResult(res);
    } catch {
      // Error is captured by mutation.error
    }
  };

  const handleReset = () => {
    setPaymentResult(null);
    setSubmittedPhone('');
    submitMutation.reset();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface p-4 safe-pb">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-card animate-pulse">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const isNotFound = error?.status === 404;
  const isInvalidUsername = error?.status === 400;

  if (isNotFound) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface p-4 safe-pb">
        <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-card">
          <h2 className="text-lg font-bold text-ink">Church not found</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            No church registered as <span className="font-semibold text-ink">“{username}”</span>.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (isInvalidUsername) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface p-4 safe-pb">
        <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-card">
          <h2 className="text-lg font-bold text-ink">Invalid church link</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Use a link like <span className="font-semibold text-ink">/pay/your-church-username</span>.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface p-4 safe-pb">
        <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-card">
          <h2 className="text-lg font-bold text-ink">Connection failed</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {error.message || 'Unable to load payment details. Check your connection.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { church, categories, groups } = data;
  const churchInitials = church.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-brand-50/60 via-surface to-surface">
      <OfflineBanner />
      <div className="px-3.5 pb-8 pt-5 sm:px-4 sm:py-10 safe-pb">
        <div className="mx-auto max-w-md animate-fade-in">
          {paymentResult ? (
            <PaymentStatus
              username={username || ''}
              payment={paymentResult}
              phone={submittedPhone}
              onReset={handleReset}
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
              <header className="border-b border-slate-100 bg-gradient-to-br from-white to-brand-50/30 px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-center gap-3">
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
                  <div className="min-w-0">
                    <p className="text-2xs font-semibold uppercase tracking-wider text-brand-700">
                      Give with M-Pesa
                    </p>
                    <h1 className="truncate text-lg font-bold tracking-tight text-ink sm:text-xl">
                      {church.name}
                    </h1>
                    <p className="text-xs text-ink-muted">Secure · Prompt on your phone</p>
                  </div>
                </div>
              </header>

              <div className="px-4 py-4 sm:px-5 sm:py-5">
                <PaymentForm
                  church={church}
                  categories={categories}
                  groups={groups}
                  isSubmitting={submitMutation.isPending}
                  onSubmit={handleFormSubmit}
                  error={submitMutation.error?.message}
                />
              </div>
            </div>
          )}

          {!paymentResult ? (
            <p className="mt-4 text-center text-2xs leading-relaxed text-ink-muted">
              Powered by Sadaka ·{' '}
              <a href="mailto:support@sadaka.co.ke" className="font-medium text-brand-700 hover:underline">
                support@sadaka.co.ke
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
