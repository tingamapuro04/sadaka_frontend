import { useQuery } from '@tanstack/react-query';
import { Button, PageHeader, StatCard } from '../../../components/ui';
import { formatKesCurrency } from '../../../utils/formatters';
import { sadakaQueryKeys, fetchSadakaDashboard } from '../api';

const cards = [
  { key: 'total_churches', label: 'Total churches', accent: 'brand' as const },
  { key: 'total_volume', label: 'Total volume', accent: 'brand' as const },
  { key: 'total_fees', label: 'Total fees', accent: 'neutral' as const },
  { key: 'failed_withdrawals_pending_retry', label: 'Failed withdrawals', accent: 'sky' as const }
] as const;

export const SadakaDashboardPage = () => {
  const dashboardQuery = useQuery({
    queryKey: sadakaQueryKeys.dashboard,
    queryFn: fetchSadakaDashboard,
    refetchInterval: 30_000
  });

  const dashboard = dashboardQuery.data;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Platform"
        title="Platform Dashboard"
        description="High-level Sadaka health and withdrawal risk overview."
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
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Platform metrics">
          {cards.map((card) => (
            <StatCard
              key={card.key}
              label={card.label}
              accent={card.accent}
              value={
                card.key === 'total_churches'
                  ? dashboard.total_churches.toLocaleString('en-KE')
                  : card.key === 'failed_withdrawals_pending_retry'
                    ? dashboard.failed_withdrawals_pending_retry.toLocaleString('en-KE')
                    : card.key === 'total_volume'
                      ? formatKesCurrency(dashboard.total_volume)
                      : formatKesCurrency(dashboard.total_fees)
              }
              hint={
                card.key === 'failed_withdrawals_pending_retry'
                  ? 'Needs attention'
                  : card.key === 'total_fees'
                    ? 'Platform fees collected'
                    : undefined
              }
            />
          ))}
        </section>
      ) : null}
    </div>
  );
};
