import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, PageHeader, useToast } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import {
  adminQueryKeys,
  createGroup,
  fetchChurch,
  fetchGroups,
  updateGroup,
  updateGroupsEnabled
} from '../api';
import type { AdminListItem } from '../types';
import { CategoryModal } from '../categories/CategoryModal';
import { GroupManager } from './GroupManager';

export const AdminGroupsPage = () => {
  const { role } = useAuth();
  const isReadonly = role === 'readonly';
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<AdminListItem | null | undefined>(undefined);
  const groupsQuery = useQuery({ queryKey: adminQueryKeys.groups, queryFn: fetchGroups });
  const churchQuery = useQuery({ queryKey: adminQueryKeys.church, queryFn: fetchChurch });

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string; name: string }) =>
      payload.id ? updateGroup(payload.id, { name: payload.name }) : createGroup(payload.name),
    onSuccess: (_data, variables) => {
      setEditing(undefined);
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.groups });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
      toast.success(variables.id ? 'Group updated' : 'Group created');
    },
    onError: (err) => {
      toast.error((err as { message?: string }).message ?? 'Unable to save group');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (group: AdminListItem) => updateGroup(group.id, { is_active: !group.is_active }),
    onMutate: async (group) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.groups });
      const previous = queryClient.getQueryData<AdminListItem[]>(adminQueryKeys.groups);
      queryClient.setQueryData<AdminListItem[]>(adminQueryKeys.groups, (current) =>
        current?.map((item) => (item.id === group.id ? { ...item, is_active: !item.is_active } : item))
      );
      return { previous };
    },
    onError: (_error, _group, context) => {
      queryClient.setQueryData(adminQueryKeys.groups, context?.previous);
      toast.error('Unable to update group');
    },
    onSuccess: (_data, group) => {
      toast.success(group.is_active ? 'Group deactivated' : 'Group activated');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.groups });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
    }
  });

  const groupsEnabledMutation = useMutation({
    mutationFn: updateGroupsEnabled,
    onSuccess: (_data, enabled) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.church });
      toast.success(enabled ? 'Group selector enabled' : 'Group selector disabled');
    },
    onError: (err) => {
      toast.error((err as { message?: string }).message ?? 'Unable to update group setting');
    }
  });

  const openCreate = () => setEditing(null);
  const groupsEnabled = Boolean(churchQuery.data?.groups_enabled);

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-5">
      <PageHeader
        title="Groups"
        description="Organize giving by congregation or ministry group."
        actions={
          !isReadonly ? (
            <Button fullWidth className="sm:!w-auto" onClick={openCreate}>
              Add group
            </Button>
          ) : undefined
        }
      />

      {!isReadonly ? (
        <div className="card card-pad">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Group selector on payment page</p>
              <p className="mt-0.5 text-xs text-ink-muted sm:text-sm">
                When enabled, givers choose a group before paying.
              </p>
            </div>
            <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={groupsEnabled}
                disabled={groupsEnabledMutation.isPending || churchQuery.isLoading}
                onChange={(event) => groupsEnabledMutation.mutate(event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="sr-only sm:not-sr-only">{groupsEnabled ? 'On' : 'Off'}</span>
            </label>
          </div>
          <p className="mt-2 text-2xs font-medium text-ink-muted sm:hidden">
            {groupsEnabled ? 'Enabled on public pay page' : 'Disabled on public pay page'}
          </p>
        </div>
      ) : null}

      {groupsQuery.isLoading ? (
        <div className="card card-pad text-sm text-ink-muted" role="status">
          Loading groups…
        </div>
      ) : null}
      {groupsQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 sm:p-4" role="alert">
          Unable to load groups.
        </div>
      ) : null}

      {!groupsQuery.isLoading && !groupsQuery.isError ? (
        <GroupManager
          groups={groupsQuery.data ?? []}
          isReadonly={isReadonly}
          isMutating={toggleMutation.isPending}
          onEdit={setEditing}
          onToggle={(group) => toggleMutation.mutate(group)}
          onAdd={openCreate}
        />
      ) : null}

      {editing !== undefined && !isReadonly ? (
        <CategoryModal
          category={editing}
          entityLabel="Group"
          isSaving={saveMutation.isPending}
          onClose={() => setEditing(undefined)}
          onSave={(name) => saveMutation.mutate({ id: editing?.id, name })}
        />
      ) : null}
    </div>
  );
};
