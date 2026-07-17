import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button, PageHeader, StatCard } from '../../../components/ui';
import { formatKesCurrency } from '../../../utils/formatters';
import { sadakaQueryKeys, fetchSadakaDashboard } from '../api';

export const SadakaDashboardPage = () => {
  const dashboardQuery = useQuery({
    queryKey: sadakaQueryKeys.dashboard,
    queryFn: fetchSadakaDashboard,
    refetchInterval: 30_000
  });

  const dashboard = dashboardQuery.data;
  const failedWd = dashboard?.failed_withdrawals_pending_retry ?? 0;
  const failedPay = dashboard?.failed_payments_24h ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Platform"
        title="Platform Dashboard"
        description="Control tower for multi-church volume, fees, and risk."
        actions={
          <Button
            variant="secondary"
            onClick={() => void dashboardQuery.refetch()}
            loading={dashboardQuery.isFetching}
          >
            Refresh
          </Button>
        }
      />

      {dashboardQuery.isLoading ? (
        <div className="card card-pad text-sm text-ink-muted" role="status">
          Loading dashboard...
        </div>
      ) : null}
      {dashboardQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          Unable to load dashboard data.
        </div>
      ) : null}

      {dashboard ? (
        <>
          {(failedWd > 0 || failedPay > 0) && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4" aria-label="Needs attention">
              <h2 className="text-sm font-semibold text-amber-950">Needs attention</h2>
              <ul className="mt-2 space-y-1 text-sm text-amber-900">
                {failedWd > 0 ? (
                  <li>
                    <Link to="/sadaka/withdrawals?status=failed" className="font-medium underline">
                      {failedWd} failed withdrawal{failedWd === 1 ? '' : 's'}
                    </Link>
                    {' '}ready to retry
                  </li>
                ) : null}
                {failedPay > 0 ? (
                  <li>
                    <Link to="/sadaka/transactions?status=failed" className="font-medium underline">
                      {failedPay} failed payment{failedPay === 1 ? '' : 's'}
                    </Link>
                    {' '}in the last 24 hours
                  </li>
                ) : null}
              </ul>
              {dashboard.failed_withdrawals && dashboard.failed_withdrawals.length > 0 ? (
                <ul className="mt-3 space-y-1 border-t border-amber-200 pt-3 text-sm">
                  {dashboard.failed_withdrawals.map((w) => (
                    <li key={w.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        {w.church_name || w.church_id} · {formatKesCurrency(w.amount)}
                      </span>
                      <Link to={`/sadaka/churches/${w.church_id}`} className="text-brand-800 underline">
                        Church
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          )}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Platform metrics">
            <StatCard label="Total churches" accent="brand" value={dashboard.total_churches.toLocaleString('en-KE')} />
            <StatCard label="Total volume" accent="brand" value={formatKesCurrency(dashboard.total_volume)} />
            <StatCard label="Total fees" accent="neutral" value={formatKesCurrency(dashboard.total_fees)} hint="Platform fees collected" />
            <StatCard
              label="Failed withdrawals"
              accent="sky"
              value={dashboard.failed_withdrawals_pending_retry.toLocaleString('en-KE')}
              hint="Needs attention"
            />
            <StatCard
              label="Awaiting payment"
              accent="neutral"
              value={(dashboard.awaiting_payments ?? 0).toLocaleString('en-KE')}
              hint="STK in flight"
            />
            <StatCard
              label="Failed payments (24h)"
              accent="sky"
              value={(dashboard.failed_payments_24h ?? 0).toLocaleString('en-KE')}
            />
            <StatCard label="Volume (7d)" accent="brand" value={formatKesCurrency(dashboard.paid_volume_7d ?? 0)} />
            <StatCard label="Volume (30d)" accent="brand" value={formatKesCurrency(dashboard.paid_volume_30d ?? 0)} />
          </section>

          {dashboard.top_churches && dashboard.top_churches.length > 0 ? (
            <section className="card">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">Top churches by volume</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {dashboard.top_churches.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div>
                      <Link to={`/sadaka/churches/${c.id}`} className="font-medium text-slate-950 hover:underline">
                        {c.name}
                      </Link>
                      <p className="text-slate-500">@{c.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatKesCurrency(c.total_volume)}</p>
                      <p className="text-slate-500">Bal {formatKesCurrency(c.available_balance)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
