import { useMemo, useState } from 'react';
import { IconCard } from '../../../../components/icons';
import { Button, EmptyState, StatusBadge } from '../../../../components/ui';
import { formatDate, formatKesCurrency } from '../../../../utils/formatters';
import type { AdminTransaction, TransactionFiltersState } from '../../types';

interface TransactionTableProps {
  transactions: AdminTransaction[];
  filters: TransactionFiltersState;
  onSort: (sort: keyof AdminTransaction) => void;
}

const PAGE_WINDOW = 40;

export const TransactionTable = ({ transactions, filters, onSort }: TransactionTableProps) => {
  const [selected, setSelected] = useState<AdminTransaction | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const rowHeight = 56;
  const startIndex = Math.max(Math.floor(scrollTop / rowHeight) - 4, 0);

  const visibleTransactions = useMemo(
    () => transactions.slice(startIndex, startIndex + PAGE_WINDOW),
    [startIndex, transactions]
  );

  const sortLabel = (key: keyof AdminTransaction) => {
    if (filters.sort !== key) return '';
    return filters.direction === 'asc' ? ' ↑' : ' ↓';
  };

  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions match"
        description="Try clearing filters or widening the date range."
        icon={<IconCard className="h-6 w-6" />}
      />
    );
  }

  return (
    <>
      {/* Mobile: single list card, tappable rows (no per-card full-width buttons) */}
      <div className="card overflow-hidden md:hidden" aria-label="Transactions">
        <ul className="divide-y divide-slate-100">
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              <button
                type="button"
                onClick={() => setSelected(transaction)}
                className="flex w-full items-start gap-3 px-3.5 py-3 text-left active:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink">
                      {transaction.payer_name || 'Anonymous'}
                    </p>
                    <p className="shrink-0 text-sm font-bold tabular-nums text-ink">
                      {formatKesCurrency(transaction.gross_amount)}
                    </p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <StatusBadge
                      label={String(transaction.status)}
                      className="!px-2 !py-0 !text-[0.65rem]"
                    />
                    <span className="truncate text-xs text-ink-muted">{transaction.payer_phone}</span>
                  </div>
                  <p className="mt-1 truncate text-2xs text-ink-muted">
                    {formatDate(transaction.created_at)}
                    {transaction.mpesa_ref ? (
                      <>
                        <span className="mx-1 text-slate-300">·</span>
                        <span className="font-mono">{transaction.mpesa_ref}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                <span className="mt-1 shrink-0 text-slate-300" aria-hidden>
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Desktop table */}
      <div
        className="admin-table-wrap hidden md:block"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        <table className="admin-table">
          <thead className="sticky top-0 z-[1] bg-slate-50/95 backdrop-blur-sm">
            <tr>
              {(
                [
                  ['created_at', 'Date'],
                  ['payer_phone', 'Payer'],
                  ['mpesa_ref', 'M-PESA'],
                  ['status', 'Status'],
                  // Church receives gross_amount; total_amount includes platform fee.
                  ['gross_amount', 'Amount']
                ] as const
              ).map(([key, label]) => (
                <th key={key}>
                  <button
                    type="button"
                    onClick={() => onSort(key)}
                    className="font-semibold text-ink-muted hover:text-ink"
                  >
                    {label}
                    {sortLabel(key)}
                  </button>
                </th>
              ))}
              <th>Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.length > PAGE_WINDOW && startIndex > 0 ? (
              <tr style={{ height: startIndex * rowHeight }}>
                <td colSpan={6} />
              </tr>
            ) : null}
            {visibleTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="text-ink-muted">{formatDate(transaction.created_at)}</td>
                <td>
                  <p className="font-medium text-ink">{transaction.payer_name || 'Anonymous'}</p>
                  <p className="text-ink-muted">{transaction.payer_phone}</p>
                </td>
                <td className="font-mono text-xs text-ink-muted">{transaction.mpesa_ref || '—'}</td>
                <td>
                  <StatusBadge label={String(transaction.status)} />
                </td>
                <td className="font-semibold tabular-nums text-ink">
                  {formatKesCurrency(transaction.gross_amount)}
                </td>
                <td>
                  <Button variant="secondary" size="sm" onClick={() => setSelected(transaction)}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
            {transactions.length > PAGE_WINDOW &&
            startIndex + PAGE_WINDOW < transactions.length ? (
              <tr
                style={{
                  height: Math.max(transactions.length - startIndex - PAGE_WINDOW, 0) * rowHeight
                }}
              >
                <td colSpan={6} />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tx-detail-title"
            className="max-h-[min(92vh,40rem)] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-overlay safe-pb sm:rounded-xl"
          >
            <div className="sticky top-0 z-[1] flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-4 py-3.5 backdrop-blur-sm sm:px-5 sm:py-4">
              <div className="min-w-0">
                <p className="text-2xs font-semibold uppercase tracking-wider text-brand-700">
                  Transaction
                </p>
                <h2 id="tx-detail-title" className="mt-0.5 text-lg font-semibold text-ink">
                  {formatKesCurrency(selected.gross_amount)}
                </h2>
                <div className="mt-1.5">
                  <StatusBadge label={String(selected.status)} />
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>

            <dl className="grid gap-0 px-4 py-1 text-sm sm:grid-cols-2 sm:gap-3 sm:px-5 sm:py-4">
              {(
                [
                  ['Payer', selected.payer_name || 'Anonymous'],
                  ['Phone', selected.payer_phone],
                  // Only the church share — platform fee is not shown in church console.
                  ['Amount', formatKesCurrency(selected.gross_amount)],
                  ['M-PESA ref', selected.mpesa_ref || '—'],
                  ['Created', formatDate(selected.created_at)],
                  ['ID', selected.id]
                ] as const
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-3 border-b border-slate-50 py-3 sm:block sm:border-0 sm:py-0"
                >
                  <dt className="shrink-0 text-ink-muted">{label}</dt>
                  <dd
                    className={`min-w-0 text-right font-medium text-ink sm:mt-0.5 sm:text-left ${
                      label === 'ID' || label === 'M-PESA ref' ? 'truncate font-mono text-xs' : ''
                    }`}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}
    </>
  );
};
