import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button, EmptyState, PageHeader, StatusBadge } from '../../../components/ui';
import { IconBuilding } from '../../../components/icons';
import { formatKesCurrency } from '../../../utils/formatters';
import { fetchSadakaChurches, sadakaQueryKeys } from '../api';

export const SadakaChurchesPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 8;

  const params = { page, limit, q: search.trim() || undefined };
  const churchesQuery = useQuery({
    queryKey: sadakaQueryKeys.churches(params),
    queryFn: () => fetchSadakaChurches(params),
    placeholderData: (prev) => prev
  });

  const pageData = churchesQuery.data;
  const churches = pageData?.churches ?? [];
  const total = pageData?.total ?? 0;
  const hasNextPage = Boolean(pageData?.has_more);

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-5">
      <PageHeader
        title="Churches"
        description="Search balances and volume across the platform."
      />

      <label className="block text-sm">
        <span className="mb-1 block field-label">Search</span>
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Church name or username"
          className="field-control sm:max-w-md"
          autoCapitalize="off"
          autoCorrect="off"
        />
      </label>

      {churchesQuery.isLoading ? (
        <div className="card card-pad text-sm text-ink-muted" role="status">
          Loading churches…
        </div>
      ) : null}
      {churchesQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 sm:p-4" role="alert">
          Unable to load churches.
        </div>
      ) : null}

      <section className="card overflow-hidden">
        {!churchesQuery.isLoading && !churchesQuery.isError && churches.length === 0 ? (
          <div className="p-3.5 sm:p-4">
            <EmptyState
              icon={<IconBuilding className="h-6 w-6" />}
              title="No churches match"
              description={
                search.trim()
                  ? 'Try a different name or username.'
                  : 'Churches will appear here after registration.'
              }
            />
          </div>
        ) : null}

        <ul className="divide-y divide-slate-100">
          {churches.map((church) => (
            <li key={church.id}>
              <Link
                to={`/sadaka/churches/${church.id}`}
                className="flex items-start justify-between gap-3 px-3.5 py-3.5 active:bg-slate-50 sm:px-5 sm:py-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink sm:text-base">{church.name}</p>
                    {church.suspended ? (
                      <StatusBadge label="suspended" className="!px-2 !py-0 !text-[0.65rem]" />
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">@{church.username}</p>
                  <p className="mt-1.5 text-2xs text-ink-muted sm:hidden">
                    Vol {formatKesCurrency(church.total_volume)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums text-ink">
                    {formatKesCurrency(church.available_balance)}
                  </p>
                  <p className="mt-0.5 text-2xs text-ink-muted">Balance</p>
                  <p className="mt-1.5 hidden text-xs font-medium tabular-nums text-ink sm:block">
                    {formatKesCurrency(church.total_volume)}
                  </p>
                  <p className="hidden text-2xs text-ink-muted sm:block">Volume</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {total > 0 ? (
          <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-2.5 sm:justify-between sm:px-4 sm:py-3">
            <Button
              variant="secondary"
              size="sm"
              className="min-w-[5.5rem]"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="flex-1 text-center text-xs text-ink-muted sm:text-sm">
              Page {page}
              <span className="mx-1 text-slate-300">·</span>
              {total.toLocaleString('en-KE')} total
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="min-w-[5.5rem]"
              disabled={!hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
};
