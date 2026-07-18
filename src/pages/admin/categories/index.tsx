import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { IconFolder } from '../../../components/icons';
import { Button, EmptyState, PageHeader, StatusBadge, useToast } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { adminQueryKeys, createCategory, fetchCategories, updateCategory } from '../api';
import type { AdminListItem } from '../types';
import { CategoryModal } from './CategoryModal';

const toCategoryList = (value: unknown): AdminListItem[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.categories)) {
      return record.categories as AdminListItem[];
    }

    if (record.data && typeof record.data === 'object') {
      const nested = record.data as Record<string, unknown>;
      if (Array.isArray(nested.categories)) {
        return nested.categories as AdminListItem[];
      }
    }
  }

  return [];
};

export const AdminCategoriesPage = () => {
  const { role } = useAuth();
  const isReadonly = role === 'readonly';
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<AdminListItem | null | undefined>(undefined);
  const categoriesQuery = useQuery({ queryKey: adminQueryKeys.categories, queryFn: fetchCategories });

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string; name: string }) =>
      payload.id ? updateCategory(payload.id, { name: payload.name }) : createCategory(payload.name),
    onSuccess: (_data, variables) => {
      setEditing(undefined);
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
      toast.success(variables.id ? 'Category updated' : 'Category created');
    },
    onError: (err) => {
      toast.error((err as { message?: string }).message ?? 'Unable to save category');
    }
  });
  const categories = toCategoryList(categoriesQuery.data);

  const toggleMutation = useMutation({
    mutationFn: (category: AdminListItem) => updateCategory(category.id, { is_active: !category.is_active }),
    onMutate: async (category) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.categories });
      const previous = queryClient.getQueryData<unknown>(adminQueryKeys.categories);
      queryClient.setQueryData(adminQueryKeys.categories, (current) =>
        toCategoryList(current).map((item) =>
          item.id === category.id ? { ...item, is_active: !item.is_active } : item
        )
      );
      return { previous };
    },
    onError: (_error, _category, context) => {
      queryClient.setQueryData(adminQueryKeys.categories, context?.previous);
      toast.error('Unable to update category');
    },
    onSuccess: (_data, category) => {
      toast.success(category.is_active ? 'Category deactivated' : 'Category activated');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard });
    }
  });

  const openCreate = () => setEditing(null);

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-5">
      <PageHeader
        title="Categories"
        description="Payment purposes shown on your public offering page."
        actions={
          !isReadonly ? (
            <Button fullWidth className="sm:!w-auto" onClick={openCreate}>
              Add category
            </Button>
          ) : undefined
        }
      />

      {categoriesQuery.isLoading ? (
        <p className="card card-pad text-sm text-ink-muted" role="status">
          Loading categories…
        </p>
      ) : null}
      {categoriesQuery.isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 sm:p-4" role="alert">
          Unable to load categories.
        </p>
      ) : null}
      {!categoriesQuery.isLoading && !categoriesQuery.isError && categories.length === 0 ? (
        <EmptyState
          icon={<IconFolder className="h-6 w-6" />}
          title="No categories yet"
          description="Categories appear on your public offering page so givers can allocate amounts."
          actionLabel={isReadonly ? undefined : 'Add category'}
          onAction={isReadonly ? undefined : openCreate}
        />
      ) : null}

      {categories.length > 0 ? (
        <ul className="card divide-y divide-slate-100 overflow-hidden">
          {categories.map((category) => (
            <li key={category.id} className="px-3.5 py-3.5 sm:px-5 sm:py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink sm:text-base">{category.name}</p>
                  <div className="mt-1.5">
                    <StatusBadge
                      label={category.is_active ? 'active' : 'inactive'}
                      className="!px-2 !py-0 !text-[0.65rem] sm:!px-2.5 sm:!py-0.5 sm:!text-xs"
                    />
                  </div>
                </div>
              </div>
              {!isReadonly ? (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <Button variant="secondary" size="sm" onClick={() => setEditing(category)}>
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate(category)}
                  >
                    {category.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

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
