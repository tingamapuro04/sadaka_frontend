import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconCalendar } from '../../../components/icons';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  PageHeader,
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

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'closed', label: 'Closed' }
] as const;

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

  const openCreate = () => {
    setFormError(null);
    setModalEvent(null);
  };

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-5">
      <PageHeader
        title="Events"
        description="Fundraisers with unique payment links and per-event tracking."
        actions={
          !isReadonly ? (
            <Button fullWidth className="sm:!w-auto" onClick={openCreate}>
              Create event
            </Button>
          ) : undefined
        }
      />

      <div>
        <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-muted">
          Status
        </p>
        <div className="mobile-chip-row" role="group" aria-label="Filter events by status">
          {STATUS_FILTERS.map((option) => {
            const active = statusFilter === option.value;
            return (
              <button
                key={option.value || 'all'}
                type="button"
                onClick={() => setStatusFilter(option.value)}
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

      {eventsQuery.isLoading ? (
        <p className="card card-pad text-sm text-ink-muted" role="status">
          Loading events…
        </p>
      ) : null}
      {eventsQuery.isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 sm:p-4" role="alert">
          Unable to load events.
        </p>
      ) : null}

      {!eventsQuery.isLoading && !eventsQuery.isError && events.length === 0 ? (
        <EmptyState
          icon={<IconCalendar className="h-6 w-6" />}
          title="No events yet"
          description={
            isReadonly
              ? 'Your church has not published any fundraising events.'
              : 'Create your first event to get a shareable payment link for congregants.'
          }
          actionLabel={isReadonly ? undefined : 'Create your first event'}
          onAction={isReadonly ? undefined : openCreate}
        />
      ) : null}

      {events.length > 0 ? (
        <ul className="card divide-y divide-slate-100 overflow-hidden">
          {events.map((event) => {
            const raised = event.totals?.paid_gross ?? 0;
            const target = event.target_amount != null ? Number(event.target_amount) : null;
            const progress =
              target && target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : null;

            return (
              <li key={event.id} className="p-3.5 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/admin/events/${event.id}`}
                        className="truncate text-sm font-semibold text-ink hover:text-brand-700 hover:underline sm:text-base"
                      >
                        {event.title}
                      </Link>
                      <StatusBadge
                        label={event.status}
                        className="!px-2 !py-0 !text-[0.65rem] sm:!px-2.5 sm:!py-0.5 sm:!text-xs"
                      />
                    </div>
                    <p className="mt-0.5 truncate text-2xs text-ink-muted sm:text-xs">/{event.slug}</p>
                  </div>
                  <p className="shrink-0 text-right text-sm font-bold tabular-nums text-ink sm:text-base">
                    {formatKesCurrency(raised)}
                  </p>
                </div>

                <p className="mt-2 text-xs text-ink-muted sm:text-sm">
                  Raised{' '}
                  <span className="font-semibold tabular-nums text-ink">{formatKesCurrency(raised)}</span>
                  {target != null ? <> of {formatKesCurrency(target)}</> : null}
                  <span>
                    {' '}
                    · {event.totals?.paid_count ?? 0} paid
                    {(event.totals?.awaiting_count ?? 0) > 0
                      ? ` · ${event.totals?.awaiting_count} pending`
                      : ''}
                  </span>
                </p>

                {progress != null ? (
                  <div className="mt-2 h-1.5 max-w-full overflow-hidden rounded-full bg-slate-100 sm:max-w-xs">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                ) : null}

                <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <Link
                    to={`/admin/events/${event.id}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-soft active:bg-slate-50 sm:min-h-[40px] sm:rounded-lg sm:font-medium sm:text-slate-700"
                  >
                    Open
                  </Link>
                  <Button variant="secondary" onClick={() => void copyLink(event)}>
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
                          className="border-brand-200 text-brand-900"
                        >
                          Reopen
                        </Button>
                      )}
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
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
