import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { PhoneInput } from '../../../components/shared/PhoneInput';
import { Button, Card, Input, PageHeader, Select, useToast } from '../../../components/ui';
import { formatDate } from '../../../utils/formatters';
import {
  adminQueryKeys,
  changeChurchPassword,
  fetchAuditLogs,
  fetchChurch,
  updateChurch,
  uploadChurchLogo
} from '../api';
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
  const toast = useToast();
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
      toast.success('Church settings saved');
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.church });
    },
    onError: (err) => {
      toast.error((err as { message?: string }).message ?? 'Unable to save settings');
    }
  });

  const logoMutation = useMutation({
    mutationFn: uploadChurchLogo,
    onSuccess: () => {
      setMessage('Logo updated.');
      toast.success('Logo updated');
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.church });
    },
    onError: (err) => {
      toast.error((err as { message?: string }).message ?? 'Unable to upload logo');
    }
  });

  const passwordMutation = useMutation({
    mutationFn: changeChurchPassword,
    onSuccess: () => {
      setMessage('Password changed.');
      toast.success('Password changed');
      setPasswords({ current_password: '', password: '' });
    },
    onError: (err) => {
      toast.error((err as { message?: string }).message ?? 'Unable to change password');
    },
    onSettled: () => {
      setPasswords({ current_password: '', password: '' });
    }
  });

  const paymentUrl = churchQuery.data?.payment_url?.trim() || '';
  const username = churchQuery.data?.username?.trim() || '';

  const copyPaymentLink = async () => {
    if (!paymentUrl) return;
    try {
      await navigator.clipboard.writeText(paymentUrl);
      toast.success('Payment link copied');
    } catch {
      window.prompt('Copy payment link:', paymentUrl);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in sm:space-y-5">
      <PageHeader
        title="Church settings"
        description="Profile, payout destination, logo, and password."
      />

      {message ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-3 text-sm text-brand-900 sm:p-3">
          {message}
        </div>
      ) : null}
      {churchQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700" role="alert">
          Unable to load church settings.
        </div>
      ) : null}
      {churchQuery.isLoading ? (
        <div className="card card-pad text-sm text-ink-muted" role="status">
          Loading church settings…
        </div>
      ) : null}

      {paymentUrl ? (
        <Card className="border-brand-100 bg-gradient-to-br from-white via-white to-brand-50/40">
          <div className="flex flex-col gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-2xs font-semibold uppercase tracking-wider text-brand-700">
                  Public payment link
                </p>
                {username ? (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-2xs font-medium text-brand-800">
                    @{username}
                  </span>
                ) : null}
              </div>
              <a
                href={paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 block truncate text-sm font-medium text-brand-700 hover:underline"
                title={paymentUrl}
              >
                {paymentUrl}
              </a>
            </div>
            <div className="mobile-actions sm:flex-row sm:justify-start">
              <Button type="button" onClick={() => void copyPaymentLink()}>
                Copy link
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => window.open(paymentUrl, '_blank', 'noopener,noreferrer')}
              >
                Open link
              </Button>
            </div>
          </div>
        </Card>
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
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-ink sm:text-base">Profile</h2>
          <p className="mt-0.5 text-xs text-ink-muted">Church contact and payout destination.</p>
        </div>
        <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2">
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
          <Button type="submit" fullWidth className="mt-4 sm:!w-auto" loading={profileMutation.isPending}>
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
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-ink sm:text-base">Change password</h2>
            <p className="mt-0.5 text-xs text-ink-muted">Use at least 8 characters for the new password.</p>
          </div>
          <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2">
            <Input
              label="Current password"
              type="password"
              value={passwords.current_password}
              onChange={(event) => setPasswords({ ...passwords, current_password: event.target.value })}
              autoComplete="current-password"
            />
            <Input
              label="New password"
              type="password"
              value={passwords.password}
              onChange={(event) => setPasswords({ ...passwords, password: event.target.value })}
              autoComplete="new-password"
            />
          </div>
          <Button
            type="submit"
            fullWidth
            className="mt-4 sm:!w-auto"
            loading={passwordMutation.isPending}
            disabled={passwords.current_password.length === 0 || passwords.password.length < 8}
          >
            Change password
          </Button>
        </form>
      ) : null}

      <Card padded={false}>
        <div className="border-b border-slate-100 px-3.5 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-ink sm:text-base">Recent audit activity</h2>
          <p className="mt-0.5 text-xs text-ink-muted">Latest actions on this church account.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {auditLogs.slice(0, 8).map((log) => (
            <div key={log.id} className="px-3.5 py-3 text-sm sm:px-5">
              <p className="font-medium text-ink">{log.action}</p>
              <p className="mt-0.5 text-xs text-ink-muted sm:text-sm">
                <span className="capitalize">{log.actor_role.replace(/_/g, ' ')}</span>
                <span className="mx-1 text-slate-300">·</span>
                {formatDate(log.created_at)}
              </p>
            </div>
          ))}
          {auditLogs.length === 0 ? (
            <p className="px-3.5 py-4 text-sm text-ink-muted sm:px-5">No audit activity yet.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
};
