import { API_ENDPOINTS } from '../../config/api.config';
import { sadakaApiClient } from '../../lib/sadaka-axios';
import type {
  SadakaAuditLog,
  SadakaChurchDetail,
  SadakaChurchSummary,
  SadakaDashboard,
  SadakaLoginChallengeResponse,
  SadakaLoginVerifyResponse,
  SadakaLoginResponse,
  SadakaWithdrawal
} from './types';

const toNumber = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toString = (value: unknown, fallback = ''): string => String(value ?? fallback);

const unwrapList = <T,>(data: unknown, ...keys: string[]): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(record[key])) return record[key] as T[];
      if (record.data && typeof record.data === 'object') {
        const nested = record.data as Record<string, unknown>;
        if (Array.isArray(nested[key])) return nested[key] as T[];
        if (Array.isArray(nested.data)) return nested.data as T[];
      }
    }
  }
  return [];
};

const normalizeChurch = (church: SadakaChurchSummary | Record<string, unknown>): SadakaChurchSummary => {
  const record = church as Record<string, unknown>;
  return {
    id: toString(record.id),
    name: toString(record.name),
    username: toString(record.username),
    available_balance: toNumber(record.available_balance),
    total_volume: toNumber(record.total_volume ?? record.total_paid ?? record.total_amount)
  };
};

const normalizeChurchDetail = (church: SadakaChurchDetail | Record<string, unknown>): SadakaChurchDetail => {
  const record = church as Record<string, unknown>;
  return {
    id: toString(record.id),
    name: toString(record.name),
    username: toString(record.username),
    phone: toString(record.phone),
    email: (record.email as string | null | undefined) ?? null,
    logo_url: (record.logo_url as string | null | undefined) ?? null,
    groups_enabled: Boolean(record.groups_enabled),
    withdrawal_method: (record.withdrawal_method as SadakaChurchDetail['withdrawal_method']) ?? 'phone',
    withdrawal_number: toString(record.withdrawal_number),
    payment_url: toString(record.payment_url),
    available_balance: toNumber(record.available_balance),
    total_volume: toNumber(record.total_volume ?? record.total_paid ?? record.total_amount),
    total_fees_collected: toNumber(record.total_fees_collected ?? record.total_fees ?? record.fees_collected),
    transaction_summary: record.transaction_summary
      ? {
          total_transactions: toNumber((record.transaction_summary as Record<string, unknown>).total_transactions),
          paid_transactions: toNumber((record.transaction_summary as Record<string, unknown>).paid_transactions),
          failed_transactions: toNumber((record.transaction_summary as Record<string, unknown>).failed_transactions)
        }
      : undefined,
    withdrawal_summary: record.withdrawal_summary
      ? {
          total_withdrawals: toNumber((record.withdrawal_summary as Record<string, unknown>).total_withdrawals),
          completed_withdrawals: toNumber((record.withdrawal_summary as Record<string, unknown>).completed_withdrawals),
          failed_withdrawals: toNumber((record.withdrawal_summary as Record<string, unknown>).failed_withdrawals),
          pending_withdrawals: toNumber((record.withdrawal_summary as Record<string, unknown>).pending_withdrawals)
        }
      : undefined
  };
};

const normalizeWithdrawal = (withdrawal: SadakaWithdrawal | Record<string, unknown>): SadakaWithdrawal => ({
  id: toString(withdrawal.id),
  church_id: toString(withdrawal.church_id),
  church_name: toString(withdrawal.church_name),
  amount: toNumber(withdrawal.amount),
  status: withdrawal.status as SadakaWithdrawal['status'],
  scheduled_for: toString(withdrawal.scheduled_for),
  created_at: toString(withdrawal.created_at)
});

const normalizeAuditLog = (log: SadakaAuditLog | Record<string, unknown>): SadakaAuditLog => ({
  id: toString(log.id),
  church_id: (log.church_id as string | null | undefined) ?? null,
  church_name: (log.church_name as string | null | undefined) ?? null,
  action: toString(log.action),
  actor: toString(log.actor),
  details: (log.details as Record<string, unknown> | null | undefined) ?? null,
  created_at: toString(log.created_at)
});

export const sadakaQueryKeys = {
  dashboard: ['sadaka', 'dashboard'] as const,
  churches: ['sadaka', 'churches'] as const,
  church: (id: string) => ['sadaka', 'church', id] as const,
  withdrawals: ['sadaka', 'withdrawals'] as const,
  auditLogs: ['sadaka', 'audit-logs'] as const
};

export const startSadakaLogin = async (
  payload: { phone: string; password: string }
): Promise<SadakaLoginResponse | SadakaLoginChallengeResponse> => {
  const { data } = await sadakaApiClient.post<SadakaLoginResponse | SadakaLoginChallengeResponse>(
    API_ENDPOINTS.sadakaLogin,
    payload
  );
  return data;
};

export const sadakaLogin = startSadakaLogin;

export const requestSadakaLoginOtp = async (payload: {
  phone: string;
  password: string;
}): Promise<SadakaLoginChallengeResponse> => {
  const { data } = await sadakaApiClient.post<SadakaLoginChallengeResponse>(
    API_ENDPOINTS.sadakaOtpRequest,
    payload
  );
  return data;
};

export const verifySadakaLogin = async (payload: {
  challenge_id: string;
  code: string;
}): Promise<SadakaLoginVerifyResponse> => {
  const { data } = await sadakaApiClient.post<SadakaLoginVerifyResponse>(API_ENDPOINTS.sadakaLoginVerify, payload);
  return data;
};

export const fetchSadakaDashboard = async (): Promise<SadakaDashboard> => {
  const { data } = await sadakaApiClient.get<SadakaDashboard>(API_ENDPOINTS.sadakaDashboard);
  return data;
};

export const fetchSadakaChurches = async (): Promise<SadakaChurchSummary[]> => {
  const { data } = await sadakaApiClient.get<SadakaChurchSummary[] | { churches: SadakaChurchSummary[] }>(
    API_ENDPOINTS.sadakaChurches
  );
  return unwrapList<SadakaChurchSummary>(data, 'churches').map(normalizeChurch);
};

export const fetchSadakaChurch = async (id: string): Promise<SadakaChurchDetail> => {
  const { data } = await sadakaApiClient.get<SadakaChurchDetail | { church: SadakaChurchDetail }>(
    API_ENDPOINTS.sadakaChurch(id)
  );
  if (data && typeof data === 'object' && 'church' in data) {
    return normalizeChurchDetail((data as { church: SadakaChurchDetail }).church);
  }
  return normalizeChurchDetail(data as SadakaChurchDetail);
};

export const fetchSadakaWithdrawals = async (): Promise<SadakaWithdrawal[]> => {
  const { data } = await sadakaApiClient.get<SadakaWithdrawal[] | { withdrawals: SadakaWithdrawal[] }>(
    API_ENDPOINTS.sadakaWithdrawals
  );
  return unwrapList<SadakaWithdrawal>(data, 'withdrawals').map(normalizeWithdrawal);
};

export const retrySadakaWithdrawal = async (id: string): Promise<{ id: string; status: string }> => {
  const { data } = await sadakaApiClient.post<{ id: string; status: string }>(API_ENDPOINTS.sadakaWithdrawalRetry(id));
  return data;
};

export const cancelSadakaWithdrawal = async (id: string): Promise<{ id: string; status: string }> => {
  const { data } = await sadakaApiClient.post<{ id: string; status: string }>(API_ENDPOINTS.sadakaWithdrawalCancel(id));
  return data;
};

export const fetchSadakaAuditLogs = async (): Promise<SadakaAuditLog[]> => {
  const { data } = await sadakaApiClient.get<SadakaAuditLog[] | { logs: SadakaAuditLog[] }>(API_ENDPOINTS.sadakaAuditLogs);
  return unwrapList<SadakaAuditLog>(data, 'logs', 'audit_logs').map(normalizeAuditLog);
};
