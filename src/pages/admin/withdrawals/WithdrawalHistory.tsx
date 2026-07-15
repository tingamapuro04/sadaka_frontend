import { formatDate, formatKesCurrency } from '../../../utils/formatters';
import type { Withdrawal } from '../types';

type WithdrawalHistoryProps = {
  withdrawals: Withdrawal[];
  isLoading: boolean;
  isError: boolean;
  page: number;
  hasNextPage: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onCancel?: (withdrawalId: string) => void;
  cancellingId?: string | null;
  showDevActions?: boolean;
};

const cancellableStatuses = new Set<Withdrawal['status']>(['pending', 'processing']);

export const WithdrawalHistory = ({
  withdrawals,
  isLoading,
  isError,
  page,
  hasNextPage,
  onPrevPage,
  onNextPage,
  onCancel,
  cancellingId,
  showDevActions = false
}: WithdrawalHistoryProps) => {
  return (
    <section className="rounded border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-950">Withdrawal history</h2>
      </div>

      {isLoading ? <p className="p-4 text-sm text-slate-600">Loading withdrawals...</p> : null}
      {isError ? <p className="p-4 text-sm text-red-700">Unable to load withdrawal history.</p> : null}

      {!isLoading && !isError && withdrawals.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">No withdrawals yet.</p>
      ) : null}

      <div className="divide-y divide-slate-100">
        {withdrawals.map((withdrawal) => (
          <div key={withdrawal.id} className="grid gap-2 p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="font-medium text-slate-900">
                {formatKesCurrency(withdrawal.amount)} · <span className="capitalize">{withdrawal.status}</span>
              </p>
              <p className="text-slate-500">
                {withdrawal.method} · {withdrawal.withdrawal_number}
              </p>
              <p className="text-slate-500">
                Scheduled {formatDate(withdrawal.scheduled_for)} · Created {formatDate(withdrawal.initiated_at)}
              </p>
              {withdrawal.notes ? <p className="mt-1 text-slate-600">{withdrawal.notes}</p> : null}
            </div>
            <div className="flex flex-col gap-2 text-left sm:items-end sm:text-right">
              <p className="font-semibold text-slate-950">{withdrawal.id.slice(0, 8)}</p>
              {withdrawal.completed_at ? (
                <p className="text-slate-500">Completed {formatDate(withdrawal.completed_at)}</p>
              ) : null}
              {showDevActions && onCancel && cancellableStatuses.has(withdrawal.status) ? (
                <button
                  type="button"
                  onClick={() => onCancel(withdrawal.id)}
                  disabled={cancellingId === withdrawal.id}
                  className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancellingId === withdrawal.id ? 'Cancelling...' : 'Cancel (dev)'}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
        <button
          type="button"
          onClick={onPrevPage}
          disabled={page <= 1 || isLoading}
          className="rounded border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-slate-600">Page {page}</span>
        <button
          type="button"
          onClick={onNextPage}
          disabled={!hasNextPage || isLoading}
          className="rounded border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </section>
  );
};
