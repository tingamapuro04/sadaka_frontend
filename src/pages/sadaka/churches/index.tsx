import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatKesCurrency } from '../../../utils/formatters';
import { fetchSadakaChurches, sadakaQueryKeys } from '../api';

const PAGE_SIZE = 8;

export const SadakaChurchesPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const churchesQuery = useQuery({
    queryKey: sadakaQueryKeys.churches,
    queryFn: fetchSadakaChurches
  });

  const filteredChurches = useMemo(() => {
    const rows = churchesQuery.data ?? [];
    const term = search.trim().toLowerCase();
    return rows.filter((church) => {
      if (!term) return true;
      return church.name.toLowerCase().includes(term) || church.username.toLowerCase().includes(term);
    });
  }, [churchesQuery.data, search]);

  const pagedChurches = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredChurches.slice(start, start + PAGE_SIZE);
  }, [filteredChurches, page]);

  const hasNextPage = page * PAGE_SIZE < filteredChurches.length;

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

      {churchesQuery.isLoading ? <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading churches...</div> : null}
      {churchesQuery.isError ? <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load churches.</div> : null}

      <section className="card">
        <div className="divide-y divide-slate-100">
          {!churchesQuery.isLoading && pagedChurches.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No churches match the current search.</p>
          ) : null}
          {pagedChurches.map((church) => (
            <div key={church.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link to={`/sadaka/churches/${church.id}`} className="text-base font-semibold text-slate-950 hover:underline">
                  {church.name}
                </Link>
                <p className="text-sm text-slate-500">@{church.username}</p>
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

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || churchesQuery.isLoading}
            className="rounded border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-slate-600">Page {page}</span>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!hasNextPage || churchesQuery.isLoading}
            className="rounded border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
};
