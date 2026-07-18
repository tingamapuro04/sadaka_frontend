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
      <div className="border-b border-slate-100 px-3.5 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-ink sm:text-base">Withdrawal history</h2>
        <p className="mt-0.5 text-xs text-ink-muted">Status updates for requested payouts.</p>
      </div>

      {isLoading ? (
        <p className="p-3.5 text-sm text-ink-muted sm:p-4" role="status">
          Loading withdrawals…
        </p>
      ) : null}
      {isError ? (
        <p className="p-3.5 text-sm text-red-700 sm:p-4" role="alert">
          Unable to load withdrawal history.
        </p>
      ) : null}

      {!isLoading && !isError && withdrawals.length === 0 ? (
        <div className="p-3.5 sm:p-4">
          <EmptyState
            title="No withdrawals yet"
            description="When you request a payout, it will appear here with status updates."
            icon={<IconWallet className="h-6 w-6" />}
          />
        </div>
      ) : null}

      <ul className="divide-y divide-slate-100">
        {withdrawals.map((withdrawal) => (
          <li key={withdrawal.id} className="px-3.5 py-3.5 sm:px-5 sm:py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-bold tabular-nums text-ink">
                    {formatKesCurrency(withdrawal.amount)}
                  </p>
                  <StatusBadge
                    label={withdrawal.status}
                    className="!px-2 !py-0 !text-[0.65rem] sm:!px-2.5 sm:!py-0.5 sm:!text-xs"
                  />
                </div>
                <p className="mt-1 truncate text-xs capitalize text-ink-muted sm:text-sm">
                  {withdrawal.method} · {withdrawal.withdrawal_number}
                </p>
              </div>
              <p className="shrink-0 font-mono text-2xs text-ink-muted sm:text-xs">
                {withdrawal.id.slice(0, 8)}
              </p>
            </div>

            <p className="mt-2 text-2xs leading-relaxed text-ink-muted sm:text-xs">
              Scheduled {formatDate(withdrawal.scheduled_for)}
              <span className="mx-1 text-slate-300">·</span>
              Created {formatDate(withdrawal.initiated_at)}
              {withdrawal.completed_at ? (
                <>
                  <span className="mx-1 text-slate-300">·</span>
                  Done {formatDate(withdrawal.completed_at)}
                </>
              ) : null}
            </p>

            {withdrawal.notes ? (
              <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">{withdrawal.notes}</p>
            ) : null}

            {showDevActions && onCancel && cancellableStatuses.has(withdrawal.status) ? (
              <div className="mt-2.5">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onCancel(withdrawal.id)}
                  disabled={cancellingId === withdrawal.id}
                  loading={cancellingId === withdrawal.id}
                  className="w-full sm:w-auto"
                >
                  Cancel (dev)
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {withdrawals.length > 0 || page > 1 ? (
        <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-2.5 sm:justify-between sm:px-4 sm:py-3">
          <Button
            variant="secondary"
            size="sm"
            className="min-w-[5.5rem]"
            onClick={onPrevPage}
            disabled={page <= 1 || isLoading}
          >
            Previous
          </Button>
          <span className="flex-1 text-center text-xs text-ink-muted sm:text-sm">Page {page}</span>
          <Button
            variant="secondary"
            size="sm"
            className="min-w-[5.5rem]"
            onClick={onNextPage}
            disabled={!hasNextPage || isLoading}
          >
            Next
          </Button>
        </div>
      ) : null}
    </section>
  );
};
