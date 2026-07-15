import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { adminQueryKeys, fetchCategories, fetchTransactions } from '../api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { AdminListItem, AdminTransaction, TransactionFiltersState } from '../types';
import { ExportButton } from './components/ExportButton';
import { TransactionFilters } from './components/TransactionFilters';
import { TransactionTable } from './components/TransactionTable';

const toCategoryList = (value: unknown): AdminListItem[] => {
  if (Array.isArray(value)) {
    return value as AdminListItem[];
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.categories)) {
      return record.categories as AdminListItem[];
    }
    if (record.data && typeof record.data === 'object' && Array.isArray((record.data as Record<string, unknown>).categories)) {
      return (record.data as Record<string, unknown>).categories as AdminListItem[];
    }
  }

  return [];
};

const initialFilters: TransactionFiltersState = {
  page: 1,
  status: '',
  phone: '',
  mpesa_ref: '',
  from: '',
  to: '',
  category_id: '',
  sort: 'created_at',
  direction: 'desc'
};

export const AdminTransactionsPage = () => {
  const [filters, setFilters] = useState(initialFilters);
  const debouncedFilters = useDebouncedValue(filters);
  const categoriesQuery = useQuery({ queryKey: adminQueryKeys.categories, queryFn: fetchCategories });
  const transactionsQuery = useQuery({
    queryKey: adminQueryKeys.transactions(debouncedFilters),
    queryFn: () => fetchTransactions(debouncedFilters)
  });
  const categories = toCategoryList(categoriesQuery.data);

  const sortedTransactions = useMemo(() => {
    const rows = transactionsQuery.data?.transactions ?? [];
    return [...rows].sort((a, b) => {
      const left = a[filters.sort];
      const right = b[filters.sort];
      const result = String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true });
      return filters.direction === 'asc' ? result : -result;
    });
  }, [filters.direction, filters.sort, transactionsQuery.data]);

  const sortBy = (sort: keyof AdminTransaction) => {
    setFilters((current) => ({
      ...current,
      sort,
      direction: current.sort === sort && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Transactions</h1>
          <p className="mt-1 text-sm text-slate-600">Filter, inspect, sort, and export church payments.</p>
        </div>
        <ExportButton filters={debouncedFilters} />
      </div>

      <TransactionFilters
        categories={categories}
        filters={filters}
        onChange={setFilters}
        resultCount={transactionsQuery.data?.total}
      />

      {transactionsQuery.isError ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          Unable to load transactions. Check your filters and try again.
        </div>
      ) : null}

      {transactionsQuery.isLoading ? (
        <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600" role="status">
          Loading transactions…
        </div>
      ) : (
        <>
          <TransactionTable transactions={sortedTransactions} filters={filters} onSort={sortBy} />
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <button
              type="button"
              disabled={filters.page <= 1 || transactionsQuery.isFetching}
              onClick={() => setFilters((current) => ({ ...current, page: Math.max(current.page - 1, 1) }))}
              className="min-h-[40px] rounded-lg border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-slate-600">
              Page {transactionsQuery.data?.page ?? filters.page} · {transactionsQuery.data?.total ?? 0} records
            </span>
            <button
              type="button"
              disabled={sortedTransactions.length === 0 || transactionsQuery.isFetching}
              onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
              className="rounded border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};
