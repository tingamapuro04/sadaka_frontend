import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IconCalendar } from '../../../components/icons';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  StatusBadge,
  useToast
} from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { formatDate, formatKesCurrency } from '../../../utils/formatters';
import {
  adminQueryKeys,
  fetchEvent,
  fetchEventTransactions,
  updateEvent
} from '../api';
import type { EventStatus } from '../types';
import { EventFormModal } from './EventFormModal';

export const AdminEventDetailPage = () => {
  const { eventId = '' } = useParams<{ eventId: string }>();
  const { role } = useAuth();
  const isReadonly = role === 'readonly';
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  const eventQuery = useQuery({
    queryKey: adminQueryKeys.event(eventId),
    queryFn: () => fetchEvent(eventId),
    enabled: Boolean(eventId)
  });

  const txQuery = useQuery({
    queryKey: adminQueryKeys.eventTransactions(eventId, page),
    queryFn: () => fetchEventTransactions(eventId, page),
    enabled: Boolean(eventId)
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateEvent>[1]) =>
      updateEvent(eventId, payload),
    onSuccess: () => {
      setEditing(false);
      setFormError(null);
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.event(eventId) });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      toast.success('Event updated');
    },
    onError: (err) => {
      const message = (err as { message?: string }).message ?? 'Unable to save event';
      setFormError(message);
      toast.error(message);
    }
  });

  const statusMutation = useMutation({
    mutationFn: (status: EventStatus) => updateEvent(eventId, { status }),
    onSuccess: (_data, status) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.event(eventId) });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      toast.success(status === 'closed' ? 'Event closed' : 'Event reopened');
      setConfirmClose(false);
    },
    onError: (err) => {
      toast.error((err as { message?: string }).message ?? 'Unable to update status');
    }
  });

  if (eventQuery.isLoading) {
    return (
      <div className="card card-pad text-sm text-ink-muted" role="status">
        Loading event…
      </div>
    );
  }

  if (eventQuery.isError || !eventQuery.data) {
    return (
      <div className="space-y-3">
        <p className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          Unable to load this event.
        </p>
        <Link to="/admin/events" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Back to events
        </Link>
      </div>
    );
  }

  const event = eventQuery.data;
  const raised = event.totals?.paid_gross ?? 0;
  const target = event.target_amount;
  const progress =
    target != null && target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : null;
  const transactions = txQuery.data?.transactions ?? [];
  const totalTx = txQuery.data?.total ?? 0;
  const hasNext = page * 50 < totalTx;

  const copyLink = async () => {
    if (!event.payment_url) return;
    try {
      await navigator.clipboard.writeText(event.payment_url);
      toast.success('Payment link copied');
    } catch {
      window.prompt('Copy payment link:', event.payment_url);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-6">
      <Link
        to="/admin/events"
        className="inline-flex text-sm font-semibold text-brand-700 hover:underline"
      >
        ← Back to events
      </Link>

      <Card>
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{event.title}</h1>
              <StatusBadge label={event.status} />
            </div>
            {event.description ? (
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{event.description}</p>
            ) : null}
            <p className="mt-1.5 text-2xs text-ink-muted sm:text-xs">/{event.slug}</p>
          </div>

          <div className="mobile-actions sm:flex-row sm:flex-wrap">
            <Button variant="secondary" onClick={() => void copyLink()}>
              Copy payment link
            </Button>
            {!isReadonly ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFormError(null);
                    setEditing(true);
                  }}
                >
                  Edit
                </Button>
                {event.status === 'active' ? (
                  <Button
                    variant="secondary"
                    disabled={statusMutation.isPending}
                    onClick={() => setConfirmClose(true)}
                    className="border-amber-300 text-amber-950"
                  >
                    Close event
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate('active')}
                    className="border-brand-200 text-brand-900"
                  >
                    Reopen event
                  </Button>
                )}
              </>
            ) : null}
          </div>
        </div>

        {event.payment_url ? (
          <div className="mt-4 rounded-xl border border-brand-100 bg-gradient-to-br from-white to-brand-50/40 p-3">
            <p className="text-2xs font-semibold uppercase tracking-wider text-brand-700">
              Public payment link
            </p>
            <a
              href={event.payment_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block truncate text-sm font-medium text-brand-700 hover:underline"
              title={event.payment_url}
            >
              {event.payment_url}
            </a>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:grid-cols-3 sm:gap-3">
          <div className="stat-card border-brand-100 bg-gradient-to-br from-white to-brand-50/40">
            <p className="text-[0.65rem] font-medium uppercase tracking-wide text-ink-muted sm:text-xs">
              Raised (paid)
            </p>
            <p className="stat-card-value text-[1.125rem] sm:text-xl">{formatKesCurrency(raised)}</p>
          </div>
          <div className="stat-card border-slate-200/80 bg-white">
            <p className="text-[0.65rem] font-medium uppercase tracking-wide text-ink-muted sm:text-xs">
              Paid gifts
            </p>
            <p className="stat-card-value text-[1.125rem] sm:text-xl">
              {(event.totals?.paid_count ?? 0).toLocaleString('en-KE')}
            </p>
          </div>
          <div className="stat-card col-span-2 border-slate-200/80 bg-white sm:col-span-1">
            <p className="text-[0.65rem] font-medium uppercase tracking-wide text-ink-muted sm:text-xs">
              Awaiting payment
            </p>
            <p className="stat-card-value text-[1.125rem] sm:text-xl">
              {(event.totals?.awaiting_count ?? 0).toLocaleString('en-KE')}
            </p>
          </div>
        </div>

        {target != null && target > 0 ? (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2 text-xs text-ink-muted sm:text-sm">
              <span>Goal progress</span>
              <span className="tabular-nums">
                {formatKesCurrency(raised)} / {formatKesCurrency(target)}
                <span className="text-ink"> ({progress}%)</span>
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-600"
                style={{ width: `${progress ?? 0}%` }}
              />
            </div>
          </div>
        ) : null}
      </Card>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-ink sm:text-base">Event transactions</h2>
            <p className="text-xs text-ink-muted sm:text-sm">
              Payments made through this event&apos;s link.
            </p>
          </div>
          <p className="shrink-0 text-xs tabular-nums text-ink-muted sm:text-sm">
            {totalTx.toLocaleString('en-KE')} total
          </p>
        </div>

        {txQuery.isLoading ? (
          <div className="card card-pad text-sm text-ink-muted" role="status">
            Loading transactions…
          </div>
        ) : null}
        {txQuery.isError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
            Unable to load transactions.
          </p>
        ) : null}
        {!txQuery.isLoading && !txQuery.isError && transactions.length === 0 ? (
          <EmptyState
            icon={<IconCalendar className="h-6 w-6" />}
            title="No transactions yet"
            description="Share the payment link so congregants can contribute to this event."
          />
        ) : null}

        {transactions.length > 0 ? (
          <>
            {/* Mobile list (table stays in DOM for desktop via CSS; only one text instance per field) */}
            <div className="card overflow-hidden md:hidden">
              <ul className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <li key={tx.id} className="flex items-start justify-between gap-3 px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {tx.payer_name || 'Anonymous'}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <StatusBadge
                          label={String(tx.status)}
                          className="!px-2 !py-0 !text-[0.65rem]"
                        />
                        <span className="truncate text-xs text-ink-muted">{tx.payer_phone}</span>
                      </div>
                      <p className="mt-1 truncate text-2xs text-ink-muted">
                        {formatDate(tx.created_at)}
                        {tx.mpesa_ref ? (
                          <>
                            <span className="mx-1 text-slate-300">·</span>
                            <span className="font-mono">{tx.mpesa_ref}</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums text-ink">
                      {formatKesCurrency(tx.gross_amount)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="admin-table-wrap hidden md:block">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Payer</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>M-Pesa</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="text-ink-muted">{formatDate(tx.created_at)}</td>
                      <td className="font-medium text-ink">{tx.payer_name || '—'}</td>
                      <td className="font-mono text-xs text-ink-muted">{tx.payer_phone}</td>
                      <td>
                        <StatusBadge label={String(tx.status)} />
                      </td>
                      <td className="font-mono text-xs text-ink-muted">{tx.mpesa_ref || '—'}</td>
                      <td className="text-right font-semibold tabular-nums text-ink">
                        {formatKesCurrency(tx.gross_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {totalTx > 50 ? (
          <div className="card flex items-center gap-2 px-3 py-2.5 sm:justify-between sm:px-4 sm:py-3">
            <Button
              variant="secondary"
              size="sm"
              className="min-w-[5.5rem]"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="flex-1 text-center text-xs text-ink-muted sm:text-sm">
              Page {page}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="min-w-[5.5rem]"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </section>

      {editing && !isReadonly ? (
        <EventFormModal
          event={event}
          isSaving={saveMutation.isPending}
          error={formError}
          onClose={() => {
            setEditing(false);
            setFormError(null);
          }}
          onSave={(payload) => saveMutation.mutate(payload)}
        />
      ) : null}

      {confirmClose ? (
        <ConfirmDialog
          title="Close this event?"
          message={`“${event.title}” will stop accepting new payments. Existing contributions stay recorded.`}
          confirmLabel="Close event"
          isConfirming={statusMutation.isPending}
          onCancel={() => setConfirmClose(false)}
          onConfirm={() => statusMutation.mutate('closed')}
        />
      ) : null}
    </div>
  );
};
