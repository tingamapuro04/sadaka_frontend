import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, StatusBadge, useToast } from '../../../components/ui';
import { formatDate, formatKesCurrency } from '../../../utils/formatters';
import {
  fetchSadakaChurch,
  fetchSadakaChurchTransactions,
  fetchSadakaChurchWithdrawals,
  setSadakaChurchSuspended,
  sadakaQueryKeys
} from '../api';

type Tab = 'overview' | 'transactions' | 'withdrawals';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'withdrawals', label: 'Withdrawals' }
];

export const SadakaChurchDetailPage = () => {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
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
    onSuccess: (_data, suspended) => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: sadakaQueryKeys.church(id) });
      void queryClient.invalidateQueries({ queryKey: ['sadaka', 'churches'] });
      toast.success(suspended ? 'Church suspended' : 'Church unsuspended');
    },
    onError: (error: unknown) => {
      const message =
        error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
          ? (error as { message: string }).message
          : 'Unable to update church status.';
      setActionError(message);
      toast.error(message);
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
    <div className="space-y-4 animate-fade-in sm:space-y-5">
      <div>
        <Link to="/sadaka/churches" className="inline-flex text-sm font-semibold text-brand-700 hover:underline">
          ← Back to churches
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {church?.name ?? 'Church detail'}
          </h1>
          {church?.suspended ? <StatusBadge label="suspended" /> : null}
        </div>
        {church?.username ? (
          <p className="mt-0.5 text-sm text-ink-muted">@{church.username}</p>
        ) : (
          <p className="mt-0.5 text-sm text-ink-muted">Profile, money flow, and withdrawals.</p>
        )}
      </div>

      {churchQuery.isLoading ? (
        <div className="card card-pad text-sm text-ink-muted" role="status">
          Loading church detail…
        </div>
      ) : null}
      {churchQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 sm:p-4" role="alert">
          {churchQuery.error &&
          typeof churchQuery.error === 'object' &&
          'message' in churchQuery.error &&
          typeof (churchQuery.error as { message?: unknown }).message === 'string'
            ? (churchQuery.error as { message: string }).message
            : 'Unable to load church detail.'}
        </div>
      ) : null}

      {church ? (
        <div className="space-y-4">
          {church.suspended ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800 sm:px-4">
              This church is <strong>suspended</strong>. Public pay and church admin login are blocked.
            </div>
          ) : null}
          {actionError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              {actionError}
            </div>
          ) : null}

          <Button
            fullWidth
            className="sm:!w-auto"
            variant={church.suspended ? 'primary' : 'danger'}
            disabled={suspendMutation.isPending}
            loading={suspendMutation.isPending}
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
          >
            {suspendMutation.isPending
              ? 'Updating…'
              : church.suspended
                ? 'Unsuspend church'
                : 'Suspend church'}
          </Button>

          <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3" aria-label="Money metrics">
            <div className="stat-card border-brand-100 bg-gradient-to-br from-white to-brand-50/40">
              <p className="text-[0.65rem] font-medium uppercase tracking-wide text-ink-muted sm:text-xs">
                Available balance
              </p>
              <p className="stat-card-value text-[1.125rem] sm:text-xl">
                {formatKesCurrency(church.available_balance)}
              </p>
            </div>
            <div className="stat-card border-slate-200/80 bg-white">
              <p className="text-[0.65rem] font-medium uppercase tracking-wide text-ink-muted sm:text-xs">
                Total volume
              </p>
              <p className="stat-card-value text-[1.125rem] sm:text-xl">
                {formatKesCurrency(church.total_volume)}
              </p>
            </div>
            <div className="stat-card col-span-2 border-slate-200/80 bg-white sm:col-span-1">
              <p className="text-[0.65rem] font-medium uppercase tracking-wide text-ink-muted sm:text-xs">
                Fees collected
              </p>
              <p className="stat-card-value text-[1.125rem] sm:text-xl">
                {formatKesCurrency(church.total_fees_collected)}
              </p>
            </div>
          </section>

          <div
            className="mobile-chip-row border-b border-slate-100 pb-2"
            role="tablist"
            aria-label="Church sections"
          >
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`inline-flex shrink-0 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                  tab === key
                    ? 'border-slate-950 bg-slate-950 text-white shadow-soft'
                    : 'border-slate-200 bg-white text-slate-700 shadow-soft active:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'overview' ? (
            <>
              <Card>
                <h2 className="text-sm font-semibold text-ink">Transaction summary</h2>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-slate-50 p-2.5 sm:p-3">
                    <p className="text-2xs uppercase tracking-wide text-ink-muted">Total</p>
                    <p className="mt-1 text-base font-bold tabular-nums text-ink sm:text-lg">
                      {church.transaction_summary?.total_transactions ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-2.5 sm:p-3">
                    <p className="text-2xs uppercase tracking-wide text-emerald-800">Paid</p>
                    <p className="mt-1 text-base font-bold tabular-nums text-ink sm:text-lg">
                      {church.transaction_summary?.paid_transactions ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-2.5 sm:p-3">
                    <p className="text-2xs uppercase tracking-wide text-red-800">Failed</p>
                    <p className="mt-1 text-base font-bold tabular-nums text-ink sm:text-lg">
                      {church.transaction_summary?.failed_transactions ?? 0}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="text-sm font-semibold text-ink">Withdrawal summary</h2>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-2.5 sm:p-3">
                    <p className="text-2xs uppercase tracking-wide text-ink-muted">Total</p>
                    <p className="mt-1 text-base font-bold tabular-nums text-ink sm:text-lg">
                      {church.withdrawal_summary?.total_withdrawals ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-2.5 sm:p-3">
                    <p className="text-2xs uppercase tracking-wide text-emerald-800">Completed</p>
                    <p className="mt-1 text-base font-bold tabular-nums text-ink sm:text-lg">
                      {church.withdrawal_summary?.completed_withdrawals ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-2.5 sm:p-3">
                    <p className="text-2xs uppercase tracking-wide text-red-800">Failed</p>
                    <p className="mt-1 text-base font-bold tabular-nums text-ink sm:text-lg">
                      {church.withdrawal_summary?.failed_withdrawals ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-2.5 sm:p-3">
                    <p className="text-2xs uppercase tracking-wide text-amber-800">Pending</p>
                    <p className="mt-1 text-base font-bold tabular-nums text-ink sm:text-lg">
                      {church.withdrawal_summary?.pending_withdrawals ?? 0}
                    </p>
                  </div>
                </div>
              </Card>

              <Card padded={false}>
                <div className="border-b border-slate-100 px-3.5 py-3 sm:px-5">
                  <h2 className="text-sm font-semibold text-ink">Profile</h2>
                </div>
                <dl className="divide-y divide-slate-100">
                  {(
                    [
                      ['Name', church.name],
                      ['Username', `@${church.username}`],
                      ['Phone', church.phone],
                      ['Email', church.email ?? '—'],
                      ['Withdrawal method', church.withdrawal_method],
                      ['Withdrawal number', church.withdrawal_number],
                      ['Groups enabled', church.groups_enabled ? 'Yes' : 'No']
                    ] as const
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-baseline justify-between gap-3 px-3.5 py-3 text-sm sm:px-5"
                    >
                      <dt className="shrink-0 text-ink-muted">{label}</dt>
                      <dd className="min-w-0 truncate text-right font-medium capitalize text-ink">
                        {value}
                      </dd>
                    </div>
                  ))}
                  <div className="px-3.5 py-3 sm:px-5">
                    <dt className="text-sm text-ink-muted">Payment URL</dt>
                    {church.payment_url ? (
                      <dd className="mt-1">
                        <a
                          href={church.payment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-sm font-medium text-brand-700 hover:underline"
                          title={church.payment_url}
                        >
                          {church.payment_url}
                        </a>
                      </dd>
                    ) : (
                      <dd className="mt-1 text-sm font-medium text-ink">—</dd>
                    )}
                  </div>
                </dl>
              </Card>
            </>
          ) : null}

          {tab === 'transactions' ? (
            <section className="card overflow-hidden">
              {txQuery.isLoading ? (
                <p className="p-3.5 text-sm text-ink-muted sm:p-4" role="status">
                  Loading transactions…
                </p>
              ) : null}
              {txQuery.isError ? (
                <p className="p-3.5 text-sm text-red-700 sm:p-4" role="alert">
                  Unable to load transactions.
                </p>
              ) : null}
              <ul className="divide-y divide-slate-100">
                {(txQuery.data?.transactions ?? []).map((tx) => (
                  <li key={tx.id} className="flex items-start justify-between gap-3 px-3.5 py-3.5 sm:px-5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold tabular-nums text-ink">
                        {formatKesCurrency(tx.total_amount)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <StatusBadge
                          label={String(tx.status)}
                          className="!px-2 !py-0 !text-[0.65rem]"
                        />
                        <span className="truncate text-xs text-ink-muted">{tx.payer_phone}</span>
                      </div>
                      <p className="mt-1 text-2xs text-ink-muted">{formatDate(tx.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
              {!txQuery.isLoading && (txQuery.data?.transactions?.length ?? 0) === 0 ? (
                <p className="p-3.5 text-sm text-ink-muted sm:p-4">No transactions yet.</p>
              ) : null}
              {(txQuery.data?.total ?? 0) > 0 ? (
                <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-2.5 sm:px-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="min-w-[5.5rem]"
                    disabled={txPage <= 1}
                    onClick={() => setTxPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex-1 text-center text-xs text-ink-muted">Page {txPage}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="min-w-[5.5rem]"
                    disabled={!txQuery.data?.has_more}
                    onClick={() => setTxPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </section>
          ) : null}

          {tab === 'withdrawals' ? (
            <section className="card overflow-hidden">
              {wdQuery.isLoading ? (
                <p className="p-3.5 text-sm text-ink-muted sm:p-4" role="status">
                  Loading withdrawals…
                </p>
              ) : null}
              {wdQuery.isError ? (
                <p className="p-3.5 text-sm text-red-700 sm:p-4" role="alert">
                  Unable to load withdrawals.
                </p>
              ) : null}
              <ul className="divide-y divide-slate-100">
                {(wdQuery.data?.withdrawals ?? []).map((w) => (
                  <li key={w.id} className="flex items-start justify-between gap-3 px-3.5 py-3.5 sm:px-5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold tabular-nums text-ink">
                        {formatKesCurrency(w.amount)}
                      </p>
                      <div className="mt-1">
                        <StatusBadge
                          label={String(w.status)}
                          className="!px-2 !py-0 !text-[0.65rem]"
                        />
                      </div>
                      <p className="mt-1 text-2xs text-ink-muted">
                        {formatDate(w.created_at || w.scheduled_for)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              {!wdQuery.isLoading && (wdQuery.data?.withdrawals?.length ?? 0) === 0 ? (
                <p className="p-3.5 text-sm text-ink-muted sm:p-4">No withdrawals yet.</p>
              ) : null}
              {(wdQuery.data?.total ?? 0) > 0 ? (
                <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-2.5 sm:px-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="min-w-[5.5rem]"
                    disabled={wdPage <= 1}
                    onClick={() => setWdPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex-1 text-center text-xs text-ink-muted">Page {wdPage}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="min-w-[5.5rem]"
                    disabled={!wdQuery.data?.has_more}
                    onClick={() => setWdPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
