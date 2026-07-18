import { useState } from 'react';
import { PhoneInput } from '../../../../components/shared/PhoneInput';
import { Button, Select } from '../../../../components/ui';
import type { AdminListItem, TransactionFiltersState } from '../../types';

interface TransactionFiltersProps {
  categories: AdminListItem[];
  filters: TransactionFiltersState;
  onChange: (filters: TransactionFiltersState) => void;
  resultCount?: number;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'awaiting_payment', label: 'Awaiting' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' }
] as const;

export const TransactionFilters = ({
  categories,
  filters,
  onChange,
  resultCount
}: TransactionFiltersProps) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const update = (key: keyof TransactionFiltersState, value: string) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  const activeChips: Array<{ key: keyof TransactionFiltersState; label: string }> = [];
  if (filters.status) {
    activeChips.push({
      key: 'status',
      label: filters.status.replace(/_/g, ' ')
    });
  }
  if (filters.phone) activeChips.push({ key: 'phone', label: filters.phone });
  if (filters.mpesa_ref) activeChips.push({ key: 'mpesa_ref', label: filters.mpesa_ref });
  if (filters.from) activeChips.push({ key: 'from', label: `From ${filters.from}` });
  if (filters.to) activeChips.push({ key: 'to', label: `To ${filters.to}` });
  if (filters.category_id) {
    const cat = categories.find((c) => c.id === filters.category_id);
    activeChips.push({ key: 'category_id', label: cat?.name ?? 'Category' });
  }

  const advancedActiveCount = [
    filters.phone,
    filters.mpesa_ref,
    filters.from,
    filters.to,
    filters.category_id
  ].filter(Boolean).length;

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
      {/* Status chips — primary filter on mobile */}
      <div>
        <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-muted sm:hidden">
          Status
        </p>
        <div className="mobile-chip-row sm:hidden" role="group" aria-label="Filter by status">
          {STATUS_OPTIONS.map((option) => {
            const active = filters.status === option.value;
            return (
              <button
                key={option.value || 'all'}
                type="button"
                onClick={() => update('status', option.value)}
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

      {/* Desktop / expanded filter grid */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5 sm:hidden">
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
          className={`grid gap-3 p-3.5 sm:grid-cols-2 sm:p-4 xl:grid-cols-6 ${
            advancedOpen ? 'grid' : 'hidden'
          } sm:grid`}
        >
          <div className="hidden sm:block">
            <Select
              label="Status"
              value={filters.status}
              onChange={(event) => update('status', event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label === 'Awaiting' ? 'Awaiting payment' : option.label}
                </option>
              ))}
            </Select>
          </div>

          <PhoneInput
            label="Phone"
            value={filters.phone}
            onChange={(phone) => update('phone', phone)}
            compact
          />

          <label className="text-sm">
            <span className="mb-1 block field-label">M-PESA ref</span>
            <input
              value={filters.mpesa_ref}
              onChange={(event) => update('mpesa_ref', event.target.value)}
              placeholder="ABC123"
              className="field-control"
              autoCapitalize="characters"
              autoCorrect="off"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block field-label">From</span>
            <input
              type="date"
              value={filters.from}
              onChange={(event) => update('from', event.target.value)}
              className="field-control"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block field-label">To</span>
            <input
              type="date"
              value={filters.to}
              onChange={(event) => update('to', event.target.value)}
              className="field-control"
            />
          </label>

          <Select
            label="Category"
            value={filters.category_id}
            onChange={(event) => update('category_id', event.target.value)}
          >
            <option value="">All</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Results + active chips */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          {typeof resultCount === 'number' ? (
            <p className="text-sm text-ink-muted">
              <span className="font-semibold text-ink">{resultCount.toLocaleString('en-KE')}</span>{' '}
              result{resultCount === 1 ? '' : 's'}
              {filters.page > 1 ? ` · page ${filters.page}` : ''}
            </p>
          ) : (
            <span />
          )}
          {activeChips.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="sm:hidden"
              onClick={clearAll}
            >
              Clear all
            </Button>
          ) : null}
        </div>

        {activeChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => update(chip.key, '')}
                className="inline-flex min-h-8 max-w-full items-center gap-1 truncate rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium capitalize text-slate-700 shadow-soft active:bg-slate-50"
              >
                <span className="truncate">{chip.label}</span>
                <span aria-hidden className="shrink-0 text-slate-400">
                  ×
                </span>
                <span className="sr-only">Remove filter</span>
              </button>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="hidden text-xs font-semibold text-brand-700 hover:underline sm:inline"
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
