import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '../../../utils/formatters';
import { fetchSadakaAuditLogs, sadakaQueryKeys } from '../api';

export const SadakaAuditLogsPage = () => {
  const [action, setAction] = useState('');
  const [church, setChurch] = useState('');
  const [date, setDate] = useState('');

  const auditQuery = useQuery({
    queryKey: sadakaQueryKeys.auditLogs,
    queryFn: fetchSadakaAuditLogs,
    refetchInterval: 30_000
  });

  const filteredLogs = useMemo(() => {
    const rows = auditQuery.data ?? [];
    return rows.filter((log) => {
      const matchesAction = !action || log.action.toLowerCase().includes(action.toLowerCase());
      const matchesChurch =
        !church ||
        log.church_name?.toLowerCase().includes(church.toLowerCase()) ||
        log.church_id?.toLowerCase().includes(church.toLowerCase());
      const matchesDate = !date || new Date(log.created_at).toISOString().slice(0, 10) === date;
      return matchesAction && matchesChurch && matchesDate;
    });
  }, [action, auditQuery.data, church, date]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Audit logs</h1>
        <p className="mt-1 text-sm text-slate-600">Read-only platform-wide activity trail.</p>
      </div>

      <section className="grid gap-3 rounded border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Action</span>
          <input value={action} onChange={(event) => setAction(event.target.value)} placeholder="withdrawal_created" className="w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Church</span>
          <input value={church} onChange={(event) => setChurch(event.target.value)} placeholder="Grace Community" className="w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Date</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" />
        </label>
      </section>

      {auditQuery.isLoading ? <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading audit logs...</div> : null}
      {auditQuery.isError ? <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load audit logs.</div> : null}

      <section className="rounded border border-slate-200 bg-white shadow-sm">
        <div className="divide-y divide-slate-100">
          {!auditQuery.isLoading && filteredLogs.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No audit logs match the current filters.</p>
          ) : null}
          {filteredLogs.map((log) => (
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
      </section>
    </div>
  );
};
