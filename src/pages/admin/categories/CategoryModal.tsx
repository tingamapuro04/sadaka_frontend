import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui';
import type { AdminListItem } from '../types';

interface CategoryModalProps {
  category: AdminListItem | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export const CategoryModal = ({ category, isSaving, onClose, onSave }: CategoryModalProps) => {
  const [name, setName] = useState(category?.name ?? '');

  useEffect(() => {
    setName(category?.name ?? '');
  }, [category]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <form
        className="w-full max-w-md rounded-t-2xl bg-white shadow-overlay safe-pb sm:rounded-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(name);
        }}
      >
        <div className="border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <p className="text-2xs font-semibold uppercase tracking-wider text-brand-700">Category</p>
          <h2 className="mt-0.5 text-lg font-semibold text-ink">
            {category ? 'Edit category' : 'New category'}
          </h2>
          <p className="mt-1 text-xs text-ink-muted sm:text-sm">
            This name appears on the public payment page for givers.
          </p>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5">
          <label className="block text-sm">
            <span className="mb-1 block field-label">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field-control"
              autoFocus
              autoComplete="off"
            />
          </label>

          <div className="mobile-actions sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || name.trim().length < 2}
              loading={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
