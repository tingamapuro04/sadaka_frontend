import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  StatusBadge,
  useToast
} from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { formatKesCurrency } from '../../../utils/formatters';
import {
  adminQueryKeys,
  createEvent,
  fetchEvents,
  updateEvent
} from '../api';
import type { ChurchEvent, CreateEventPayload, EventStatus, UpdateEventPayload } from '../types';
import { EventFormModal } from './EventFormModal';

export const AdminEventsPage = () => {
  const { role } = useAuth();
  const isReadonly = role === 'readonly';
  const queryClient = useQueryClient();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [modalEvent, setModalEvent] = useState<ChurchEvent | null | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState<ChurchEvent | null>(null);

  const eventsQuery = useQuery({
    queryKey: adminQueryKeys.events({ status: statusFilter || undefined }),
    queryFn: () => fetchEvents({ status: statusFilter || undefined }),
    staleTime: 30_000
  });

  const events = useMemo(() => eventsQuery.data?.events ?? [], [eventsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      id?: string;
      data: CreateEventPayload | UpdateEventPayload;
    }) => {
      if (payload.id) {
        return updateEvent(payload.id, payload.data as UpdateEventPayload);
      }
      return createEvent(payload.data as CreateEventPayload);
    },
    onSuccess: (_data, variables) => {
      setModalEvent(undefined);
      setFormError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      toast.success(variables.id ? 'Event updated' : 'Event created');
    },
    onError: (err) => {
      const apiError = err as { message?: string };
      setFormError(apiError.message ?? 'Unable to save event');
      toast.error(apiError.message ?? 'Unable to save event');
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EventStatus }) =>
      updateEvent(id, { status }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      toast.success(variables.status === 'closed' ? 'Event closed' : 'Event reopened');
      setConfirmClose(null);
    },
    onError: (err) => {
      toast.error((err as { message?: string }).message ?? 'Unable to update event status');
    }
  });

  const copyLink = async (event: ChurchEvent) => {
    if (!event.payment_url) return;
    try {
      await navigator.clipboard.writeText(event.payment_url);
      toast.success('Payment link copied');
    } catch {
      window.prompt('Copy payment link:', event.payment_url);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Events</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create fundraisers with unique payment links and track contributions per event.
          </p>
        </div>
        {!isReadonly ? (
          <Button
            onClick={() => {
              setFormError(null);
              setModalEvent(null);
            }}
          >
            Create event
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-slate-700">
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ml-2 min-h-[40px] rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        </label>
      </div>

      {eventsQuery.isLoading ? (
        <p className="rounded border border-slate-200 bg-white p-4 text-sm text-slate-600" role="status">
          Loading events…
        </p>
      ) : null}
      {eventsQuery.isError ? (
        <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          Unable to load events.
        </p>
      ) : null}

      {!eventsQuery.isLoading && !eventsQuery.isError && events.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No events yet"
          description={
            isReadonly
              ? 'Your church has not published any fundraising events.'
              : 'Create your first event to get a shareable payment link for congregants.'
          }
          actionLabel={isReadonly ? undefined : 'Create your first event'}
          onAction={
            isReadonly
              ? undefined
              : () => {
                  setFormError(null);
                  setModalEvent(null);
                }
          }
        />
      ) : null}

      {events.length > 0 ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/admin/events/${event.id}`}
                    className="font-semibold text-slate-950 hover:text-emerald-700 hover:underline"
                  >
                    {event.title}
                  </Link>
                  <StatusBadge label={event.status} />
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">/{event.slug}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Raised{' '}
                  <span className="font-medium text-slate-900">
                    {formatKesCurrency(event.totals?.paid_gross ?? 0)}
                  </span>
                  {event.target_amount != null ? (
                    <span className="text-slate-500">
                      {' '}
                      of {formatKesCurrency(event.target_amount)}
                    </span>
                  ) : null}
                  <span className="text-slate-500">
                    {' '}
                    · {event.totals?.paid_count ?? 0} paid
                    {(event.totals?.awaiting_count ?? 0) > 0
                      ? ` · ${event.totals?.awaiting_count} pending`
                      : ''}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/admin/events/${event.id}`}
                  className="inline-flex min-h-[40px] items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Open
                </Link>
                <Button variant="secondary" size="sm" onClick={() => void copyLink(event)}>
                  Copy link
                </Button>
                {!isReadonly ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setFormError(null);
                        setModalEvent(event);
                      }}
                    >
                      Edit
                    </Button>
                    {event.status === 'active' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={statusMutation.isPending}
                        onClick={() => setConfirmClose(event)}
                        className="border-amber-300 text-amber-950"
                      >
                        Close
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: event.id, status: 'active' })}
                        className="border-emerald-300 text-emerald-950"
                      >
                        Reopen
                      </Button>
                    )}
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {modalEvent !== undefined && !isReadonly ? (
        <EventFormModal
          event={modalEvent}
          isSaving={saveMutation.isPending}
          error={formError}
          onClose={() => {
            setModalEvent(undefined);
            setFormError(null);
          }}
          onSave={(data) =>
            saveMutation.mutate({
              id: modalEvent?.id,
              data
            })
          }
        />
      ) : null}

      {confirmClose ? (
        <ConfirmDialog
          title="Close this event?"
          message={`“${confirmClose.title}” will stop accepting new payments. Existing transactions are kept. You can reopen later.`}
          confirmLabel="Close event"
          isConfirming={statusMutation.isPending}
          onCancel={() => setConfirmClose(null)}
          onConfirm={() => statusMutation.mutate({ id: confirmClose.id, status: 'closed' })}
        />
      ) : null}
    </div>
  );
};
