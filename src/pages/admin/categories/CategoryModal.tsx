import { useEffect, useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
      <form
        className="w-full max-w-md rounded bg-white p-5 shadow-xl"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(name);
        }}
      >
        <h2 className="text-lg font-semibold text-slate-950">{category ? 'Edit category' : 'New category'}</h2>
        <label className="mt-4 block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2"
            autoFocus
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border border-slate-300 px-3 py-2 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || name.trim().length < 2}
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

