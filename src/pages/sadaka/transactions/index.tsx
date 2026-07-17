import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDate, formatKesCurrency } from '../../../utils/formatters';
import {
  downloadSadakaTransactionsCsv,
  fetchSadakaChurches,
  fetchSadakaTransactions,
  sadakaQueryKeys
} from '../api';

export const SadakaTransactionsPage = () => {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [churchId, setChurchId] = useState(searchParams.get('church_id') || '');
  const [source, setSource] = useState(searchParams.get('source') || '');
  const [phone, setPhone] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [exporting, setExporting] = useState(false);
  const limit = 25;

  const params = {
    page,
    limit,
    status: status || undefined,
    church_id: churchId || undefined,
    source: source || undefined,
    phone: phone.trim() || undefined,
    from: from || undefined,
    to: to || undefined
  };

  const txQuery = useQuery({
    queryKey: sadakaQueryKeys.transactions(params),
    queryFn: () => fetchSadakaTransactions(params),
    placeholderData: (prev) => prev
  });
  const churchesQuery = useQuery({
    queryKey: sadakaQueryKeys.churches({ page: 1, limit: 100 }),
    queryFn: () => fetchSadakaChurches({ page: 1, limit: 100 })
  });

  const rows = txQuery.data?.transactions ?? [];
  const total = txQuery.data?.total ?? 0;
  const hasNext = Boolean(txQuery.data?.has_more);

  const onExport = async () => {
    setExporting(true);
    try {
      const blob = await downloadSadakaTransactionsCsv({
        status: status || undefined,
        church_id: churchId || undefined,
        source: source || undefined,
        phone: phone.trim() || undefined,
        from: from || undefined,
        to: to || undefined
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'platform-transactions.csv';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">All churches · filters · CSV export</p>
        </div>
        <button
          type="button"
          onClick={() => void onExport()}
          disabled={exporting}
          className="rounded bg-slate-950 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      <section className="grid gap-3 card card-pad md:grid-cols-3 xl:grid-cols-6">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Status</span>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-full rounded border border-slate-300 px-3 py-2">
            <option value="">All</option>
            <option value="paid">Paid</option>
            <option value="awaiting_payment">Awaiting</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Church</span>
          <select value={churchId} onChange={(e) => { setChurchId(e.target.value); setPage(1); }} className="w-full rounded border border-slate-300 px-3 py-2">
            <option value="">All</option>
            {(churchesQuery.data?.churches ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Source</span>
          <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} className="w-full rounded border border-slate-300 px-3 py-2">
            <option value="">All</option>
            <option value="offering">Offering</option>
            <option value="event">Event</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Phone</span>
          <input value={phone} onChange={(e) => { setPhone(e.target.value); setPage(1); }} className="w-full rounded border border-slate-300 px-3 py-2" placeholder="07…" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">From</span>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">To</span>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="w-full rounded border border-slate-300 px-3 py-2" />
        </label>
      </section>

      {txQuery.isLoading ? <div className="card card-pad text-sm text-slate-600">Loading…</div> : null}
      {txQuery.isError ? <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load transactions.</div> : null}

      <section className="card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Church</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && !txQuery.isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-slate-500">No transactions match filters.</td>
              </tr>
            ) : null}
            {rows.map((tx) => (
              <tr key={tx.id}>
                <td className="px-4 py-3">
                  <Link to={`/sadaka/churches/${tx.church_id}`} className="font-medium text-slate-900 hover:underline">
                    {tx.church_name || tx.church_id}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{tx.payer_phone}</td>
                <td className="px-4 py-3 font-medium">{formatKesCurrency(tx.total_amount)}</td>
                <td className="px-4 py-3 text-slate-600">{formatKesCurrency(tx.fee)}</td>
                <td className="px-4 py-3 capitalize">{tx.status.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 capitalize">{tx.source}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(tx.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 0 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            <p>Page {page} · {total} total</p>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40">Previous</button>
              <button type="button" disabled={!hasNext} onClick={() => setPage((p) => p + 1)} className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};
