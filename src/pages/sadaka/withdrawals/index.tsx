import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDate, formatKesCurrency } from '../../../utils/formatters';
import { fetchSadakaChurches, fetchSadakaWithdrawals, cancelSadakaWithdrawal, retrySadakaWithdrawal, sadakaQueryKeys } from '../api';

const PAGE_SIZE = 8;

export const SadakaWithdrawalsPage = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [churchId, setChurchId] = useState('');
  const [page, setPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const withdrawalsQuery = useQuery({
    queryKey: sadakaQueryKeys.withdrawals,
    queryFn: fetchSadakaWithdrawals,
    refetchInterval: 30_000
  });
  const churchesQuery = useQuery({
    queryKey: sadakaQueryKeys.churches,
    queryFn: fetchSadakaChurches
  });

  const retryMutation = useMutation({
    mutationFn: retrySadakaWithdrawal,
    onSuccess: () => {
      setErrorMessage(null);
      void queryClient.invalidateQueries({ queryKey: sadakaQueryKeys.withdrawals });
      void queryClient.invalidateQueries({ queryKey: sadakaQueryKeys.dashboard });
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : 'Unable to retry this withdrawal right now.';
      setErrorMessage(message);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSadakaWithdrawal,
    onSuccess: () => {
      setErrorMessage(null);
      void queryClient.invalidateQueries({ queryKey: sadakaQueryKeys.withdrawals });
      void queryClient.invalidateQueries({ queryKey: sadakaQueryKeys.dashboard });
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
        ? (error as { message: string }).message
        : 'Unable to cancel this withdrawal right now.';
      setErrorMessage(message);
    }
  });

  const filteredWithdrawals = useMemo(() => {
    const rows = withdrawalsQuery.data ?? [];
    return rows.filter((withdrawal) => {
      const matchesStatus = !status || withdrawal.status === status;
      const matchesChurch = !churchId || withdrawal.church_id === churchId;
      return matchesStatus && matchesChurch;
    });
  }, [churchId, status, withdrawalsQuery.data]);

  const pagedWithdrawals = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredWithdrawals.slice(start, start + PAGE_SIZE);
  }, [filteredWithdrawals, page]);

  const hasNextPage = page * PAGE_SIZE < filteredWithdrawals.length;

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
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="w-full rounded border border-slate-300 px-3 py-2">
            <option value="">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Church</span>
          <select value={churchId} onChange={(event) => { setChurchId(event.target.value); setPage(1); }} className="w-full rounded border border-slate-300 px-3 py-2">
            <option value="">All churches</option>
            {(churchesQuery.data ?? []).map((church) => (
              <option key={church.id} value={church.id}>
                {church.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button type="button" onClick={() => void withdrawalsQuery.refetch()} className="rounded bg-slate-950 px-3 py-2 text-sm text-white">
            Refresh
          </button>
        </div>
      </section>

      {withdrawalsQuery.isLoading ? <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading withdrawals...</div> : null}
      {withdrawalsQuery.isError ? <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load withdrawals.</div> : null}
      {errorMessage ? <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div> : null}

      <section className="card">
        <div className="divide-y divide-slate-100">
          {!withdrawalsQuery.isLoading && pagedWithdrawals.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No withdrawals match the current filters.</p>
          ) : null}
          {pagedWithdrawals.map((withdrawal) => (
            <div key={withdrawal.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-950">
                  {withdrawal.church_name} · {formatKesCurrency(withdrawal.amount)}
                </p>
                <p className="text-sm text-slate-500">
                  <span className="capitalize">{withdrawal.status}</span> · Scheduled {formatDate(withdrawal.scheduled_for)} · Created {formatDate(withdrawal.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-slate-700">
                  {withdrawal.status}
                </span>
                {withdrawal.status === 'failed' ? (
                  <button
                    type="button"
                    onClick={() => retryMutation.mutate(withdrawal.id)}
                    disabled={retryMutation.isPending}
                    className="rounded bg-emerald-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Retry
                  </button>
                ) : null}
                {import.meta.env.DEV && (withdrawal.status === 'pending' || withdrawal.status === 'processing') ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm('Cancel this withdrawal? This is only available in development.')) {
                        return;
                      }
                      cancelMutation.mutate(withdrawal.id);
                    }}
                    disabled={cancelMutation.isPending}
                    className="rounded border border-red-300 px-3 py-2 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel (dev)
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || withdrawalsQuery.isLoading}
            className="rounded border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-slate-600">Page {page}</span>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!hasNextPage || withdrawalsQuery.isLoading}
            className="rounded border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
};
