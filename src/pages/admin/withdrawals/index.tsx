import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RoleBasedGuard } from '../../../components/auth/RoleBasedGuard';
import { Button, ConfirmDialog, PageHeader, StatCard, useToast } from '../../../components/ui';
import { env } from '../../../config/env.config';
import { formatKesCurrency } from '../../../utils/formatters';
import {
  formatOtpChallengeMessage,
  loginCredentialErrorMessage,
  otpErrorMessage
} from '../../../utils/auth-errors';
import {
  adminQueryKeys,
  cancelWithdrawal,
  createWithdrawal,
  fetchChurch,
  fetchDashboard,
  fetchWithdrawals,
  requestWithdrawalOtp
} from '../api';
import { WithdrawalForm, type WithdrawalFormValues } from './WithdrawalForm';
import { WithdrawalHistory } from './WithdrawalHistory';

const PAGE_SIZE = 8;

export const AdminWithdrawalsPage = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const withdrawalMode = env.VITE_WITHDRAWAL_MODE;
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [challengeMessage, setChallengeMessage] = useState<string | undefined>();
  const [pendingValues, setPendingValues] = useState<WithdrawalFormValues | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const churchQuery = useQuery({
    queryKey: adminQueryKeys.church,
    queryFn: fetchChurch
  });
  const dashboardQuery = useQuery({
    queryKey: adminQueryKeys.dashboard,
    queryFn: fetchDashboard
  });
  const withdrawalsQuery = useQuery({
    queryKey: adminQueryKeys.withdrawals,
    queryFn: fetchWithdrawals
  });

  const createMutation = useMutation({
    mutationFn: createWithdrawal,
    onSuccess: () => {
      setError(null);
      setIsFormOpen(false);
      setOtpStep(false);
      setChallengeId(null);
      setChallengeMessage(undefined);
      setPendingValues(null);
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.withdrawals });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
      toast.success('Withdrawal submitted');
    },
    onError: (err) => {
      const apiError = err as { status?: number; message?: string };
      let message = apiError.message ?? 'Unable to create withdrawal';
      if (apiError.status === 401) {
        message = otpErrorMessage(err, 'verify');
      } else if (apiError.status === 502 || apiError.status === 503) {
        message = loginCredentialErrorMessage(err);
      }
      setError(message);
      toast.error(message);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: cancelWithdrawal,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.withdrawals });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
      toast.success('Withdrawal cancelled');
      setCancelId(null);
    },
    onError: (err) => {
      toast.error((err as { message?: string }).message ?? 'Unable to cancel withdrawal');
    }
  });

  const withdrawals = useMemo(() => withdrawalsQuery.data ?? [], [withdrawalsQuery.data]);
  const availableBalance = dashboardQuery.data?.available_balance;
  const pageWithdrawals = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return withdrawals.slice(start, start + PAGE_SIZE);
  }, [page, withdrawals]);
  const hasNextPage = page * PAGE_SIZE < withdrawals.length;

  const requestDisabled =
    churchQuery.isLoading ||
    dashboardQuery.isLoading ||
    churchQuery.isError ||
    dashboardQuery.isError ||
    availableBalance === undefined;

  const openForm = () => {
    setError(null);
    setOtpStep(false);
    setIsFormOpen(true);
  };

  const closeModal = () => {
    setError(null);
    setIsFormOpen(false);
    setOtpStep(false);
    setChallengeId(null);
    setChallengeMessage(undefined);
    setPendingValues(null);
  };

  const validateValues = (values: WithdrawalFormValues): number | null => {
    const amount = Number(values.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Amount must be greater than zero.');
      return null;
    }

    if (withdrawalMode === 'scheduled') {
      const scheduled = new Date(values.scheduled_for);
      if (Number.isNaN(scheduled.getTime()) || scheduled.getTime() <= Date.now()) {
        setError('Scheduled time must be in the future.');
        return null;
      }
    }

    return amount;
  };

  const sendOtp = async (values: WithdrawalFormValues) => {
    const amount = validateValues(values);
    if (amount == null) return;

    setError(null);
    setIsRequestingOtp(true);
    setPendingValues(values);

    try {
      const response = await requestWithdrawalOtp({
        amount,
        password: values.password
      });

      if (!response.otp_required) {
        createMutation.mutate({
          amount,
          password: values.password,
          scheduled_for: values.scheduled_for
        });
        return;
      }

      setChallengeId(response.challenge_id);
      setChallengeMessage(formatOtpChallengeMessage(response.masked_phone, response.expires_at));
      setOtpStep(true);
    } catch (err) {
      const apiError = err as { status?: number; message?: string };
      if (apiError.status === 401) {
        setError('Invalid password');
      } else if (apiError.status === 429) {
        setError(otpErrorMessage(err, 'resend'));
      } else if (apiError.status === 502 || apiError.status === 503) {
        setError(loginCredentialErrorMessage(err));
      } else {
        setError(apiError.message ?? 'Unable to send verification code');
      }
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const confirmWithOtp = (values: WithdrawalFormValues) => {
    const amount = validateValues(values);
    if (amount == null) return;

    if (!challengeId) {
      setError('Please request a new verification code.');
      setOtpStep(false);
      return;
    }

    const code = (values.code ?? '').trim();
    if (!/^\d{6}$/.test(code)) {
      setError('OTP code must be a 6-digit number');
      return;
    }

    setError(null);
    createMutation.mutate({
      amount,
      password: values.password || pendingValues?.password || '',
      scheduled_for: values.scheduled_for,
      challenge_id: challengeId,
      code
    });
  };

  const resendOtp = async () => {
    if (!pendingValues) return;
    await sendOtp(pendingValues);
  };

  return (
    <RoleBasedGuard
      allow={['church_super_admin']}
      fallback={
        <div className="card card-pad text-sm text-ink-muted">
          Withdrawals are available to church super admins only.
        </div>
      }
    >
      <div className="space-y-4 animate-fade-in sm:space-y-5">
        <PageHeader
          title="Withdrawals"
          description="Request payouts and track withdrawal history."
          actions={
            <Button
              fullWidth
              className="sm:!w-auto"
              onClick={openForm}
              disabled={requestDisabled}
            >
              Request withdrawal
            </Button>
          }
        />

        <section
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3"
          aria-label="Withdrawal summary"
        >
          <StatCard
            label="Available balance"
            value={availableBalance === undefined ? '—' : formatKesCurrency(availableBalance)}
            accent="brand"
            hint="Ready to withdraw"
            compact
          />
          <StatCard
            label="Method"
            value={
              <span className="capitalize">{churchQuery.data?.withdrawal_method ?? 'Unknown'}</span>
            }
            compact
          />
          <div className="col-span-2 sm:col-span-1">
            <StatCard
              label="Destination"
              value={
                <span className="break-all text-base font-bold tabular-nums sm:text-xl">
                  {churchQuery.data?.withdrawal_number ?? '—'}
                </span>
              }
              compact
            />
          </div>
        </section>

        <section className="rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-3 text-sm text-amber-950 sm:px-4">
          <p className="text-2xs font-semibold uppercase tracking-wide text-amber-800">
            Processing mode
          </p>
          <p className="mt-0.5 font-semibold capitalize">
            {withdrawalMode === 'instant' ? 'Instant' : 'Scheduled'}
          </p>
          <p className="mt-1 text-xs text-amber-900/90 sm:text-sm">
            {withdrawalMode === 'instant'
              ? 'Instant mode is enabled for development and test environments.'
              : 'Scheduled mode is enabled. Withdrawals run in the next processing window.'}
          </p>
        </section>

        {dashboardQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 sm:p-4">
            Unable to load balance information. Please refresh and try again.
          </div>
        ) : null}

        {isFormOpen && churchQuery.data ? (
          <WithdrawalForm
            church={churchQuery.data}
            availableBalance={availableBalance ?? 0}
            isSubmitting={createMutation.isPending}
            isRequestingOtp={isRequestingOtp}
            error={error}
            otpStep={otpStep}
            challengeMessage={challengeMessage}
            onClose={closeModal}
            onRequestOtp={(values) => void sendOtp(values)}
            onConfirmWithOtp={confirmWithOtp}
            onResendOtp={() => void resendOtp()}
            onBackFromOtp={() => {
              setOtpStep(false);
              setChallengeId(null);
              setChallengeMessage(undefined);
              setError(null);
            }}
          />
        ) : null}

        <WithdrawalHistory
          withdrawals={pageWithdrawals}
          isLoading={withdrawalsQuery.isLoading}
          isError={withdrawalsQuery.isError}
          page={page}
          hasNextPage={hasNextPage}
          onPrevPage={() => setPage((current) => Math.max(1, current - 1))}
          onNextPage={() => setPage((current) => current + 1)}
          showDevActions={import.meta.env.DEV}
          cancellingId={cancelMutation.isPending ? (cancelMutation.variables ?? null) : null}
          onCancel={(withdrawalId) => setCancelId(withdrawalId)}
        />

        {cancelId ? (
          <ConfirmDialog
            title="Cancel this withdrawal?"
            message="This is intended for development testing only. The withdrawal will be marked failed so you can try again."
            confirmLabel="Yes, cancel withdrawal"
            isConfirming={cancelMutation.isPending}
            onCancel={() => setCancelId(null)}
            onConfirm={() => cancelMutation.mutate(cancelId)}
          />
        ) : null}
      </div>
    </RoleBasedGuard>
  );
};
