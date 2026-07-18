import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, PageHeader, StatCard, StatusBadge, useToast } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { formatDate, formatKesCurrency } from '../../../utils/formatters';
import {
  adminQueryKeys,
  fetchChurch,
  fetchDashboard,
  fetchEvents,
  fetchTransactions
} from '../api';
import type { AdminBreakdown } from '../types';

const BreakdownList = ({ title, items, tone }: { title: string; items: AdminBreakdown[]; tone: 'emerald' | 'sky' }) => {
  const max = Math.max(...items.map((item) => item.total), 1);

  return (
    <Card>
      <h2 className="text-sm font-semibold text-ink sm:text-base">{title}</h2>
      <div className="mt-3 space-y-3 sm:mt-4">
        {items.length === 0 ? <p className="text-sm text-ink-muted">No data yet.</p> : null}
        {items.map((item) => (
          <div key={`${title}-${item.category_id ?? item.group_id ?? item.name}`}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-slate-700">{item.name}</span>
              <span className="shrink-0 tabular-nums text-slate-600">{formatKesCurrency(item.total)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 sm:h-2">
              <div
                className={
                  tone === 'emerald' ? 'h-full rounded-full bg-brand-600' : 'h-full rounded-full bg-sky-500'
                }
                style={{ width: `${Math.max((item.total / max) * 100, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export const AdminDashboardPage = () => {
  const { role } = useAuth();
  const toast = useToast();
  const isSuper = role === 'church_super_admin';

  const dashboardQuery = useQuery({
    queryKey: adminQueryKeys.dashboard,
    queryFn: fetchDashboard,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });
  const churchQuery = useQuery({
    queryKey: adminQueryKeys.church,
    queryFn: fetchChurch,
    staleTime: 60_000
  });
  const recentQuery = useQuery({
    queryKey: adminQueryKeys.transactions({ page: 1 }),
    queryFn: () => fetchTransactions({ page: 1 }),
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
  });
  const eventsQuery = useQuery({
    queryKey: adminQueryKeys.events({ status: 'active' }),
    queryFn: () => fetchEvents({ status: 'active' }),
    staleTime: 60_000
  });

  const recentTransactions = useMemo(
    () => recentQuery.data?.transactions.slice(0, 5) ?? [],
    [recentQuery.data]
  );
  const activeEvents = eventsQuery.data?.events ?? [];
  const dashboard = dashboardQuery.data;
  const paymentUrl = churchQuery.data?.payment_url?.trim() || '';
  const churchUsername = churchQuery.data?.username?.trim() || '';

  const copyPaymentLink = async () => {
    if (!paymentUrl) return;
    try {
      await navigator.clipboard.writeText(paymentUrl);
      toast.success('Payment link copied');
    } catch {
      window.prompt('Copy payment link:', paymentUrl);
    }
  };

  if (dashboardQuery.isLoading) {
    return (
      <div className="card card-pad text-sm text-ink-muted" role="status">
        Loading dashboard…
      </div>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
        Unable to load dashboard data. Please refresh and try again.
      </div>
    );
  }

  if (!dashboard) return null;

  type Metric = { label: string; value: string; hint: string; accent?: 'brand' | 'neutral' | 'sky' };
  const cards: Metric[] = [
    { label: 'Total income', value: formatKesCurrency(dashboard.total_income), hint: 'All paid gifts', accent: 'brand' },
    {
      label: 'Today',
      value: dashboard.transaction_counts.today.toLocaleString('en-KE'),
      hint: 'Transactions'
    },
    {
      label: 'This week',
      value: dashboard.transaction_counts.week.toLocaleString('en-KE'),
      hint: 'Transactions'
    },
    {
      label: 'This month',
      value: dashboard.transaction_counts.month.toLocaleString('en-KE'),
      hint: 'Transactions'
    }
  ];

  if (isSuper && dashboard.available_balance !== undefined) {
    cards.unshift({
      label: 'Available balance',
      value: formatKesCurrency(dashboard.available_balance),
      hint: 'Ready to withdraw',
      accent: 'brand'
    });
  }

  const shortcuts = [
    { to: '/admin/transactions', label: 'Transactions', desc: 'Filter and export gifts' },
    { to: '/admin/events', label: 'Events', desc: 'Share fundraiser links' },
    ...(isSuper
      ? [
          { to: '/admin/withdrawals', label: 'Withdrawals', desc: 'Request a payout' },
          { to: '/admin/church', label: 'Settings', desc: 'Logo and destination' }
        ]
      : [{ to: '/admin/categories', label: 'Categories', desc: 'Offering purposes' }])
  ];

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of giving. Figures refresh every 30 seconds."
      />

      {/* Share strip — primary action for newly registered churches */}
      <Card
        aria-label="Public payment link"
        className="border-brand-100 bg-gradient-to-br from-white via-white to-brand-50/50"
      >
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-2xs font-semibold uppercase tracking-wider text-brand-700">
                Share with givers
              </p>
              {churchUsername ? (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-2xs font-medium text-brand-800">
                  @{churchUsername}
                </span>
              ) : null}
            </div>
            <h2 className="mt-1 text-sm font-semibold text-ink sm:text-base">Public payment link</h2>
            <p className="mt-0.5 text-xs text-ink-muted sm:text-sm">
              Members open this link to give via M-Pesa.
            </p>
            {churchQuery.isLoading ? (
              <p className="mt-2 text-sm text-ink-muted" role="status">
                Loading payment link…
              </p>
            ) : null}
            {churchQuery.isError ? (
              <p className="mt-2 text-sm text-red-700" role="alert">
                Unable to load your payment link. Open{' '}
                <Link to="/admin/church" className="font-semibold underline">
                  Church settings
                </Link>{' '}
                and try again.
              </p>
            ) : null}
            {paymentUrl ? (
              <a
                href={paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block truncate text-sm font-medium text-brand-700 hover:underline"
                title={paymentUrl}
              >
                {paymentUrl}
              </a>
            ) : null}
            {!churchQuery.isLoading && !churchQuery.isError && !paymentUrl ? (
              <p className="mt-2 text-sm text-ink-muted">
                Payment link is not available yet. Check church settings for your username.
              </p>
            ) : null}
          </div>
          <div className="mobile-actions sm:justify-start">
            <Button type="button" onClick={() => void copyPaymentLink()} disabled={!paymentUrl}>
              Copy link
            </Button>
            {paymentUrl ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => window.open(paymentUrl, '_blank', 'noopener,noreferrer')}
              >
                Open link
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Metrics: always 2-up on phones so cards don’t tower */}
      <section
        className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-3 2xl:grid-cols-5"
        aria-label="Key metrics"
      >
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            hint={card.hint}
            accent={card.accent ?? 'neutral'}
            compact
          />
        ))}
      </section>

      {/* Quick actions: horizontal chips on mobile, cards on sm+ */}
      <section aria-label="Quick actions">
        <h2 className="text-sm font-semibold text-ink sm:text-base">Quick actions</h2>

        <div className="mt-2 mobile-chip-row sm:hidden">
          {shortcuts.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-ink shadow-soft active:bg-slate-50"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-3 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="card card-pad transition hover:border-brand-200 hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <p className="font-semibold text-ink">{item.label}</p>
              <p className="mt-1 text-xs text-ink-muted">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {activeEvents.length > 0 ? (
        <Card aria-label="Active events">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink sm:text-base">Active events</h2>
            <Link to="/admin/events" className="text-sm font-semibold text-brand-700 hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-2 divide-y divide-slate-100 sm:mt-3">
            {activeEvents.slice(0, 3).map((event) => (
              <li key={event.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    to={`/admin/events/${event.id}`}
                    className="block truncate font-medium text-ink hover:text-brand-700 hover:underline"
                  >
                    {event.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Raised {formatKesCurrency(event.totals?.paid_gross ?? 0)}
                    {event.target_amount != null
                      ? ` of ${formatKesCurrency(event.target_amount)}`
                      : ''}
                  </p>
                </div>
                <StatusBadge label="active" />
              </li>
            ))}
          </ul>
        </Card>
      ) : isSuper ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3.5 py-3.5 text-sm text-ink-muted sm:p-4">
          No active events.{' '}
          <Link to="/admin/events" className="font-semibold text-brand-700 hover:underline">
            Create a fundraiser
          </Link>{' '}
          to share a dedicated payment link.
        </div>
      ) : null}

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
        <BreakdownList title="Category breakdown" items={dashboard.by_category} tone="emerald" />
        <BreakdownList title="Group breakdown" items={dashboard.by_group} tone="sky" />
      </div>

      <Card padded={false}>
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-ink sm:text-base">Recent transactions</h2>
          <Link to="/admin/transactions" className="shrink-0 text-sm font-semibold text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentTransactions.length === 0 ? (
            <p className="p-3.5 text-sm text-ink-muted sm:p-4">No recent transactions.</p>
          ) : null}
          {recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-start justify-between gap-3 p-3.5 text-sm sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-2 sm:px-5 sm:py-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">
                  {transaction.payer_name || transaction.payer_phone}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-muted sm:text-sm">
                  {transaction.mpesa_ref || 'No M-PESA ref'} · {formatDate(transaction.created_at)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold tabular-nums text-ink">
                  {formatKesCurrency(transaction.total_amount)}
                </p>
                <div className="mt-1 flex justify-end">
                  <StatusBadge label={String(transaction.status)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
