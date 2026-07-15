import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { adminQueryKeys, changeChurchPassword, fetchAuditLogs, fetchChurch, updateChurch, uploadChurchLogo } from '../api';
import type { AdminChurch } from '../types';
import { LogoUpload } from './logo-upload';

const emptyProfile = {
  name: '',
  phone: '',
  email: '',
  withdrawal_method: 'phone' as AdminChurch['withdrawal_method'],
  withdrawal_number: ''
};

export const AdminChurchSettingsPage = () => {
  const { role } = useAuth();
  const isReadonly = role === 'readonly';
  const queryClient = useQueryClient();
  const churchQuery = useQuery({ queryKey: adminQueryKeys.church, queryFn: fetchChurch });
  const auditQuery = useQuery({ queryKey: adminQueryKeys.auditLogs(), queryFn: fetchAuditLogs });
  const auditLogs = Array.isArray(auditQuery.data) ? auditQuery.data : [];
  const [profile, setProfile] = useState(emptyProfile);
  const [passwords, setPasswords] = useState({ current_password: '', password: '' });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (churchQuery.data) {
      setProfile({
        name: churchQuery.data.name,
        phone: churchQuery.data.phone,
        email: churchQuery.data.email ?? '',
        withdrawal_method: churchQuery.data.withdrawal_method,
        withdrawal_number: churchQuery.data.withdrawal_number
      });
    }
  }, [churchQuery.data]);

  const profileMutation = useMutation({
    mutationFn: updateChurch,
    onSuccess: () => {
      setMessage('Church settings saved.');
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.church });
    }
  });

  const logoMutation = useMutation({
    mutationFn: uploadChurchLogo,
    onSuccess: () => {
      setMessage('Logo updated.');
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.church });
    }
  });

  const passwordMutation = useMutation({
    mutationFn: changeChurchPassword,
    onSuccess: () => {
      setMessage('Password changed.');
      setPasswords({ current_password: '', password: '' });
    },
    onSettled: () => {
      setPasswords({ current_password: '', password: '' });
    }
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Church settings</h1>
        <p className="mt-1 text-sm text-slate-600">Profile, withdrawal details, logo, and account password.</p>
      </div>

      {message ? <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}
      {churchQuery.isError ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">Unable to load church settings.</div> : null}

      <form
        className="rounded border border-slate-200 bg-white p-4 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          if (!isReadonly) {
            profileMutation.mutate(profile);
          }
        }}
      >
        <h2 className="text-base font-semibold text-slate-950">Profile</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Name</span>
            <input disabled={isReadonly} value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-50" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Phone</span>
            <input disabled={isReadonly} value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-50" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Email</span>
            <input disabled={isReadonly} value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-50" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-slate-700">Withdrawal method</span>
            <select disabled={isReadonly} value={profile.withdrawal_method} onChange={(event) => setProfile({ ...profile, withdrawal_method: event.target.value as AdminChurch['withdrawal_method'] })} className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-50">
              <option value="phone">Phone</option>
              <option value="till">Till</option>
              <option value="paybill">Paybill</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">Withdrawal number</span>
            <input disabled={isReadonly} value={profile.withdrawal_number} onChange={(event) => setProfile({ ...profile, withdrawal_number: event.target.value })} className="w-full rounded border border-slate-300 px-3 py-2 disabled:bg-slate-50" />
          </label>
        </div>
        {!isReadonly ? (
          <button type="submit" disabled={profileMutation.isPending} className="mt-4 rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50">
            {profileMutation.isPending ? 'Saving...' : 'Save settings'}
          </button>
        ) : null}
      </form>

      <LogoUpload
        disabled={isReadonly}
        isUploading={logoMutation.isPending}
        logoUrl={churchQuery.data?.logo_url}
        onUpload={(file) => logoMutation.mutate(file)}
      />

      {!isReadonly ? (
        <form
          className="rounded border border-slate-200 bg-white p-4 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            passwordMutation.mutate(passwords);
          }}
        >
          <h2 className="text-base font-semibold text-slate-950">Change password</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Current password</span>
              <input type="password" value={passwords.current_password} onChange={(event) => setPasswords({ ...passwords, current_password: event.target.value })} className="w-full rounded border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">New password</span>
              <input type="password" value={passwords.password} onChange={(event) => setPasswords({ ...passwords, password: event.target.value })} className="w-full rounded border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <button type="submit" disabled={passwordMutation.isPending || passwords.current_password.length === 0 || passwords.password.length < 8} className="mt-4 rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50">
            {passwordMutation.isPending ? 'Changing...' : 'Change password'}
          </button>
        </form>
      ) : null}

      <section className="rounded border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Recent audit activity</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {auditLogs.slice(0, 8).map((log) => (
            <div key={log.id} className="py-3 text-sm">
              <p className="font-medium text-slate-800">{log.action}</p>
              <p className="text-slate-500">
                {log.actor_role} · {log.actor_id} · {new Date(log.created_at).toLocaleString('en-KE')}
              </p>
            </div>
          ))}
          {auditLogs.length === 0 ? <p className="text-sm text-slate-500">No audit activity yet.</p> : null}
        </div>
      </section>
    </div>
  );
};
