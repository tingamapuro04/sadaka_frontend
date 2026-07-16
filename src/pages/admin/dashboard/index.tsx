import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, PageHeader, StatCard, StatusBadge } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { formatDate, formatKesCurrency } from '../../../utils/formatters';
import { adminQueryKeys, fetchDashboard, fetchEvents, fetchTransactions } from '../api';
import type { AdminBreakdown } from '../types';

const BreakdownList = ({ title, items, tone }: { title: string; items: AdminBreakdown[]; tone: 'emerald' | 'sky' }) => {
  const max = Math.max(...items.map((item) => item.total), 1);

  return (
    <Card>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? <p className="text-sm text-ink-muted">No data yet.</p> : null}
        {items.map((item) => (
          <div key={`${title}-${item.category_id ?? item.group_id ?? item.name}`}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-slate-700">{item.name}</span>
              <span className="shrink-0 tabular-nums text-slate-600">{formatKesCurrency(item.total)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={tone === 'emerald' ? 'h-2 rounded-full bg-brand-600' : 'h-2 rounded-full bg-sky-500'}
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
  const isSuper = role === 'church_super_admin';

  const dashboardQuery = useQuery({
    queryKey: adminQueryKeys.dashboard,
    queryFn: fetchDashboard,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true
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
    { to: '/admin/transactions', label: 'View transactions', desc: 'Filter and export gifts' },
    { to: '/admin/events', label: 'Manage events', desc: 'Share fundraiser links' },
    ...(isSuper
      ? [
          { to: '/admin/withdrawals', label: 'Withdrawals', desc: 'Request a payout' },
          { to: '/admin/church', label: 'Church settings', desc: 'Logo and destination' }
        ]
      : [{ to: '/admin/categories', label: 'Categories', desc: 'Offering purposes' }])
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Overview of giving. Figures auto-refresh every 30 seconds."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5" aria-label="Key metrics">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            hint={card.hint}
            accent={card.accent ?? 'neutral'}
          />
        ))}
      </section>

      <section aria-label="Quick actions">
        <h2 className="text-base font-semibold text-ink">Quick actions</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <h2 className="text-base font-semibold text-ink">Active events</h2>
            <Link to="/admin/events" className="text-sm font-semibold text-brand-700 hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-slate-100">
            {activeEvents.slice(0, 3).map((event) => (
              <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <Link
                    to={`/admin/events/${event.id}`}
                    className="font-medium text-ink hover:text-brand-700 hover:underline"
                  >
                    {event.title}
                  </Link>
                  <p className="text-xs text-ink-muted">
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
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-ink-muted">
          No active events.{' '}
          <Link to="/admin/events" className="font-semibold text-brand-700 hover:underline">
            Create a fundraiser
          </Link>{' '}
          to share a dedicated payment link.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <BreakdownList title="Category breakdown" items={dashboard.by_category} tone="emerald" />
        <BreakdownList title="Group breakdown" items={dashboard.by_group} tone="sky" />
      </div>

      <Card padded={false}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="text-base font-semibold text-ink">Recent transactions</h2>
          <Link to="/admin/transactions" className="text-sm font-semibold text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentTransactions.length === 0 ? (
            <p className="p-4 text-sm text-ink-muted">No recent transactions.</p>
          ) : null}
          {recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="grid gap-2 p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"
            >
              <div>
                <p className="font-medium text-ink">
                  {transaction.payer_name || transaction.payer_phone}
                </p>
                <p className="text-ink-muted">
                  {transaction.mpesa_ref || 'No M-PESA ref'} · {formatDate(transaction.created_at)}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-semibold tabular-nums text-ink">
                  {formatKesCurrency(transaction.total_amount)}
                </p>
                <StatusBadge label={String(transaction.status)} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
