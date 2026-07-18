import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Button,
  EmptyState,
  PageHeader,
  Select,
  StatusBadge,
  useToast
} from '../../../components/ui';
import { IconWallet } from '../../../components/icons';
import { formatDate, formatKesCurrency } from '../../../utils/formatters';
import {
  cancelSadakaWithdrawal,
  fetchSadakaChurches,
  fetchSadakaWithdrawals,
  retrySadakaWithdrawal,
  sadakaQueryKeys
} from '../api';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' }
] as const;

export const SadakaWithdrawalsPage = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [churchId, setChurchId] = useState(searchParams.get('church_id') || '');
  const [page, setPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const limit = 8;

  const listParams = {
    page,
    limit,
    status: status || undefined,
    church_id: churchId || undefined
  };

  const withdrawalsQuery = useQuery({
    queryKey: sadakaQueryKeys.withdrawals(listParams),
    queryFn: () => fetchSadakaWithdrawals(listParams),
    refetchInterval: 30_000,
    placeholderData: (prev) => prev
  });
  const churchesQuery = useQuery({
    queryKey: sadakaQueryKeys.churches({ page: 1, limit: 100 }),
    queryFn: () => fetchSadakaChurches({ page: 1, limit: 100 })
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['sadaka', 'withdrawals'] });
    void queryClient.invalidateQueries({ queryKey: sadakaQueryKeys.dashboard });
  };

  const retryMutation = useMutation({
    mutationFn: retrySadakaWithdrawal,
    onSuccess: () => {
      setErrorMessage(null);
      invalidate();
      toast.success('Retry queued');
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
          ? (error as { message: string }).message
          : 'Unable to retry this withdrawal right now.';
      setErrorMessage(message);
      toast.error(message);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSadakaWithdrawal,
    onSuccess: () => {
      setErrorMessage(null);
      invalidate();
      toast.success('Withdrawal cancelled');
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
          ? (error as { message: string }).message
          : 'Unable to cancel this withdrawal right now.';
      setErrorMessage(message);
      toast.error(message);
    }
  });

  const pageData = withdrawalsQuery.data;
  const withdrawals = pageData?.withdrawals ?? [];
  const total = pageData?.total ?? 0;
  const hasNextPage = Boolean(pageData?.has_more);
  const hasFilters = Boolean(status || churchId);

  const clearFilters = () => {
    setStatus('');
    setChurchId('');
    setPage(1);
  };

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-5">
      <PageHeader
        title="Withdrawals"
        description="Platform-wide status, filter, and retry controls."
        actions={
          <Button
            variant="secondary"
            fullWidth
            className="sm:!w-auto"
            onClick={() => void withdrawalsQuery.refetch()}
            loading={withdrawalsQuery.isFetching}
          >
            Refresh
          </Button>
        }
      />

      <div>
        <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-muted">Status</p>
        <div className="mobile-chip-row" role="group" aria-label="Filter by status">
          {STATUS_OPTIONS.map((option) => {
            const active = status === option.value;
            return (
              <button
                key={option.value || 'all'}
                type="button"
                onClick={() => {
                  setStatus(option.value);
                  setPage(1);
                }}
                className={`inline-flex shrink-0 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-brand-600 bg-brand-600 text-white shadow-soft'
                    : 'border-slate-200 bg-white text-slate-700 shadow-soft active:bg-slate-50'
                }`}
                aria-pressed={active}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <section className="card card-pad space-y-3">
        <div className="sm:max-w-md">
          <Select
            label="Church"
            value={churchId}
            onChange={(event) => {
              setChurchId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All churches</option>
            {(churchesQuery.data?.churches ?? []).map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-ink-muted sm:text-sm">
            {withdrawalsQuery.isLoading
              ? 'Loading…'
              : `${total.toLocaleString('en-KE')} result${total === 1 ? '' : 's'}`}
          </p>
          {hasFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </section>

      {withdrawalsQuery.isLoading && withdrawals.length === 0 ? (
        <div className="card card-pad text-sm text-ink-muted" role="status">
          Loading withdrawals…
        </div>
      ) : null}
      {withdrawalsQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 sm:p-4" role="alert">
          Unable to load withdrawals.
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 sm:p-4" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {!withdrawalsQuery.isLoading && !withdrawalsQuery.isError && withdrawals.length === 0 ? (
        <EmptyState
          icon={<IconWallet className="h-6 w-6" />}
          title="No withdrawals match"
          description={
            hasFilters
              ? 'Try clearing filters or choosing another status.'
              : 'Payouts across churches will appear here.'
          }
          actionLabel={hasFilters ? 'Clear filters' : undefined}
          onAction={hasFilters ? clearFilters : undefined}
        />
      ) : null}

      {withdrawals.length > 0 ? (
        <section className="card overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {withdrawals.map((withdrawal) => (
              <li key={withdrawal.id} className="px-3.5 py-3.5 sm:px-5 sm:py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold tabular-nums text-ink">
                      {formatKesCurrency(withdrawal.amount)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StatusBadge
                        label={withdrawal.status}
                        className="!px-2 !py-0 !text-[0.65rem] sm:!px-2.5 sm:!py-0.5 sm:!text-xs"
                      />
                      {withdrawal.church_id ? (
                        <Link
                          to={`/sadaka/churches/${withdrawal.church_id}`}
                          className="truncate text-xs font-medium text-brand-700 hover:underline sm:text-sm"
                        >
                          {withdrawal.church_name || 'View church'}
                        </Link>
                      ) : (
                        <span className="text-xs text-ink-muted">Church</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-2xs text-ink-muted sm:text-xs">
                      {formatDate(withdrawal.created_at || withdrawal.scheduled_for)}
                    </p>
                  </div>
                </div>

                {(withdrawal.status === 'failed' ||
                  withdrawal.status === 'pending' ||
                  withdrawal.status === 'processing') && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    {withdrawal.status === 'failed' ? (
                      <Button
                        size="sm"
                        disabled={retryMutation.isPending}
                        loading={retryMutation.isPending && retryMutation.variables === withdrawal.id}
                        onClick={() => retryMutation.mutate(withdrawal.id)}
                        className="col-span-2 sm:col-span-1 sm:!w-auto"
                        fullWidth
                      >
                        Retry
                      </Button>
                    ) : null}
                    {withdrawal.status === 'pending' || withdrawal.status === 'processing' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={cancelMutation.isPending}
                        loading={cancelMutation.isPending && cancelMutation.variables === withdrawal.id}
                        onClick={() => cancelMutation.mutate(withdrawal.id)}
                        className="col-span-2 sm:!w-auto"
                        fullWidth
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {total > 0 ? (
            <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-2.5 sm:justify-between sm:px-4 sm:py-3">
              <Button
                variant="secondary"
                size="sm"
                className="min-w-[5.5rem]"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="flex-1 text-center text-xs text-ink-muted sm:text-sm">
                Page {page}
                <span className="mx-1 text-slate-300">·</span>
                {total.toLocaleString('en-KE')} total
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="min-w-[5.5rem]"
                disabled={!hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
};
