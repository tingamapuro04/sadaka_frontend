import { Button, EmptyState, StatusBadge } from '../../../components/ui';
import { IconUsers } from '../../../components/icons';
import type { AdminListItem } from '../types';

interface GroupManagerProps {
  groups: AdminListItem[];
  isReadonly: boolean;
  isMutating: boolean;
  onEdit: (group: AdminListItem) => void;
  onToggle: (group: AdminListItem) => void;
  onAdd?: () => void;
}

export const GroupManager = ({
  groups,
  isReadonly,
  isMutating,
  onEdit,
  onToggle,
  onAdd
}: GroupManagerProps) => {
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<IconUsers className="h-6 w-6" />}
        title="No groups yet"
        description="Create groups so givers can attribute offerings to a congregation or ministry."
        actionLabel={isReadonly || !onAdd ? undefined : 'Add group'}
        onAction={isReadonly || !onAdd ? undefined : onAdd}
      />
    );
  }

  return (
    <ul className="card divide-y divide-slate-100 overflow-hidden">
      {groups.map((group) => (
        <li key={group.id} className="px-3.5 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink sm:text-base">{group.name}</p>
            <div className="mt-1.5">
              <StatusBadge
                label={group.is_active ? 'active' : 'inactive'}
                className="!px-2 !py-0 !text-[0.65rem] sm:!px-2.5 sm:!py-0.5 sm:!text-xs"
              />
            </div>
          </div>
          {!isReadonly ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button variant="secondary" size="sm" onClick={() => onEdit(group)}>
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={isMutating}
                onClick={() => onToggle(group)}
              >
                {group.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
};
