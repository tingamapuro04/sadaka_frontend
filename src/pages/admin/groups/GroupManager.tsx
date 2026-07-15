import type { AdminListItem } from '../types';

interface GroupManagerProps {
  groups: AdminListItem[];
  isReadonly: boolean;
  isMutating: boolean;
  onEdit: (group: AdminListItem) => void;
  onToggle: (group: AdminListItem) => void;
}

export const GroupManager = ({ groups, isReadonly, isMutating, onEdit, onToggle }: GroupManagerProps) => {
  return (
    <div className="rounded border border-slate-200 bg-white shadow-sm">
      {groups.length === 0 ? <p className="p-4 text-sm text-slate-500">No groups yet.</p> : null}
      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-slate-950">{group.name}</p>
            <p className="text-sm text-slate-500">{group.is_active ? 'Active' : 'Inactive'}</p>
          </div>
          {!isReadonly ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => onEdit(group)} className="rounded border border-slate-300 px-3 py-1.5 text-sm">
                Edit
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={() => onToggle(group)}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {group.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

