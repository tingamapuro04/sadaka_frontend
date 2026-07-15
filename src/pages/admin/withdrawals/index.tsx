import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RoleBasedGuard } from '../../../components/auth/RoleBasedGuard';
import { Button, ConfirmDialog, useToast } from '../../../components/ui';
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
        <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Withdrawals are available to church super admins only.
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Withdrawals</h1>
            <p className="mt-1 text-sm text-slate-600">
              Review withdrawal history and request new withdrawals from the available balance.
            </p>
          </div>
          <Button
            onClick={() => {
              setError(null);
              setOtpStep(false);
              setIsFormOpen(true);
            }}
            disabled={
              churchQuery.isLoading ||
              dashboardQuery.isLoading ||
              churchQuery.isError ||
              dashboardQuery.isError ||
              availableBalance === undefined
            }
          >
            Request withdrawal
          </Button>
        </div>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Available balance</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {availableBalance === undefined ? '—' : formatKesCurrency(availableBalance)}
            </p>
          </div>
          <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Withdrawal method</p>
            <p className="mt-2 text-2xl font-semibold capitalize text-slate-950">
              {churchQuery.data?.withdrawal_method ?? 'Unknown'}
            </p>
          </div>
          <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Destination number</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{churchQuery.data?.withdrawal_number ?? '—'}</p>
          </div>
        </section>

        <section className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Withdrawal processing mode</p>
          <p className="mt-1">
            {withdrawalMode === 'instant'
              ? 'Instant mode is enabled for development and test environments.'
              : 'Scheduled mode is enabled. Withdrawals will run in the next processing window.'}
          </p>
        </section>

        {dashboardQuery.isError ? (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
