import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { formatDate, formatKesCurrency } from '../../../utils/formatters';
import { adminQueryKeys, fetchDashboard, fetchEvents, fetchTransactions } from '../api';
import type { AdminBreakdown } from '../types';

const BreakdownList = ({ title, items, tone }: { title: string; items: AdminBreakdown[]; tone: 'emerald' | 'sky' }) => {
  const max = Math.max(...items.map((item) => item.total), 1);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? <p className="text-sm text-slate-500">No data yet.</p> : null}
        {items.map((item) => (
          <div key={`${title}-${item.category_id ?? item.group_id ?? item.name}`}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-slate-700">{item.name}</span>
              <span className="shrink-0 text-slate-600">{formatKesCurrency(item.total)}</span>
            </div>
            <div className="h-2 rounded bg-slate-100">
              <div
                className={tone === 'emerald' ? 'h-2 rounded bg-emerald-600' : 'h-2 rounded bg-sky-600'}
                style={{ width: `${Math.max((item.total / max) * 100, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
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
      <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600" role="status">
        Loading dashboard…
      </div>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
        Unable to load dashboard data. Please refresh and try again.
      </div>
    );
  }

  if (!dashboard) return null;

  const cards = [
    { label: 'Total income', value: formatKesCurrency(dashboard.total_income), hint: 'All paid gifts' },
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
      hint: 'Ready to withdraw'
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Overview of giving. Figures auto-refresh every 30 seconds.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5" aria-label="Key metrics">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{card.value}</p>
            <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
          </div>
        ))}
      </section>

      <section aria-label="Quick actions">
        <h2 className="text-base font-semibold text-slate-950">Quick actions</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              <p className="font-semibold text-slate-900">{item.label}</p>
              <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {activeEvents.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Active events">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950">Active events</h2>
            <Link to="/admin/events" className="text-sm font-semibold text-emerald-700 hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-slate-100">
            {activeEvents.slice(0, 3).map((event) => (
              <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <Link
                    to={`/admin/events/${event.id}`}
                    className="font-medium text-slate-900 hover:text-emerald-700 hover:underline"
                  >
                    {event.title}
                  </Link>
                  <p className="text-xs text-slate-500">
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
        </section>
      ) : isSuper ? (
        <section className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
          No active events.{' '}
          <Link to="/admin/events" className="font-semibold text-emerald-700 hover:underline">
            Create a fundraiser
          </Link>{' '}
          to share a dedicated payment link.
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <BreakdownList title="Category breakdown" items={dashboard.by_category} tone="emerald" />
        <BreakdownList title="Group breakdown" items={dashboard.by_group} tone="sky" />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-950">Recent transactions</h2>
          <Link to="/admin/transactions" className="text-sm font-semibold text-emerald-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentTransactions.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No recent transactions.</p>
          ) : null}
          {recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="grid gap-2 p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {transaction.payer_name || transaction.payer_phone}
                </p>
                <p className="text-slate-500">
                  {transaction.mpesa_ref || 'No M-PESA ref'} · {formatDate(transaction.created_at)}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-semibold text-slate-950">
                  {formatKesCurrency(transaction.total_amount)}
                </p>
                <StatusBadge label={String(transaction.status)} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
