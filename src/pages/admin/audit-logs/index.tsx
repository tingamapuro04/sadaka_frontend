import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RoleBasedGuard } from '../../../components/auth/RoleBasedGuard';
import { Button, EmptyState, PageHeader } from '../../../components/ui';
import { IconClipboard } from '../../../components/icons';
import { formatDate } from '../../../utils/formatters';
import { adminQueryKeys, fetchAuditLogPage } from '../api';

const PAGE_SIZE_HINT = 50;

export const AdminAuditLogsPage = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const auditQuery = useQuery({
    queryKey: adminQueryKeys.auditLogs(page),
    queryFn: () => fetchAuditLogPage(page)
  });

  const filteredLogs = useMemo(() => {
    const rows = auditQuery.data?.logs ?? [];
    return rows.filter((log) => {
      const matchesAction =
        actionFilter.trim().length === 0 ||
        log.action.toLowerCase().includes(actionFilter.toLowerCase());
      const matchesDate =
        dateFilter.trim().length === 0 ||
        new Date(log.created_at).toISOString().slice(0, 10) === dateFilter;
      return matchesAction && matchesDate;
    });
  }, [actionFilter, auditQuery.data?.logs, dateFilter]);

  const hasNextPage = (auditQuery.data?.logs.length ?? 0) === PAGE_SIZE_HINT;
  const hasActiveFilters = actionFilter.trim().length > 0 || dateFilter.trim().length > 0;

  const clearFilters = () => {
    setActionFilter('');
    setDateFilter('');
  };

  return (
    <RoleBasedGuard
      allow={['church_super_admin']}
      fallback={
        <div className="card card-pad text-sm text-ink-muted">
          Audit logs are available to church super admins only.
        </div>
      }
    >
      <div className="space-y-4 animate-fade-in sm:space-y-5">
        <PageHeader
          title="Audit logs"
          description="Read-only activity trail. Filters apply to the current page."
        />

        <section className="card card-pad space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block field-label">Action</span>
              <input
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                placeholder="e.g. withdrawal.created"
                className="field-control"
                autoCapitalize="off"
                autoCorrect="off"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block field-label">Date</span>
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="field-control"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink-muted sm:text-sm">
              {auditQuery.isLoading
                ? 'Loading…'
                : `${filteredLogs.length} shown on page ${page}`}
            </p>
            {hasActiveFilters ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        </section>

        {auditQuery.isLoading ? (
          <div className="card card-pad text-sm text-ink-muted" role="status">
            Loading audit logs…
          </div>
        ) : null}
        {auditQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 sm:p-4" role="alert">
            Unable to load audit logs.
          </div>
        ) : null}

        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 px-3.5 py-3 sm:px-5">
            <h2 className="text-sm font-semibold text-ink sm:text-base">Entries</h2>
            <p className="mt-0.5 text-xs text-ink-muted">Tap a row to expand metadata.</p>
          </div>

          {!auditQuery.isLoading && !auditQuery.isError && filteredLogs.length === 0 ? (
            <div className="p-3.5 sm:p-4">
              <EmptyState
                icon={<IconClipboard className="h-6 w-6" />}
                title="No matching entries"
                description={
                  hasActiveFilters
                    ? 'Try clearing filters or changing the page.'
                    : 'Activity will appear here as admins use the console.'
                }
                actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
                onAction={hasActiveFilters ? clearFilters : undefined}
              />
            </div>
          ) : null}

          <ul className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const expanded = expandedId === log.id;
              const hasMeta = Boolean(log.metadata && Object.keys(log.metadata).length > 0);
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
                      <p className="mt-1 text-2xs capitalize text-ink-muted sm:text-xs">
                        {log.actor_role.replace(/_/g, ' ')}
                        <span className="mx-1 text-slate-300">·</span>
                        {formatDate(log.created_at)}
                      </p>
                      {log.church_id ? (
                        <p className="mt-0.5 truncate font-mono text-2xs text-ink-muted">
                          {log.church_id}
                        </p>
                      ) : null}
                    </div>
                    <span className="mt-0.5 shrink-0 text-slate-300" aria-hidden>
                      {expanded ? '▾' : '›'}
                    </span>
                  </button>
                  {expanded ? (
                    <div className="space-y-2 border-t border-slate-50 bg-slate-50/60 px-3.5 py-3 sm:px-5">
                      <div className="text-xs">
                        <p className="font-medium text-ink-muted">Actor ID</p>
                        <p className="mt-0.5 break-all font-mono text-ink">{log.actor_id}</p>
                      </div>
                      <div className="text-xs">
                        <p className="font-medium text-ink-muted">Metadata</p>
                        {hasMeta ? (
                          <pre className="mt-1 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white p-2.5 text-2xs leading-relaxed text-slate-700 sm:text-xs">
                            {JSON.stringify(log.metadata, null, 2)}
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

          <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-2.5 sm:justify-between sm:px-4 sm:py-3">
            <Button
              variant="secondary"
              size="sm"
              className="min-w-[5.5rem]"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || auditQuery.isLoading}
            >
              Previous
            </Button>
            <span className="flex-1 text-center text-xs text-ink-muted sm:text-sm">Page {page}</span>
            <Button
              variant="secondary"
              size="sm"
              className="min-w-[5.5rem]"
              onClick={() => setPage((current) => current + 1)}
              disabled={!hasNextPage || auditQuery.isLoading}
            >
              Next
            </Button>
          </div>
        </section>
      </div>
    </RoleBasedGuard>
  );
};
