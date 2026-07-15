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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-6 animate-pulse">
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

  const isNotFound = error?.status === 404;
  const isInvalidUsername = error?.status === 400;

  if (isNotFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 border border-amber-100 text-amber-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Church Not Found</h2>
            <p className="mt-2.5 text-slate-500 text-sm leading-relaxed">
              We couldn't find a registered church under the username <span className="font-semibold text-slate-800">"{username}"</span>.
              Please confirm that the payment link matches the church's exact username and try again.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex justify-center items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors shadow-md"
            >
              Go to Home Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isInvalidUsername) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 border border-amber-100 text-amber-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M4.93 19.07A10 10 0 1119.07 4.93 10 10 0 014.93 19.07z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Invalid Church Link</h2>
            <p className="mt-2.5 text-slate-500 text-sm leading-relaxed">
              The payment username in this link is not valid. Ensure the URL is in the format <span className="font-semibold text-slate-800">/pay/your-church-username</span> and try again.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => refetch()}
              className="inline-flex justify-center items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors shadow-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 border border-red-100 text-red-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Connection Failed</h2>
            <p className="mt-2.5 text-slate-500 text-sm leading-relaxed">
              {error.message || 'Unable to load payment details. Please check your internet connection.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => refetch()}
              className="inline-flex justify-center items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors shadow-md"
            >
              Try Again
            </button>
          </div>
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
                <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-black mb-4 shadow-inner">
                  {churchInitials || 'CH'}
                </div>
              )}
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{church.name}</h1>
              <p className="mt-2 text-slate-500 text-sm max-w-sm">
                Pay securely with M-Pesa. You&apos;ll receive a prompt on your phone to enter your PIN.
              </p>
            </div>

            <div className="mx-6 sm:mx-8 -mt-2 mb-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-left text-sm text-sky-900">
              <p className="font-semibold">How it works</p>
              <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs sm:text-sm text-sky-800">
                <li>Enter your M-Pesa number and offering amounts.</li>
                <li>Tap Pay Now to receive an STK Push prompt.</li>
                <li>Enter your M-Pesa PIN on your phone to complete payment.</li>
              </ol>
            </div>

            <div className="pt-4">
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
      </div>
      </div>
    </div>
  );
};
