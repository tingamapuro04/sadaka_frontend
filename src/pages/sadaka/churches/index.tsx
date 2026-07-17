import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Churches</h1>
          <p className="page-subtitle">Search across platform balances and volume totals.</p>
        </div>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Search</span>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Church name or username"
            className="w-full rounded border border-slate-300 px-3 py-2 sm:w-80"
          />
        </label>
      </div>

      {churchesQuery.isLoading ? (
        <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading churches...</div>
      ) : null}
      {churchesQuery.isError ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load churches.</div>
      ) : null}

      <section className="card">
        <div className="divide-y divide-slate-100">
          {!churchesQuery.isLoading && churches.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No churches match the current search.</p>
          ) : null}
          {churches.map((church) => (
            <div key={church.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link to={`/sadaka/churches/${church.id}`} className="text-base font-semibold text-slate-950 hover:underline">
                  {church.name}
                </Link>
                <p className="text-sm text-slate-500">
                  @{church.username}
                  {church.suspended ? (
                    <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-800">
                      Suspended
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="grid gap-1 text-sm sm:text-right">
                <p className="font-medium text-slate-900">{formatKesCurrency(church.available_balance)}</p>
                <p className="text-slate-500">Balance</p>
                <p className="font-medium text-slate-900">{formatKesCurrency(church.total_volume)}</p>
                <p className="text-slate-500">Total volume</p>
              </div>
            </div>
          ))}
        </div>
        {total > 0 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            <p>
              Page {page} · {total} total
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};
