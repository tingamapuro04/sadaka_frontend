import { useQuery } from '@tanstack/react-query';
import { formatKesCurrency } from '../../../utils/formatters';
import { sadakaQueryKeys, fetchSadakaDashboard } from '../api';

const cards = [
  { key: 'total_churches', label: 'Total churches' },
  { key: 'total_volume', label: 'Total volume' },
  { key: 'total_fees', label: 'Total fees' },
  { key: 'failed_withdrawals_pending_retry', label: 'Failed withdrawals pending retry' }
] as const;

export const SadakaDashboardPage = () => {
  const dashboardQuery = useQuery({
    queryKey: sadakaQueryKeys.dashboard,
    queryFn: fetchSadakaDashboard,
    refetchInterval: 30_000
  });

  const dashboard = dashboardQuery.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Platform Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">High-level Sadaka health and withdrawal risk overview.</p>
        </div>
        <button
          type="button"
          onClick={() => void dashboardQuery.refetch()}
          className="rounded bg-slate-950 px-3 py-2 text-sm text-white"
        >
          Refresh
        </button>
      </div>

      {dashboardQuery.isLoading ? <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading dashboard...</div> : null}
      {dashboardQuery.isError ? <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load dashboard data.</div> : null}

      {dashboard ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.key} className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {card.key === 'total_churches'
                  ? dashboard.total_churches.toLocaleString('en-KE')
                  : card.key === 'failed_withdrawals_pending_retry'
                    ? dashboard.failed_withdrawals_pending_retry.toLocaleString('en-KE')
                    : card.key === 'total_volume'
                      ? formatKesCurrency(dashboard.total_volume)
                      : formatKesCurrency(dashboard.total_fees)}
              </p>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
};
