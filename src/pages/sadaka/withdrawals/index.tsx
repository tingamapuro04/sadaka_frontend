import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDate, formatKesCurrency } from '../../../utils/formatters';
import {
  cancelSadakaWithdrawal,
  fetchSadakaChurches,
  fetchSadakaWithdrawals,
  retrySadakaWithdrawal,
  sadakaQueryKeys
} from '../api';

export const SadakaWithdrawalsPage = () => {
  const queryClient = useQueryClient();
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
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
          ? (error as { message: string }).message
          : 'Unable to retry this withdrawal right now.';
      setErrorMessage(message);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSadakaWithdrawal,
    onSuccess: () => {
      setErrorMessage(null);
      invalidate();
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
          ? (error as { message: string }).message
          : 'Unable to cancel this withdrawal right now.';
      setErrorMessage(message);
    }
  });

  const pageData = withdrawalsQuery.data;
  const withdrawals = pageData?.withdrawals ?? [];
  const total = pageData?.total ?? 0;
  const hasNextPage = Boolean(pageData?.has_more);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Withdrawals</h1>
          <p className="page-subtitle">Platform-wide status, filter, and retry controls.</p>
        </div>
      </div>

      <section className="grid gap-3 card card-pad md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="w-full rounded border border-slate-300 px-3 py-2"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Church</span>
          <select
            value={churchId}
            onChange={(event) => {
              setChurchId(event.target.value);
              setPage(1);
            }}
            className="w-full rounded border border-slate-300 px-3 py-2"
          >
            <option value="">All churches</option>
            {(churchesQuery.data?.churches ?? []).map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => void withdrawalsQuery.refetch()}
            className="rounded bg-slate-950 px-3 py-2 text-sm text-white"
          >
            Refresh
          </button>
        </div>
      </section>

      {withdrawalsQuery.isLoading ? (
        <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading withdrawals...</div>
      ) : null}
      {withdrawalsQuery.isError ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load withdrawals.</div>
      ) : null}
      {errorMessage ? <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div> : null}

      <section className="card">
        <div className="divide-y divide-slate-100">
          {!withdrawalsQuery.isLoading && withdrawals.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No withdrawals match the current filters.</p>
          ) : null}
          {withdrawals.map((withdrawal) => (
            <div key={withdrawal.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{formatKesCurrency(withdrawal.amount)}</p>
                <p className="text-sm text-slate-500">
                  {withdrawal.church_name || 'Church'} ·{' '}
                  <span className="capitalize">{withdrawal.status}</span>
                </p>
                <p className="text-xs text-slate-400">{formatDate(withdrawal.created_at || withdrawal.scheduled_for)}</p>
                {withdrawal.church_id ? (
                  <Link to={`/sadaka/churches/${withdrawal.church_id}`} className="text-xs text-brand-700 hover:underline">
                    View church
                  </Link>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {withdrawal.status === 'failed' ? (
                  <button
                    type="button"
                    disabled={retryMutation.isPending}
                    onClick={() => retryMutation.mutate(withdrawal.id)}
                    className="rounded bg-brand-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Retry
                  </button>
                ) : null}
                {withdrawal.status === 'pending' || withdrawal.status === 'processing' ? (
                  <button
                    type="button"
                    disabled={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate(withdrawal.id)}
                    className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {total > 0 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            <p>
              Page {page} · {total} total
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};
