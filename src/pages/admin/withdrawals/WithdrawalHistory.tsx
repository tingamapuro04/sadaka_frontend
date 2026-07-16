import { Button, EmptyState, StatusBadge } from '../../../components/ui';
import { IconWallet } from '../../../components/icons';
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
    <section className="card overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <h2 className="text-base font-semibold text-ink">Withdrawal history</h2>
      </div>

      {isLoading ? <p className="p-4 text-sm text-ink-muted">Loading withdrawals...</p> : null}
      {isError ? <p className="p-4 text-sm text-red-700">Unable to load withdrawal history.</p> : null}

      {!isLoading && !isError && withdrawals.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title="No withdrawals yet"
            description="When you request a payout, it will appear here with status updates."
            icon={<IconWallet className="h-6 w-6" />}
          />
        </div>
      ) : null}

      <div className="divide-y divide-slate-100">
        {withdrawals.map((withdrawal) => (
          <div key={withdrawal.id} className="grid gap-2 p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold tabular-nums text-ink">
                  {formatKesCurrency(withdrawal.amount)}
                </p>
                <StatusBadge label={withdrawal.status} />
              </div>
              <p className="mt-1 capitalize text-ink-muted">
                {withdrawal.method} · {withdrawal.withdrawal_number}
              </p>
              <p className="text-ink-muted">
                Scheduled {formatDate(withdrawal.scheduled_for)} · Created {formatDate(withdrawal.initiated_at)}
              </p>
              {withdrawal.notes ? <p className="mt-1 text-slate-600">{withdrawal.notes}</p> : null}
            </div>
            <div className="flex flex-col gap-2 text-left sm:items-end sm:text-right">
              <p className="font-mono text-xs text-ink-muted">{withdrawal.id.slice(0, 8)}</p>
              {withdrawal.completed_at ? (
                <p className="text-ink-muted">Completed {formatDate(withdrawal.completed_at)}</p>
              ) : null}
              {showDevActions && onCancel && cancellableStatuses.has(withdrawal.status) ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onCancel(withdrawal.id)}
                  disabled={cancellingId === withdrawal.id}
                  loading={cancellingId === withdrawal.id}
                >
                  Cancel (dev)
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {withdrawals.length > 0 || page > 1 ? (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm sm:px-5">
          <Button variant="secondary" size="sm" onClick={onPrevPage} disabled={page <= 1 || isLoading}>
            Previous
          </Button>
          <span className="text-ink-muted">Page {page}</span>
          <Button variant="secondary" size="sm" onClick={onNextPage} disabled={!hasNextPage || isLoading}>
            Next
          </Button>
        </div>
      ) : null}
    </section>
  );
};
