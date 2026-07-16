import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, PageHeader } from '../../../components/ui';
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
  const [editing, setEditing] = useState<AdminListItem | null | undefined>(undefined);
  const groupsQuery = useQuery({ queryKey: adminQueryKeys.groups, queryFn: fetchGroups });
  const churchQuery = useQuery({ queryKey: adminQueryKeys.church, queryFn: fetchChurch });

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string; name: string }) =>
      payload.id ? updateGroup(payload.id, { name: payload.name }) : createGroup(payload.name),
    onSuccess: () => {
      setEditing(undefined);
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.groups });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
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
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.groups });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
    }
  });

  const groupsEnabledMutation = useMutation({
    mutationFn: updateGroupsEnabled,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.church });
    }
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Groups"
        description="Organize giving by congregation or ministry group."
        actions={
          !isReadonly ? (
            <Button onClick={() => setEditing(null)}>Add group</Button>
          ) : undefined
        }
      />

      {!isReadonly ? (
        <div className="card card-pad flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-ink">Group selector on payment page</p>
            <p className="text-sm text-ink-muted">Turn this on when contributors should choose a group.</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(churchQuery.data?.groups_enabled)}
              disabled={groupsEnabledMutation.isPending || churchQuery.isLoading}
              onChange={(event) => groupsEnabledMutation.mutate(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Enabled
          </label>
        </div>
      ) : null}

      {groupsQuery.isLoading ? <div className="card card-pad text-sm text-ink-muted">Loading groups...</div> : null}
      {groupsQuery.isError ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load groups.</div> : null}
      <GroupManager
        groups={groupsQuery.data ?? []}
        isReadonly={isReadonly}
        isMutating={toggleMutation.isPending}
        onEdit={setEditing}
        onToggle={(group) => toggleMutation.mutate(group)}
      />

      {editing !== undefined && !isReadonly ? (
        <CategoryModal
          category={editing}
          isSaving={saveMutation.isPending}
          onClose={() => setEditing(undefined)}
          onSave={(name) => saveMutation.mutate({ id: editing?.id, name })}
        />
      ) : null}
    </div>
  );
};

