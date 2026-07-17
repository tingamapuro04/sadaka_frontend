import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { formatDate, formatKesCurrency } from '../../../utils/formatters';
import {
  fetchSadakaChurch,
  fetchSadakaChurchTransactions,
  fetchSadakaChurchWithdrawals,
  setSadakaChurchSuspended,
  sadakaQueryKeys
} from '../api';

type Tab = 'overview' | 'transactions' | 'withdrawals';

export const SadakaChurchDetailPage = () => {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [txPage, setTxPage] = useState(1);
  const [wdPage, setWdPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  const churchQuery = useQuery({
    queryKey: sadakaQueryKeys.church(id),
    queryFn: () => fetchSadakaChurch(id),
    enabled: Boolean(id)
  });

  const suspendMutation = useMutation({
    mutationFn: (suspended: boolean) => setSadakaChurchSuspended(id, suspended),
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: sadakaQueryKeys.church(id) });
      void queryClient.invalidateQueries({ queryKey: ['sadaka', 'churches'] });
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
          ? (error as { message: string }).message
          : 'Unable to update church status.';
      setActionError(message);
    }
  });

  const txParams = { page: txPage, limit: 10 };
  const txQuery = useQuery({
    queryKey: [...sadakaQueryKeys.church(id), 'transactions', txParams],
    queryFn: () => fetchSadakaChurchTransactions(id, txParams),
    enabled: Boolean(id) && tab === 'transactions'
  });

  const wdParams = { page: wdPage, limit: 10 };
  const wdQuery = useQuery({
    queryKey: [...sadakaQueryKeys.church(id), 'withdrawals', wdParams],
    queryFn: () => fetchSadakaChurchWithdrawals(id, wdParams),
    enabled: Boolean(id) && tab === 'withdrawals'
  });

  const church = churchQuery.data;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link to="/sadaka/churches" className="text-sm text-slate-600 hover:underline">
            Back to churches
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            {church?.name ?? 'Church detail'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">Profile, money flow, and withdrawals.</p>
        </div>
      </div>

      {churchQuery.isLoading ? (
        <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading church detail...</div>
      ) : null}
      {churchQuery.isError ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load church detail.</div>
      ) : null}

      {church ? (
        <div className="space-y-4">
          {church.suspended ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              This church is <strong>suspended</strong>. Public pay and church admin login are blocked.
            </div>
          ) : null}
          {actionError ? (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={suspendMutation.isPending}
              onClick={() => {
                const next = !church.suspended;
                if (
                  next &&
                  !window.confirm(
                    `Suspend ${church.name}? Public payments and church admin login will be blocked.`
                  )
                ) {
                  return;
                }
                suspendMutation.mutate(next);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50 ${
                church.suspended
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {suspendMutation.isPending
                ? 'Updating…'
                : church.suspended
                  ? 'Unsuspend church'
                  : 'Suspend church'}
            </button>
          </div>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Available balance</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatKesCurrency(church.available_balance)}</p>
            </div>
            <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Total volume</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatKesCurrency(church.total_volume)}</p>
            </div>
            <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Fees collected</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatKesCurrency(church.total_fees_collected)}</p>
            </div>
          </section>

          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
            {(
              [
                ['overview', 'Overview'],
                ['transactions', 'Transactions'],
                ['withdrawals', 'Withdrawals']
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  tab === key ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'overview' ? (
            <>
              <section className="grid gap-3 rounded border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">Transaction summary</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">{church.transaction_summary?.total_transactions ?? 0}</p>
                    </div>
                    <div className="rounded bg-emerald-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-emerald-700">Paid</p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">{church.transaction_summary?.paid_transactions ?? 0}</p>
                    </div>
                    <div className="rounded bg-red-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-red-700">Failed</p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">{church.transaction_summary?.failed_transactions ?? 0}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Withdrawal summary</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    <div className="rounded bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">{church.withdrawal_summary?.total_withdrawals ?? 0}</p>
                    </div>
                    <div className="rounded bg-emerald-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-emerald-700">Completed</p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">{church.withdrawal_summary?.completed_withdrawals ?? 0}</p>
                    </div>
                    <div className="rounded bg-red-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-red-700">Failed</p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">{church.withdrawal_summary?.failed_withdrawals ?? 0}</p>
                    </div>
                    <div className="rounded bg-amber-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-amber-700">Pending</p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">{church.withdrawal_summary?.pending_withdrawals ?? 0}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-3 rounded border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
                <div><p className="text-sm text-slate-500">Name</p><p className="font-medium text-slate-950">{church.name}</p></div>
                <div><p className="text-sm text-slate-500">Username</p><p className="font-medium text-slate-950">@{church.username}</p></div>
                <div><p className="text-sm text-slate-500">Phone</p><p className="font-medium text-slate-950">{church.phone}</p></div>
                <div><p className="text-sm text-slate-500">Email</p><p className="font-medium text-slate-950">{church.email ?? '—'}</p></div>
                <div><p className="text-sm text-slate-500">Withdrawal method</p><p className="font-medium capitalize text-slate-950">{church.withdrawal_method}</p></div>
                <div><p className="text-sm text-slate-500">Withdrawal number</p><p className="font-medium text-slate-950">{church.withdrawal_number}</p></div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-slate-500">Payment URL</p>
                  <p className="font-medium text-slate-950 break-all">{church.payment_url}</p>
                  {church.payment_url ? (
                    <a href={church.payment_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-brand-700 underline">
                      Open public pay page
                    </a>
                  ) : null}
                </div>
                <div className="sm:col-span-2"><p className="text-sm text-slate-500">Groups enabled</p><p className="font-medium text-slate-950">{church.groups_enabled ? 'Yes' : 'No'}</p></div>
              </section>
            </>
          ) : null}

          {tab === 'transactions' ? (
            <section className="card">
              {txQuery.isLoading ? <p className="p-4 text-sm text-slate-600">Loading transactions…</p> : null}
              {txQuery.isError ? <p className="p-4 text-sm text-red-700">Unable to load transactions.</p> : null}
              <div className="divide-y divide-slate-100">
                {(txQuery.data?.transactions ?? []).map((tx) => (
                  <div key={tx.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{formatKesCurrency(tx.total_amount)}</p>
                      <p className="text-slate-500">{tx.payer_phone} · {tx.status.replace(/_/g, ' ')}</p>
                    </div>
                    <p className="text-slate-400">{formatDate(tx.created_at)}</p>
                  </div>
                ))}
                {!txQuery.isLoading && (txQuery.data?.transactions?.length ?? 0) === 0 ? (
                  <p className="p-4 text-sm text-slate-500">No transactions yet.</p>
                ) : null}
              </div>
              {(txQuery.data?.total ?? 0) > 0 ? (
                <div className="flex justify-between border-t border-slate-100 px-4 py-3 text-sm">
                  <span>Page {txPage}</span>
                  <div className="flex gap-2">
                    <button type="button" disabled={txPage <= 1} onClick={() => setTxPage((p) => p - 1)} className="rounded border px-2 py-1 disabled:opacity-40">Prev</button>
                    <button type="button" disabled={!txQuery.data?.has_more} onClick={() => setTxPage((p) => p + 1)} className="rounded border px-2 py-1 disabled:opacity-40">Next</button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {tab === 'withdrawals' ? (
            <section className="card">
              {wdQuery.isLoading ? <p className="p-4 text-sm text-slate-600">Loading withdrawals…</p> : null}
              {wdQuery.isError ? <p className="p-4 text-sm text-red-700">Unable to load withdrawals.</p> : null}
              <div className="divide-y divide-slate-100">
                {(wdQuery.data?.withdrawals ?? []).map((w) => (
                  <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{formatKesCurrency(w.amount)}</p>
                      <p className="capitalize text-slate-500">{w.status}</p>
                    </div>
                    <p className="text-slate-400">{formatDate(w.created_at || w.scheduled_for)}</p>
                  </div>
                ))}
                {!wdQuery.isLoading && (wdQuery.data?.withdrawals?.length ?? 0) === 0 ? (
                  <p className="p-4 text-sm text-slate-500">No withdrawals yet.</p>
                ) : null}
              </div>
              {(wdQuery.data?.total ?? 0) > 0 ? (
                <div className="flex justify-between border-t border-slate-100 px-4 py-3 text-sm">
                  <span>Page {wdPage}</span>
                  <div className="flex gap-2">
                    <button type="button" disabled={wdPage <= 1} onClick={() => setWdPage((p) => p - 1)} className="rounded border px-2 py-1 disabled:opacity-40">Prev</button>
                    <button type="button" disabled={!wdQuery.data?.has_more} onClick={() => setWdPage((p) => p + 1)} className="rounded border px-2 py-1 disabled:opacity-40">Next</button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
