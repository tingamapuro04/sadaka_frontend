import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '../../../utils/formatters';
import { fetchSadakaAuditLogs, sadakaQueryKeys } from '../api';

export const SadakaAuditLogsPage = () => {
  const [action, setAction] = useState('');
  const [churchId, setChurchId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Audit logs</h1>
        <p className="page-subtitle">Read-only platform-wide activity trail.</p>
      </div>

      <section className="grid gap-3 card card-pad md:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Action</span>
          <input
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
            placeholder="withdrawal.retry"
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Church ID</span>
          <input
            value={churchId}
            onChange={(event) => {
              setChurchId(event.target.value);
              setPage(1);
            }}
            placeholder="uuid"
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">From</span>
          <input
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">To</span>
          <input
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
      </section>

      {auditQuery.isLoading ? (
        <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading audit logs...</div>
      ) : null}
      {auditQuery.isError ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load audit logs.</div>
      ) : null}

      <section className="card">
        <div className="divide-y divide-slate-100">
          {!auditQuery.isLoading && logs.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No audit logs match the current filters.</p>
          ) : null}
          {logs.map((log) => (
            <article key={log.id} className="p-4 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-slate-950">{log.action}</p>
                  <p className="text-slate-500">{log.actor}</p>
                </div>
                <p className="text-slate-500">{formatDate(log.created_at)}</p>
              </div>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Church</dt>
                  <dd className="font-medium text-slate-800">{log.church_name ?? log.church_id ?? 'Platform event'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Details</dt>
                  <dd className="font-medium text-slate-800">
                    {log.details ? (
                      <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-2 text-xs text-slate-700">
                        {JSON.stringify(log.details, null, 2)}
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
        {total > 0 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            <p>
              Page {page} · {total} total
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};
