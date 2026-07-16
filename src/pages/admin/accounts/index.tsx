import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RoleBasedGuard } from '../../../components/auth/RoleBasedGuard';
import { PhoneInput } from '../../../components/shared/PhoneInput';
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
    },
    onError: (err) => {
      const apiError = err as { message?: string };
      setError(apiError.message ?? 'Unable to create account');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.accounts });
    }
  });

  const canCreate = values.phone.trim().length > 0 && values.password.trim().length >= 8 && createMutation.isPending === false;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate) return;
    createMutation.mutate(values);
  };

  return (
    <RoleBasedGuard
      allow={['church_super_admin']}
      fallback={
        <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Readonly admin accounts are available to church super admins only.
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <h1 className="page-title">Admin accounts</h1>
          <p className="page-subtitle">Manage readonly church admin accounts.</p>
        </div>

        <section className="card card-pad">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Create readonly account</h2>
              <p className="page-subtitle">You can create up to two readonly accounts.</p>
            </div>
            <span className="rounded bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
              {accountsQuery.data?.length ?? 0}/2 created
            </span>
          </div>

          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
            <PhoneInput
              label="Phone"
              value={values.phone}
              onChange={(phone) => setValues((current) => ({ ...current, phone }))}
              disabled={createMutation.isPending || (accountsQuery.data?.length ?? 0) >= 2}
              autoComplete="tel"
            />
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Password</span>
              <input
                type="password"
                value={values.password}
                onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
                className="w-full rounded border border-slate-300 px-3 py-2"
                disabled={createMutation.isPending || (accountsQuery.data?.length ?? 0) >= 2}
              />
            </label>
            {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={!canCreate || (accountsQuery.data?.length ?? 0) >= 2}
                className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create account'}
              </button>
            </div>
          </form>
        </section>

        <section className="card">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-base font-semibold text-slate-950">Readonly accounts</h2>
          </div>

          {accountsQuery.isLoading ? <p className="p-4 text-sm text-slate-600">Loading accounts...</p> : null}
          {accountsQuery.isError ? <p className="p-4 text-sm text-red-700">Unable to load accounts.</p> : null}
          {!accountsQuery.isLoading && (accountsQuery.data ?? []).length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No readonly accounts yet.</p>
          ) : null}

          <div className="divide-y divide-slate-100">
            {(accountsQuery.data ?? []).map((account) => (
              <div key={account.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-950">{account.phone}</p>
                  <p className="text-sm text-slate-500">Created {new Date(account.created_at).toLocaleString('en-KE')}</p>
                </div>
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    const confirmed = window.confirm(`Delete readonly account ${account.phone}?`);
                    if (!confirmed) return;
                    deleteMutation.mutate(account.id);
                  }}
                  className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </RoleBasedGuard>
  );
};
