import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Button,
  EmptyState,
  PageHeader,
  Select,
  StatusBadge,
  useToast
} from '../../../components/ui';
import { IconCard } from '../../../components/icons';
import { formatDate, formatKesCurrency } from '../../../utils/formatters';
import {
  downloadSadakaTransactionsCsv,
  fetchSadakaChurches,
  fetchSadakaTransactions,
  sadakaQueryKeys
} from '../api';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'awaiting_payment', label: 'Awaiting' },
  { value: 'failed', label: 'Failed' }
] as const;

export const SadakaTransactionsPage = () => {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [churchId, setChurchId] = useState(searchParams.get('church_id') || '');
  const [source, setSource] = useState(searchParams.get('source') || '');
  const [phone, setPhone] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const limit = 25;

  const params = {
    page,
    limit,
    status: status || undefined,
    church_id: churchId || undefined,
    source: source || undefined,
    phone: phone.trim() || undefined,
    from: from || undefined,
    to: to || undefined
  };

  const txQuery = useQuery({
    queryKey: sadakaQueryKeys.transactions(params),
    queryFn: () => fetchSadakaTransactions(params),
    placeholderData: (prev) => prev
  });
  const churchesQuery = useQuery({
    queryKey: sadakaQueryKeys.churches({ page: 1, limit: 100 }),
    queryFn: () => fetchSadakaChurches({ page: 1, limit: 100 })
  });

  const rows = txQuery.data?.transactions ?? [];
  const total = txQuery.data?.total ?? 0;
  const hasNext = Boolean(txQuery.data?.has_more);

  const advancedActiveCount = [churchId, source, phone.trim(), from, to].filter(Boolean).length;
  const hasFilters = Boolean(status || advancedActiveCount);

  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setStatus('');
    setChurchId('');
    setSource('');
    setPhone('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const blob = await downloadSadakaTransactionsCsv({
        status: status || undefined,
        church_id: churchId || undefined,
        source: source || undefined,
        phone: phone.trim() || undefined,
        from: from || undefined,
        to: to || undefined
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'platform-transactions.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch (err) {
      toast.error((err as { message?: string }).message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-5">
      <PageHeader
        title="Transactions"
        description="All churches · filters · CSV export"
        actions={
          <Button
            fullWidth
            className="sm:!w-auto"
            onClick={() => void onExport()}
            loading={exporting}
            disabled={exporting}
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        }
      />

      <div>
        <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-muted">Status</p>
        <div className="mobile-chip-row" role="group" aria-label="Filter by status">
          {STATUS_OPTIONS.map((option) => {
            const active = status === option.value;
            return (
              <button
                key={option.value || 'all'}
                type="button"
                onClick={() => {
                  setStatus(option.value);
                  resetPage();
                }}
                className={`inline-flex shrink-0 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-brand-600 bg-brand-600 text-white shadow-soft'
                    : 'border-slate-200 bg-white text-slate-700 shadow-soft active:bg-slate-50'
                }`}
                aria-pressed={active}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5 sm:hidden">
          <button
            type="button"
            className="flex min-h-10 flex-1 items-center justify-between gap-2 text-left text-sm font-semibold text-ink"
            onClick={() => setAdvancedOpen((open) => !open)}
            aria-expanded={advancedOpen}
          >
            <span>
              More filters
              {advancedActiveCount > 0 ? (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-100 px-1.5 text-2xs font-bold text-brand-800">
                  {advancedActiveCount}
                </span>
              ) : null}
            </span>
            <span className="text-ink-muted" aria-hidden>
              {advancedOpen ? '−' : '+'}
            </span>
          </button>
        </div>

        <div
          className={`grid gap-3 p-3.5 sm:grid-cols-2 sm:p-4 xl:grid-cols-5 ${
            advancedOpen ? 'grid' : 'hidden'
          } sm:grid`}
        >
          <Select
            label="Church"
            value={churchId}
            onChange={(e) => {
              setChurchId(e.target.value);
              resetPage();
            }}
          >
            <option value="">All</option>
            {(churchesQuery.data?.churches ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="Source"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              resetPage();
            }}
          >
            <option value="">All</option>
            <option value="offering">Offering</option>
            <option value="event">Event</option>
          </Select>
          <label className="text-sm">
            <span className="mb-1 block field-label">Phone</span>
            <input
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                resetPage();
              }}
              className="field-control"
              placeholder="07…"
              inputMode="tel"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block field-label">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                resetPage();
              }}
              className="field-control"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block field-label">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                resetPage();
              }}
              className="field-control"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-muted">
          {txQuery.isLoading ? (
            'Loading…'
          ) : (
            <>
              <span className="font-semibold text-ink">{total.toLocaleString('en-KE')}</span> result
              {total === 1 ? '' : 's'}
              {page > 1 ? ` · page ${page}` : ''}
            </>
          )}
        </p>
        {hasFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>

      {txQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 sm:p-4" role="alert">
          Unable to load transactions.
        </div>
      ) : null}

      {txQuery.isLoading && rows.length === 0 ? (
        <div className="card card-pad text-sm text-ink-muted" role="status">
          Loading transactions…
        </div>
      ) : null}

      {!txQuery.isLoading && rows.length === 0 ? (
        <EmptyState
          icon={<IconCard className="h-6 w-6" />}
          title="No transactions match"
          description={
            hasFilters ? 'Try clearing filters or widening the date range.' : 'Payments will appear here.'
          }
          actionLabel={hasFilters ? 'Clear filters' : undefined}
          onAction={hasFilters ? clearFilters : undefined}
        />
      ) : null}

      {rows.length > 0 ? (
        <>
          <div className="card overflow-hidden md:hidden">
            <ul className="divide-y divide-slate-100">
              {rows.map((tx) => (
                <li key={tx.id} className="px-3.5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/sadaka/churches/${tx.church_id}`}
                        className="truncate text-sm font-semibold text-ink hover:underline"
                      >
                        {tx.church_name || tx.church_id}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <StatusBadge
                          label={String(tx.status)}
                          className="!px-2 !py-0 !text-[0.65rem]"
                        />
                        <span className="truncate text-xs capitalize text-ink-muted">{tx.source}</span>
                      </div>
                      <p className="mt-1 truncate text-2xs text-ink-muted">
                        {tx.payer_phone}
                        <span className="mx-1 text-slate-300">·</span>
                        {formatDate(tx.created_at)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums text-ink">
                        {formatKesCurrency(tx.total_amount)}
                      </p>
                      <p className="mt-0.5 text-2xs text-ink-muted">
                        Fee {formatKesCurrency(tx.fee)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="admin-table-wrap hidden md:block">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Church</th>
                  <th>Phone</th>
                  <th>Amount</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <Link
                        to={`/sadaka/churches/${tx.church_id}`}
                        className="font-medium text-ink hover:underline"
                      >
                        {tx.church_name || tx.church_id}
                      </Link>
                    </td>
                    <td className="text-ink-muted">{tx.payer_phone}</td>
                    <td className="font-semibold tabular-nums text-ink">
                      {formatKesCurrency(tx.total_amount)}
                    </td>
                    <td className="text-ink-muted">{formatKesCurrency(tx.fee)}</td>
                    <td>
                      <StatusBadge label={String(tx.status)} />
                    </td>
                    <td className="capitalize text-ink-muted">{tx.source}</td>
                    <td className="text-ink-muted">{formatDate(tx.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card flex items-center gap-2 px-3 py-2.5 sm:justify-between sm:px-4 sm:py-3">
            <Button
              variant="secondary"
              size="sm"
              className="min-w-[5.5rem]"
              disabled={page <= 1 || txQuery.isFetching}
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
              disabled={!hasNext || txQuery.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
};
