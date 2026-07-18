import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, EmptyState, PageHeader } from '../../../components/ui';
import { IconClipboard } from '../../../components/icons';
import { formatDate } from '../../../utils/formatters';
import { fetchSadakaAuditLogs, sadakaQueryKeys } from '../api';

export const SadakaAuditLogsPage = () => {
  const [action, setAction] = useState('');
  const [churchId, setChurchId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 25;

  const params = {
    page,
    limit,
    action: action.trim() || undefined,
    church_id: churchId.trim() || undefined,
    from: from || undefined,
    to: to || undefined
  };

  const auditQuery = useQuery({
    queryKey: sadakaQueryKeys.auditLogs(params),
    queryFn: () => fetchSadakaAuditLogs(params),
    refetchInterval: 30_000,
    placeholderData: (prev) => prev
  });

  const pageData = auditQuery.data;
  const logs = pageData?.logs ?? [];
  const total = pageData?.total ?? 0;
  const hasNextPage = Boolean(pageData?.has_more);

  const advancedActiveCount = [churchId.trim(), from, to].filter(Boolean).length;
  const hasFilters = Boolean(action.trim() || advancedActiveCount);

  const clearFilters = () => {
    setAction('');
    setChurchId('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-5">
      <PageHeader
        title="Audit logs"
        description="Read-only platform-wide activity trail."
        actions={
          <Button
            variant="secondary"
            fullWidth
            className="sm:!w-auto"
            onClick={() => void auditQuery.refetch()}
            loading={auditQuery.isFetching}
          >
            Refresh
          </Button>
        }
      />

      <section className="card overflow-hidden">
        <div className="space-y-3 p-3.5 sm:p-4">
          <label className="block text-sm">
            <span className="mb-1 block field-label">Action</span>
            <input
              value={action}
              onChange={(event) => {
                setAction(event.target.value);
                resetPage();
              }}
              placeholder="e.g. withdrawal.retry"
              className="field-control"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3.5 py-2.5 sm:hidden">
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
          className={`grid gap-3 border-t border-slate-100 p-3.5 sm:grid-cols-3 sm:border-t-0 sm:p-4 sm:pt-0 ${
            advancedOpen ? 'grid' : 'hidden'
          } sm:grid`}
        >
          <label className="text-sm">
            <span className="mb-1 block field-label">Church ID</span>
            <input
              value={churchId}
              onChange={(event) => {
                setChurchId(event.target.value);
                resetPage();
              }}
              placeholder="uuid"
              className="field-control"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block field-label">From</span>
            <input
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
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
              onChange={(event) => {
                setTo(event.target.value);
                resetPage();
              }}
              className="field-control"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-3.5 py-2.5 sm:px-4">
          <p className="text-xs text-ink-muted sm:text-sm">
            {auditQuery.isLoading
              ? 'Loading…'
              : `${total.toLocaleString('en-KE')} result${total === 1 ? '' : 's'}`}
          </p>
          {hasFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </section>

      {auditQuery.isLoading && logs.length === 0 ? (
        <div className="card card-pad text-sm text-ink-muted" role="status">
          Loading audit logs…
        </div>
      ) : null}
      {auditQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 sm:p-4" role="alert">
          Unable to load audit logs.
        </div>
      ) : null}

      {!auditQuery.isLoading && !auditQuery.isError && logs.length === 0 ? (
        <EmptyState
          icon={<IconClipboard className="h-6 w-6" />}
          title="No matching entries"
          description={
            hasFilters
              ? 'Try clearing filters or adjusting the date range.'
              : 'Platform activity will appear here as operators use the console.'
          }
          actionLabel={hasFilters ? 'Clear filters' : undefined}
          onAction={hasFilters ? clearFilters : undefined}
        />
      ) : null}

      {logs.length > 0 ? (
        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 px-3.5 py-3 sm:px-5">
            <h2 className="text-sm font-semibold text-ink sm:text-base">Entries</h2>
            <p className="mt-0.5 text-xs text-ink-muted">Tap a row to expand details.</p>
          </div>

          <ul className="divide-y divide-slate-100">
            {logs.map((log) => {
              const expanded = expandedId === log.id;
              const hasDetails = Boolean(log.details && Object.keys(log.details as object).length > 0);
              const churchLabel = log.church_name ?? log.church_id ?? 'Platform event';

              return (
                <li key={log.id}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 px-3.5 py-3.5 text-left active:bg-slate-50 sm:px-5 sm:py-4"
                    onClick={() => setExpandedId(expanded ? null : log.id)}
                    aria-expanded={expanded}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{log.action}</p>
                      <p className="mt-1 text-2xs text-ink-muted sm:text-xs">
                        {log.actor}
                        <span className="mx-1 text-slate-300">·</span>
                        {formatDate(log.created_at)}
                      </p>
                      <p className="mt-0.5 truncate text-2xs text-ink-muted sm:text-xs">{churchLabel}</p>
                    </div>
                    <span className="mt-0.5 shrink-0 text-slate-300" aria-hidden>
                      {expanded ? '▾' : '›'}
                    </span>
                  </button>
                  {expanded ? (
                    <div className="space-y-2 border-t border-slate-50 bg-slate-50/60 px-3.5 py-3 sm:px-5">
                      <div className="text-xs">
                        <p className="font-medium text-ink-muted">Church</p>
                        <p className="mt-0.5 break-all font-medium text-ink">{churchLabel}</p>
                      </div>
                      <div className="text-xs">
                        <p className="font-medium text-ink-muted">Details</p>
                        {hasDetails ? (
                          <pre className="mt-1 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white p-2.5 text-2xs leading-relaxed text-slate-700 sm:text-xs">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        ) : (
                          <p className="mt-0.5 text-ink-muted">—</p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {total > 0 ? (
            <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-2.5 sm:justify-between sm:px-4 sm:py-3">
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
                <span className="mx-1 text-slate-300">·</span>
                {total.toLocaleString('en-KE')} total
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="min-w-[5.5rem]"
                disabled={!hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
};
