import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Button, PageHeader } from '../../../components/ui';
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

  const page = transactionsQuery.data?.page ?? filters.page;
  const total = transactionsQuery.data?.total ?? 0;
  const canGoNext = sortedTransactions.length > 0 && !transactionsQuery.isFetching;
  const canGoPrev = filters.page > 1 && !transactionsQuery.isFetching;

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-5">
      <PageHeader
        title="Transactions"
        description="Filter, inspect, and export church payments."
        actions={
          <div className="hidden sm:block">
            <ExportButton filters={debouncedFilters} />
          </div>
        }
      />

      {/* Mobile export — full-width, under title strip */}
      <div className="sm:hidden">
        <ExportButton filters={debouncedFilters} fullWidth />
      </div>

      <TransactionFilters
        categories={categories}
        filters={filters}
        onChange={setFilters}
        resultCount={transactionsQuery.data?.total}
      />

      {transactionsQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 sm:p-4" role="alert">
          Unable to load transactions. Check your filters and try again.
        </div>
      ) : null}

      {transactionsQuery.isLoading ? (
        <div className="card card-pad text-sm text-ink-muted" role="status">
          Loading transactions…
        </div>
      ) : (
        <>
          <TransactionTable transactions={sortedTransactions} filters={filters} onSort={sortBy} />

          <div className="card flex items-center gap-2 px-3 py-2.5 sm:justify-between sm:px-4 sm:py-3">
            <Button
              variant="secondary"
              size="sm"
              className="min-w-[5.5rem]"
              disabled={!canGoPrev}
              onClick={() => setFilters((current) => ({ ...current, page: Math.max(current.page - 1, 1) }))}
            >
              Previous
            </Button>
            <div className="min-w-0 flex-1 text-center text-xs text-ink-muted sm:text-sm">
              <span className="font-medium text-ink">Page {page}</span>
              <span className="mx-1 text-slate-300">·</span>
              <span className="tabular-nums">{total.toLocaleString('en-KE')} total</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="min-w-[5.5rem]"
              disabled={!canGoNext}
              onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
