import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { PhoneInput } from '../../../components/shared/PhoneInput';
import { Button, Card, Input, PageHeader, Select } from '../../../components/ui';
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
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Church settings"
        description="Profile, withdrawal details, logo, and account password."
      />

      {message ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">{message}</div>
      ) : null}
      {churchQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Unable to load church settings.
        </div>
      ) : null}

      <form
        className="card card-pad"
        onSubmit={(event) => {
          event.preventDefault();
          if (!isReadonly) {
            profileMutation.mutate(profile);
          }
        }}
      >
        <h2 className="text-base font-semibold text-ink">Profile</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            label="Name"
            disabled={isReadonly}
            value={profile.name}
            onChange={(event) => setProfile({ ...profile, name: event.target.value })}
          />
          <PhoneInput
            label="Phone"
            value={profile.phone}
            onChange={(phone) => setProfile({ ...profile, phone })}
            disabled={isReadonly}
            autoComplete="tel"
          />
          <Input
            label="Email"
            type="email"
            disabled={isReadonly}
            value={profile.email}
            onChange={(event) => setProfile({ ...profile, email: event.target.value })}
          />
          <Select
            label="Withdrawal method"
            disabled={isReadonly}
            value={profile.withdrawal_method}
            onChange={(event) => {
              const method = event.target.value as AdminChurch['withdrawal_method'];
              setProfile({
                ...profile,
                withdrawal_method: method,
                withdrawal_number: method === profile.withdrawal_method ? profile.withdrawal_number : ''
              });
            }}
          >
            <option value="phone">Phone</option>
            <option value="till">Till</option>
            <option value="paybill">Paybill</option>
          </Select>
          {profile.withdrawal_method === 'phone' ? (
            <div className="sm:col-span-2">
              <PhoneInput
                label="Withdrawal phone number"
                value={profile.withdrawal_number}
                onChange={(phone) => setProfile({ ...profile, withdrawal_number: phone })}
                disabled={isReadonly}
                autoComplete="tel"
              />
            </div>
          ) : (
            <div className="sm:col-span-2">
              <Input
                label={profile.withdrawal_method === 'till' ? 'Till number' : 'Paybill number'}
                disabled={isReadonly}
                inputMode="numeric"
                value={profile.withdrawal_number}
                onChange={(event) =>
                  setProfile({ ...profile, withdrawal_number: event.target.value.replace(/\D/g, '') })
                }
              />
            </div>
          )}
        </div>
        {!isReadonly ? (
          <Button type="submit" className="mt-4" loading={profileMutation.isPending}>
            Save settings
          </Button>
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
          className="card card-pad"
          onSubmit={(event) => {
            event.preventDefault();
            passwordMutation.mutate(passwords);
          }}
        >
          <h2 className="text-base font-semibold text-ink">Change password</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              label="Current password"
              type="password"
              value={passwords.current_password}
              onChange={(event) => setPasswords({ ...passwords, current_password: event.target.value })}
            />
            <Input
              label="New password"
              type="password"
              value={passwords.password}
              onChange={(event) => setPasswords({ ...passwords, password: event.target.value })}
            />
          </div>
          <Button
            type="submit"
            className="mt-4"
            loading={passwordMutation.isPending}
            disabled={passwords.current_password.length === 0 || passwords.password.length < 8}
          >
            Change password
          </Button>
        </form>
      ) : null}

      <Card>
        <h2 className="text-base font-semibold text-ink">Recent audit activity</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {auditLogs.slice(0, 8).map((log) => (
            <div key={log.id} className="py-3 text-sm">
              <p className="font-medium text-ink">{log.action}</p>
              <p className="text-ink-muted">
                {log.actor_role} · {log.actor_id} · {new Date(log.created_at).toLocaleString('en-KE')}
              </p>
            </div>
          ))}
          {auditLogs.length === 0 ? <p className="text-sm text-ink-muted">No audit activity yet.</p> : null}
        </div>
      </Card>
    </div>
  );
};
