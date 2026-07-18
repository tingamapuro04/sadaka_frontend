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
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Platform Dashboard"
        description="Multi-church volume, fees, and risk. Auto-refreshes every 30s."
        actions={
          <Button
            variant="secondary"
            fullWidth
            className="sm:!w-auto"
            onClick={() => void dashboardQuery.refetch()}
            loading={dashboardQuery.isFetching}
          >
            Refresh
          </Button>
        }
      />

      {dashboardQuery.isLoading ? (
        <div className="card card-pad text-sm text-ink-muted" role="status">
          Loading dashboard…
        </div>
      ) : null}
      {dashboardQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 sm:p-4" role="alert">
          Unable to load dashboard data.
        </div>
      ) : null}

      {dashboard ? (
        <>
          {(failedWd > 0 || failedPay > 0) && (
            <section
              className="rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-3 sm:p-4"
              aria-label="Needs attention"
            >
              <p className="text-2xs font-semibold uppercase tracking-wide text-amber-800">
                Needs attention
              </p>
              <ul className="mt-2 space-y-2 text-sm text-amber-950">
                {failedWd > 0 ? (
                  <li>
                    <Link
                      to="/sadaka/withdrawals?status=failed"
                      className="font-semibold text-brand-800 underline"
                    >
                      {failedWd} failed withdrawal{failedWd === 1 ? '' : 's'}
                    </Link>
                    <span className="text-amber-900/90"> ready to retry</span>
                  </li>
                ) : null}
                {failedPay > 0 ? (
                  <li>
                    <Link
                      to="/sadaka/transactions?status=failed"
                      className="font-semibold text-brand-800 underline"
                    >
                      {failedPay} failed payment{failedPay === 1 ? '' : 's'}
                    </Link>
                    <span className="text-amber-900/90"> in the last 24 hours</span>
                  </li>
                ) : null}
              </ul>
              {dashboard.failed_withdrawals && dashboard.failed_withdrawals.length > 0 ? (
                <ul className="mt-3 space-y-2 border-t border-amber-200/80 pt-3 text-sm">
                  {dashboard.failed_withdrawals.map((w) => (
                    <li key={w.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-amber-950">
                          {w.church_name || w.church_id}
                        </p>
                        <p className="tabular-nums text-xs text-amber-900/80">
                          {formatKesCurrency(w.amount)}
                        </p>
                      </div>
                      <Link
                        to={`/sadaka/churches/${w.church_id}`}
                        className="shrink-0 text-sm font-semibold text-brand-800 underline"
                      >
                        Church
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          )}

          <section
            className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4"
            aria-label="Platform metrics"
          >
            <StatCard
              compact
              label="Total churches"
              accent="brand"
              value={dashboard.total_churches.toLocaleString('en-KE')}
            />
            <StatCard
              compact
              label="Total volume"
              accent="brand"
              value={formatKesCurrency(dashboard.total_volume)}
            />
            <StatCard
              compact
              label="Total fees"
              accent="neutral"
              value={formatKesCurrency(dashboard.total_fees)}
              hint="Platform fees"
            />
            <StatCard
              compact
              label="Failed withdrawals"
              accent="sky"
              value={dashboard.failed_withdrawals_pending_retry.toLocaleString('en-KE')}
              hint="Needs attention"
            />
            <StatCard
              compact
              label="Awaiting payment"
              accent="neutral"
              value={(dashboard.awaiting_payments ?? 0).toLocaleString('en-KE')}
              hint="STK in flight"
            />
            <StatCard
              compact
              label="Failed payments (24h)"
              accent="sky"
              value={(dashboard.failed_payments_24h ?? 0).toLocaleString('en-KE')}
            />
            <StatCard
              compact
              label="Volume (7d)"
              accent="brand"
              value={formatKesCurrency(dashboard.paid_volume_7d ?? 0)}
            />
            <StatCard
              compact
              label="Volume (30d)"
              accent="brand"
              value={formatKesCurrency(dashboard.paid_volume_30d ?? 0)}
            />
          </section>

          {/* Quick links for mobile ops */}
          <section aria-label="Quick links" className="sm:hidden">
            <h2 className="text-sm font-semibold text-ink">Quick links</h2>
            <div className="mt-2 mobile-chip-row">
              <Link
                to="/sadaka/churches"
                className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-ink shadow-soft"
              >
                Churches
              </Link>
              <Link
                to="/sadaka/transactions"
                className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-ink shadow-soft"
              >
                Transactions
              </Link>
              <Link
                to="/sadaka/withdrawals"
                className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-ink shadow-soft"
              >
                Withdrawals
              </Link>
              <Link
                to="/sadaka/audit-logs"
                className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-ink shadow-soft"
              >
                Logs
              </Link>
            </div>
          </section>

          {dashboard.top_churches && dashboard.top_churches.length > 0 ? (
            <section className="card overflow-hidden">
              <div className="border-b border-slate-100 px-3.5 py-3 sm:px-5">
                <h2 className="text-sm font-semibold text-ink sm:text-base">Top churches by volume</h2>
                <p className="mt-0.5 text-xs text-ink-muted">Highest collecting churches on the platform.</p>
              </div>
              <ul className="divide-y divide-slate-100">
                {dashboard.top_churches.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/sadaka/churches/${c.id}`}
                      className="flex items-start justify-between gap-3 px-3.5 py-3.5 active:bg-slate-50 sm:px-5 sm:py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">@{c.username}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums text-ink">
                          {formatKesCurrency(c.total_volume)}
                        </p>
                        <p className="mt-0.5 text-2xs text-ink-muted sm:text-xs">
                          Bal {formatKesCurrency(c.available_balance)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
