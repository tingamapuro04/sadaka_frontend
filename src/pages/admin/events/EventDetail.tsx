import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
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
    return <p className="text-sm text-slate-600">Loading event…</p>;
  }

  if (eventQuery.isError || !eventQuery.data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-700">Unable to load this event.</p>
        <Link to="/admin/events" className="text-sm font-medium text-emerald-700 hover:underline">
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
    <div className="space-y-6">
      <div>
        <Link to="/admin/events" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Back to events
        </Link>
      </div>

      <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-950">{event.title}</h1>
              <StatusBadge label={event.status} />
            </div>
            {event.description ? (
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{event.description}</p>
            ) : null}
            <p className="mt-2 text-xs text-slate-500">Slug: {event.slug}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => void copyLink()}>
              Copy payment link
            </Button>
            {!isReadonly ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
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
                    size="sm"
                    disabled={statusMutation.isPending}
                    onClick={() => setConfirmClose(true)}
                    className="border-amber-300 text-amber-950"
                  >
                    Close event
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate('active')}
                    className="border-emerald-300 text-emerald-950"
                  >
                    Reopen event
                  </Button>
                )}
              </>
            ) : null}
          </div>
        </div>

        {event.payment_url ? (
          <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Public payment URL
            </p>
            <a
              href={event.payment_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 break-all text-sm font-medium text-emerald-700 hover:underline"
            >
              {event.payment_url}
            </a>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Raised (paid)</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {formatKesCurrency(raised)}
            </p>
          </div>
          <div className="rounded border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Paid contributions</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {event.totals?.paid_count ?? 0}
            </p>
          </div>
          <div className="rounded border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Awaiting payment</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {event.totals?.awaiting_count ?? 0}
            </p>
          </div>
        </div>

        {target != null && target > 0 ? (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Goal progress</span>
              <span>
                {formatKesCurrency(raised)} / {formatKesCurrency(target)} ({progress}%)
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${progress ?? 0}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Event transactions</h2>
            <p className="text-sm text-slate-600">
              Only payments made through this event&apos;s link.
            </p>
          </div>
          <p className="text-sm text-slate-500">{totalTx} total</p>
        </div>

        <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-sm">
          {txQuery.isLoading ? (
            <p className="p-4 text-sm text-slate-600">Loading transactions…</p>
          ) : null}
          {txQuery.isError ? (
            <p className="p-4 text-sm text-red-700">Unable to load transactions.</p>
          ) : null}
          {!txQuery.isLoading && transactions.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon="💳"
                title="No transactions yet"
                description="Share the payment link so congregants can contribute to this event."
              />
            </div>
          ) : null}

          {transactions.length > 0 ? (
            <div className="admin-table-wrap border-0 shadow-none">
              <table className="admin-table">
                <thead className="bg-slate-50">
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
                      <td className="text-slate-600">{formatDate(tx.created_at)}</td>
                      <td className="text-slate-900">{tx.payer_name || '—'}</td>
                      <td className="font-mono text-xs text-slate-700">{tx.payer_phone}</td>
                      <td>
                        <StatusBadge label={String(tx.status)} />
                      </td>
                      <td className="font-mono text-xs text-slate-600">{tx.mpesa_ref || '—'}</td>
                      <td className="text-right font-medium text-slate-900">
                        {formatKesCurrency(tx.gross_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {totalTx > 50 ? (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
            </button>
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
