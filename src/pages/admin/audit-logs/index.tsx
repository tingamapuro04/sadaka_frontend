import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RoleBasedGuard } from '../../../components/auth/RoleBasedGuard';
import { formatDate } from '../../../utils/formatters';
import { adminQueryKeys, fetchAuditLogPage } from '../api';

const PAGE_SIZE_HINT = 50;

export const AdminAuditLogsPage = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const auditQuery = useQuery({
    queryKey: adminQueryKeys.auditLogs(page),
    queryFn: () => fetchAuditLogPage(page)
  });

  const filteredLogs = useMemo(() => {
    const rows = auditQuery.data?.logs ?? [];
    return rows.filter((log) => {
      const matchesAction = actionFilter.trim().length === 0 || log.action.toLowerCase().includes(actionFilter.toLowerCase());
      const matchesDate =
        dateFilter.trim().length === 0 || new Date(log.created_at).toISOString().slice(0, 10) === dateFilter;
      return matchesAction && matchesDate;
    });
  }, [actionFilter, auditQuery.data?.logs, dateFilter]);

  const hasNextPage = (auditQuery.data?.logs.length ?? 0) === PAGE_SIZE_HINT;

  return (
    <RoleBasedGuard
      allow={['church_super_admin']}
      fallback={
        <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Audit logs are available to church super admins only.
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Audit logs</h1>
          <p className="mt-1 text-sm text-slate-600">Read-only activity trail with client-side action and date filters.</p>
        </div>

        <section className="grid gap-3 rounded border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Action</span>
            <input
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              placeholder="withdrawal.created"
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Date</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
        </section>

        {auditQuery.isLoading ? <div className="rounded border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading audit logs...</div> : null}
        {auditQuery.isError ? <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load audit logs.</div> : null}

        <section className="rounded border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-base font-semibold text-slate-950">Entries</h2>
          </div>

          {!auditQuery.isLoading && filteredLogs.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No audit logs match the current filters.</p>
          ) : null}

          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <article key={log.id} className="p-4 text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-950">{log.action}</p>
                    <p className="text-slate-500">
                      {log.actor_role} · {log.actor_id}
                    </p>
                  </div>
                  <p className="text-slate-500">{formatDate(log.created_at)}</p>
                </div>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Church</dt>
                    <dd className="font-medium text-slate-800">{log.church_id ?? 'Platform event'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Metadata</dt>
                    <dd className="font-medium text-slate-800">
                      {log.metadata ? (
                        <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-2 text-xs text-slate-700">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || auditQuery.isLoading}
              className="rounded border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-slate-600">Page {page}</span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={!hasNextPage || auditQuery.isLoading}
              className="rounded border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </section>
      </div>
    </RoleBasedGuard>
  );
};
