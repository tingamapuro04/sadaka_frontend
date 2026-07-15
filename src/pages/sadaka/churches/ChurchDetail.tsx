import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { formatKesCurrency } from '../../../utils/formatters';
import { fetchSadakaChurch, sadakaQueryKeys } from '../api';

export const SadakaChurchDetailPage = () => {
  const { id = '' } = useParams();
  const churchQuery = useQuery({
    queryKey: sadakaQueryKeys.church(id),
    queryFn: () => fetchSadakaChurch(id),
    enabled: Boolean(id)
  });

  const church = churchQuery.data;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link to="/sadaka/churches" className="text-sm text-slate-600 hover:underline">
            Back to churches
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Church detail</h1>
          <p className="mt-1 text-sm text-slate-600">Profile and financial totals for the selected church.</p>
        </div>
      </div>

      {churchQuery.isLoading ? <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading church detail...</div> : null}
      {churchQuery.isError ? <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load church detail.</div> : null}

      {church ? (
        <div className="space-y-4">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Available balance</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatKesCurrency(church.available_balance)}</p>
            </div>
            <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Total volume</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatKesCurrency(church.total_volume)}</p>
            </div>
            <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Fees collected</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatKesCurrency(church.total_fees_collected)}</p>
            </div>
          </section>

          <section className="grid gap-3 rounded border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-700">Transaction summary</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{church.transaction_summary?.total_transactions ?? 0}</p>
                </div>
                <div className="rounded bg-emerald-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-emerald-700">Paid</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{church.transaction_summary?.paid_transactions ?? 0}</p>
                </div>
                <div className="rounded bg-red-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-red-700">Failed</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{church.transaction_summary?.failed_transactions ?? 0}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Withdrawal summary</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                <div className="rounded bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{church.withdrawal_summary?.total_withdrawals ?? 0}</p>
                </div>
                <div className="rounded bg-emerald-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-emerald-700">Completed</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{church.withdrawal_summary?.completed_withdrawals ?? 0}</p>
                </div>
                <div className="rounded bg-red-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-red-700">Failed</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{church.withdrawal_summary?.failed_withdrawals ?? 0}</p>
                </div>
                <div className="rounded bg-amber-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-amber-700">Pending</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{church.withdrawal_summary?.pending_withdrawals ?? 0}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-3 rounded border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
            <div><p className="text-sm text-slate-500">Name</p><p className="font-medium text-slate-950">{church.name}</p></div>
            <div><p className="text-sm text-slate-500">Username</p><p className="font-medium text-slate-950">@{church.username}</p></div>
            <div><p className="text-sm text-slate-500">Phone</p><p className="font-medium text-slate-950">{church.phone}</p></div>
            <div><p className="text-sm text-slate-500">Email</p><p className="font-medium text-slate-950">{church.email ?? '—'}</p></div>
            <div><p className="text-sm text-slate-500">Withdrawal method</p><p className="font-medium capitalize text-slate-950">{church.withdrawal_method}</p></div>
            <div><p className="text-sm text-slate-500">Withdrawal number</p><p className="font-medium text-slate-950">{church.withdrawal_number}</p></div>
            <div className="sm:col-span-2"><p className="text-sm text-slate-500">Payment URL</p><p className="font-medium text-slate-950 break-all">{church.payment_url}</p></div>
            <div className="sm:col-span-2"><p className="text-sm text-slate-500">Groups enabled</p><p className="font-medium text-slate-950">{church.groups_enabled ? 'Yes' : 'No'}</p></div>
          </section>
        </div>
      ) : null}
    </div>
  );
};
