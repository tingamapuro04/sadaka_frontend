import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RoleBasedGuard } from '../../../components/auth/RoleBasedGuard';
import { PhoneInput } from '../../../components/shared/PhoneInput';
import { Button, EmptyState, PageHeader, StatusBadge, useToast } from '../../../components/ui';
import { IconUser } from '../../../components/icons';
import { formatDate } from '../../../utils/formatters';
import { adminQueryKeys, createAccount, deleteAccount, fetchAccounts } from '../api';

type AccountFormState = {
  phone: string;
  password: string;
};

const initialState: AccountFormState = {
  phone: '',
  password: ''
};

export const AdminAccountsPage = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const accountsQuery = useQuery({
    queryKey: adminQueryKeys.accounts,
    queryFn: fetchAccounts
  });
  const [values, setValues] = useState<AccountFormState>(initialState);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      setValues(initialState);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.accounts });
      toast.success('Readonly account created');
    },
    onError: (err) => {
      const apiError = err as { message?: string };
      const message = apiError.message ?? 'Unable to create account';
      setError(message);
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.accounts });
      toast.success('Account deleted');
    },
    onError: (err) => {
      toast.error((err as { message?: string }).message ?? 'Unable to delete account');
    }
  });

  const accountCount = accountsQuery.data?.length ?? 0;
  const atLimit = accountCount >= 2;
  const canCreate =
    values.phone.trim().length > 0 &&
    values.password.trim().length >= 8 &&
    !createMutation.isPending &&
    !atLimit;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate) return;
    createMutation.mutate(values);
  };

  return (
    <RoleBasedGuard
      allow={['church_super_admin']}
      fallback={
        <div className="card card-pad text-sm text-ink-muted">
          Readonly admin accounts are available to church super admins only.
        </div>
      }
    >
      <div className="space-y-4 animate-fade-in sm:space-y-5">
        <PageHeader
          title="Admin accounts"
          description="Manage readonly church admin accounts (max 2)."
        />

        <section className="card card-pad">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-ink sm:text-base">Create readonly account</h2>
              <p className="mt-0.5 text-xs text-ink-muted sm:text-sm">
                Readonly users can view reports but cannot withdraw or edit settings.
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-2xs font-semibold tabular-nums sm:text-xs ${
                atLimit
                  ? 'bg-amber-100 text-amber-950'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {accountCount}/2
            </span>
          </div>

          <form className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2" onSubmit={submit}>
            <PhoneInput
              label="Phone"
              value={values.phone}
              onChange={(phone) => setValues((current) => ({ ...current, phone }))}
              disabled={createMutation.isPending || atLimit}
              autoComplete="tel"
            />
            <label className="text-sm">
              <span className="mb-1 block field-label">Password</span>
              <input
                type="password"
                value={values.password}
                onChange={(event) =>
                  setValues((current) => ({ ...current, password: event.target.value }))
                }
                className="field-control"
                disabled={createMutation.isPending || atLimit}
                autoComplete="new-password"
                minLength={8}
              />
            </label>
            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2" role="alert">
                {error}
              </p>
            ) : null}
            {atLimit ? (
              <p className="text-xs text-amber-800 sm:col-span-2">
                Limit reached. Delete an account to create another.
              </p>
            ) : null}
            <div className="sm:col-span-2">
              <Button
                type="submit"
                fullWidth
                className="sm:!w-auto"
                disabled={!canCreate}
                loading={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating…' : 'Create account'}
              </Button>
            </div>
          </form>
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 px-3.5 py-3 sm:px-5">
            <h2 className="text-sm font-semibold text-ink sm:text-base">Readonly accounts</h2>
            <p className="mt-0.5 text-xs text-ink-muted">People who can sign in with limited access.</p>
          </div>

          {accountsQuery.isLoading ? (
            <p className="p-3.5 text-sm text-ink-muted sm:p-4" role="status">
              Loading accounts…
            </p>
          ) : null}
          {accountsQuery.isError ? (
            <p className="p-3.5 text-sm text-red-700 sm:p-4" role="alert">
              Unable to load accounts.
            </p>
          ) : null}
          {!accountsQuery.isLoading && !accountsQuery.isError && accountCount === 0 ? (
            <div className="p-3.5 sm:p-4">
              <EmptyState
                icon={<IconUser className="h-6 w-6" />}
                title="No readonly accounts yet"
                description="Create up to two accounts for staff who only need view access."
              />
            </div>
          ) : null}

          <ul className="divide-y divide-slate-100">
            {(accountsQuery.data ?? []).map((account) => (
              <li key={account.id} className="px-3.5 py-3.5 sm:px-5 sm:py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold tabular-nums text-ink sm:text-base">
                      {account.phone}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StatusBadge label="readonly" className="!px-2 !py-0 !text-[0.65rem]" />
                      <span className="text-2xs text-ink-muted sm:text-xs">
                        Created {formatDate(account.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    fullWidth
                    className="sm:!w-auto"
                    disabled={deleteMutation.isPending}
                    loading={deleteMutation.isPending && deleteMutation.variables === account.id}
                    onClick={() => {
                      const confirmed = window.confirm(`Delete readonly account ${account.phone}?`);
                      if (!confirmed) return;
                      deleteMutation.mutate(account.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </RoleBasedGuard>
  );
};
