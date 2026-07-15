import type { AdminListItem, TransactionFiltersState } from '../../types';

interface TransactionFiltersProps {
  categories: AdminListItem[];
  filters: TransactionFiltersState;
  onChange: (filters: TransactionFiltersState) => void;
  resultCount?: number;
}

export const TransactionFilters = ({
  categories,
  filters,
  onChange,
  resultCount
}: TransactionFiltersProps) => {
  const update = (key: keyof TransactionFiltersState, value: string) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  const activeChips: Array<{ key: keyof TransactionFiltersState; label: string }> = [];
  if (filters.status) activeChips.push({ key: 'status', label: `Status: ${filters.status.replace(/_/g, ' ')}` });
  if (filters.phone) activeChips.push({ key: 'phone', label: `Phone: ${filters.phone}` });
  if (filters.mpesa_ref) activeChips.push({ key: 'mpesa_ref', label: `M-Pesa: ${filters.mpesa_ref}` });
  if (filters.from) activeChips.push({ key: 'from', label: `From: ${filters.from}` });
  if (filters.to) activeChips.push({ key: 'to', label: `To: ${filters.to}` });
  if (filters.category_id) {
    const cat = categories.find((c) => c.id === filters.category_id);
    activeChips.push({ key: 'category_id', label: `Category: ${cat?.name ?? 'Selected'}` });
  }

  const clearAll = () => {
    onChange({
      ...filters,
      page: 1,
      status: '',
      phone: '',
      mpesa_ref: '',
      from: '',
      to: '',
      category_id: ''
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Status</span>
          <select
            value={filters.status}
            onChange={(event) => update('status', event.target.value)}
            className="min-h-[40px] w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="awaiting_payment">Awaiting payment</option>
            <option value="failed">Failed</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Phone</span>
          <input
            value={filters.phone}
            onChange={(event) => update('phone', event.target.value)}
            placeholder="2547..."
            className="min-h-[40px] w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">M-PESA ref</span>
          <input
            value={filters.mpesa_ref}
            onChange={(event) => update('mpesa_ref', event.target.value)}
            placeholder="ABC123"
            className="min-h-[40px] w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">From</span>
          <input
            type="date"
            value={filters.from}
            onChange={(event) => update('from', event.target.value)}
            className="min-h-[40px] w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">To</span>
          <input
            type="date"
            value={filters.to}
            onChange={(event) => update('to', event.target.value)}
            className="min-h-[40px] w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Category</span>
          <select
            value={filters.category_id}
            onChange={(event) => update('category_id', event.target.value)}
            className="min-h-[40px] w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">All</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {typeof resultCount === 'number' ? (
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{resultCount}</span> result
            {resultCount === 1 ? '' : 's'}
            {filters.page > 1 ? ` · page ${filters.page}` : ''}
          </p>
        ) : null}
        {activeChips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => update(chip.key, '')}
            className="inline-flex min-h-[32px] items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {chip.label}
            <span aria-hidden className="text-slate-400">
              ×
            </span>
            <span className="sr-only">Remove filter</span>
          </button>
        ))}
        {activeChips.length > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
};
