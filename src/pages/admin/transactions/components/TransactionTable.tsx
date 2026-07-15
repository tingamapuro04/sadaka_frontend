import { useMemo, useState } from 'react';
import { EmptyState, StatusBadge } from '../../../../components/ui';
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
        icon="💳"
      />
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden" aria-label="Transactions">
        {transactions.map((transaction) => (
          <li
            key={transaction.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {transaction.payer_name || 'Anonymous'}
                </p>
                <p className="text-xs text-slate-500">{transaction.payer_phone}</p>
              </div>
              <StatusBadge label={String(transaction.status)} />
            </div>
            <div className="mt-3 flex items-end justify-between gap-2">
              <div className="text-xs text-slate-500">
                <p>{formatDate(transaction.created_at)}</p>
                <p className="font-mono">{transaction.mpesa_ref || 'No M-Pesa ref'}</p>
              </div>
              <p className="text-lg font-semibold text-slate-950">
                {formatKesCurrency(transaction.total_amount)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(transaction)}
              className="mt-3 min-h-[40px] w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View details
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div
        className="admin-table-wrap hidden md:block"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        <table className="admin-table">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              {(
                [
                  ['created_at', 'Date'],
                  ['payer_phone', 'Payer'],
                  ['mpesa_ref', 'M-PESA'],
                  ['status', 'Status'],
                  ['total_amount', 'Total']
                ] as const
              ).map(([key, label]) => (
                <th key={key}>
                  <button
                    type="button"
                    onClick={() => onSort(key)}
                    className="font-semibold text-slate-600 hover:text-slate-900"
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
              <tr key={transaction.id} className="hover:bg-slate-50">
                <td className="text-slate-600">{formatDate(transaction.created_at)}</td>
                <td>
                  <p className="font-medium text-slate-900">
                    {transaction.payer_name || 'Anonymous'}
                  </p>
                  <p className="text-slate-500">{transaction.payer_phone}</p>
                </td>
                <td className="text-slate-600">{transaction.mpesa_ref || '—'}</td>
                <td>
                  <StatusBadge label={String(transaction.status)} />
                </td>
                <td className="font-semibold text-slate-950">
                  {formatKesCurrency(transaction.total_amount)}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => setSelected(transaction)}
                    className="min-h-[36px] rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100"
                  >
                    View
                  </button>
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
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="tx-detail-title" className="text-lg font-semibold text-slate-950">
                  Transaction details
                </h2>
                <p className="font-mono text-xs text-slate-500">{selected.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="min-h-[36px] rounded-lg border px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Payer</dt>
                <dd className="font-medium">{selected.payer_name || 'Anonymous'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium">{selected.payer_phone}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Gross</dt>
                <dd className="font-medium">{formatKesCurrency(selected.gross_amount)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Fee</dt>
                <dd className="font-medium">{formatKesCurrency(selected.fee)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Total</dt>
                <dd className="font-medium">{formatKesCurrency(selected.total_amount)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd className="font-medium">
                  <StatusBadge label={String(selected.status)} />
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">M-PESA ref</dt>
                <dd className="font-medium">{selected.mpesa_ref || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Created</dt>
                <dd className="font-medium">{formatDate(selected.created_at)}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </>
  );
};
