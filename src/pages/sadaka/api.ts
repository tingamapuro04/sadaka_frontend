import { API_ENDPOINTS } from '../../config/api.config';
import { sadakaApiClient } from '../../lib/sadaka-axios';
import type {
  SadakaAuditLog,
  SadakaAuditLogsPage,
  SadakaChurchDetail,
  SadakaChurchSummary,
  SadakaChurchesPage,
  SadakaDashboard,
  SadakaLoginChallengeResponse,
  SadakaLoginVerifyResponse,
  SadakaLoginResponse,
  SadakaTransaction,
  SadakaTransactionsPage,
  SadakaWithdrawal,
  SadakaWithdrawalsPage
} from './types';

export type ListParams = Record<string, string | number | undefined | null>;

const toQuery = (params?: ListParams): string => {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

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
    total_volume: toNumber(record.total_volume ?? record.total_paid ?? record.total_amount),
    suspended: Boolean(record.suspended ?? record.suspended_at),
    suspended_at: (record.suspended_at as string | null | undefined) ?? null
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
      : undefined,
    suspended: Boolean(record.suspended ?? record.suspended_at),
    suspended_at: (record.suspended_at as string | null | undefined) ?? null
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
  churches: (params?: ListParams) => ['sadaka', 'churches', params ?? {}] as const,
  church: (id: string) => ['sadaka', 'church', id] as const,
  withdrawals: (params?: ListParams) => ['sadaka', 'withdrawals', params ?? {}] as const,
  auditLogs: (params?: ListParams) => ['sadaka', 'audit-logs', params ?? {}] as const,
  transactions: (params?: ListParams) => ['sadaka', 'transactions', params ?? {}] as const
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

export const fetchSadakaChurches = async (params?: ListParams): Promise<SadakaChurchesPage> => {
  const { data } = await sadakaApiClient.get<
    SadakaChurchSummary[] | { churches: SadakaChurchSummary[]; total?: number; page?: number; page_size?: number; has_more?: boolean }
  >(`${API_ENDPOINTS.sadakaChurches}${toQuery(params)}`);

  const churches = unwrapList<SadakaChurchSummary>(data, 'churches').map(normalizeChurch);
  const record = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  return {
    churches,
    total: toNumber(record.total ?? churches.length),
    page: toNumber(record.page ?? 1),
    page_size: toNumber(record.page_size ?? (churches.length || 20)),
    has_more: Boolean(record.has_more)
  };
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

export const fetchSadakaWithdrawals = async (params?: ListParams): Promise<SadakaWithdrawalsPage> => {
  const { data } = await sadakaApiClient.get<
    SadakaWithdrawal[] | { withdrawals: SadakaWithdrawal[]; total?: number; page?: number; page_size?: number; has_more?: boolean }
  >(`${API_ENDPOINTS.sadakaWithdrawals}${toQuery(params)}`);

  const withdrawals = unwrapList<SadakaWithdrawal>(data, 'withdrawals').map(normalizeWithdrawal);
  const record = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  return {
    withdrawals,
    total: toNumber(record.total ?? withdrawals.length),
    page: toNumber(record.page ?? 1),
    page_size: toNumber(record.page_size ?? (withdrawals.length || 20)),
    has_more: Boolean(record.has_more)
  };
};

export const retrySadakaWithdrawal = async (id: string): Promise<{ id: string; status: string }> => {
  const { data } = await sadakaApiClient.post<{ id: string; status: string }>(API_ENDPOINTS.sadakaWithdrawalRetry(id));
  return data;
};

export const cancelSadakaWithdrawal = async (id: string): Promise<{ id: string; status: string }> => {
  const { data } = await sadakaApiClient.post<{ id: string; status: string }>(API_ENDPOINTS.sadakaWithdrawalCancel(id));
  return data;
};

export const fetchSadakaAuditLogs = async (params?: ListParams): Promise<SadakaAuditLogsPage> => {
  const { data } = await sadakaApiClient.get<
    SadakaAuditLog[] | { logs: SadakaAuditLog[]; total?: number; page?: number; page_size?: number; has_more?: boolean }
  >(`${API_ENDPOINTS.sadakaAuditLogs}${toQuery(params)}`);

  const logs = unwrapList<SadakaAuditLog>(data, 'logs', 'audit_logs').map(normalizeAuditLog);
  const record = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  return {
    logs,
    total: toNumber(record.total ?? logs.length),
    page: toNumber(record.page ?? 1),
    page_size: toNumber(record.page_size ?? (logs.length || 50)),
    has_more: Boolean(record.has_more)
  };
};

const normalizeTransaction = (tx: SadakaTransaction | Record<string, unknown>): SadakaTransaction => {
  const record = tx as Record<string, unknown>;
  return {
    id: toString(record.id),
    church_id: toString(record.church_id),
    church_name: toString(record.church_name),
    status: record.status as SadakaTransaction['status'],
    gross_amount: toNumber(record.gross_amount),
    fee: toNumber(record.fee),
    total_amount: toNumber(record.total_amount),
    payer_phone: toString(record.payer_phone),
    mpesa_ref: (record.mpesa_ref as string | null | undefined) ?? null,
    source: toString(record.source, 'offering'),
    event_id: (record.event_id as string | null | undefined) ?? null,
    created_at: toString(record.created_at),
    paid_at: (record.paid_at as string | null | undefined) ?? null
  };
};

export const fetchSadakaTransactions = async (params?: ListParams): Promise<SadakaTransactionsPage> => {
  const { data } = await sadakaApiClient.get<{
    transactions?: SadakaTransaction[];
    total?: number;
    page?: number;
    page_size?: number;
    has_more?: boolean;
  }>(`${API_ENDPOINTS.sadakaTransactions}${toQuery(params)}`);

  const transactions = unwrapList<SadakaTransaction>(data, 'transactions').map(normalizeTransaction);
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  return {
    transactions,
    total: toNumber(record.total ?? transactions.length),
    page: toNumber(record.page ?? 1),
    page_size: toNumber(record.page_size ?? (transactions.length || 50)),
    has_more: Boolean(record.has_more)
  };
};

export const fetchSadakaChurchTransactions = async (
  churchId: string,
  params?: ListParams
): Promise<SadakaTransactionsPage> => {
  const { data } = await sadakaApiClient.get<{
    transactions?: SadakaTransaction[];
    total?: number;
    page?: number;
    page_size?: number;
    has_more?: boolean;
  }>(`${API_ENDPOINTS.sadakaChurchTransactions(churchId)}${toQuery(params)}`);

  const transactions = unwrapList<SadakaTransaction>(data, 'transactions').map(normalizeTransaction);
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  return {
    transactions,
    total: toNumber(record.total ?? transactions.length),
    page: toNumber(record.page ?? 1),
    page_size: toNumber(record.page_size ?? (transactions.length || 50)),
    has_more: Boolean(record.has_more)
  };
};

export const fetchSadakaChurchWithdrawals = async (
  churchId: string,
  params?: ListParams
): Promise<SadakaWithdrawalsPage> => {
  const { data } = await sadakaApiClient.get(
    `${API_ENDPOINTS.sadakaChurchWithdrawals(churchId)}${toQuery(params)}`
  );
  const withdrawals = unwrapList<SadakaWithdrawal>(data, 'withdrawals').map(normalizeWithdrawal);
  const record = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  return {
    withdrawals,
    total: toNumber(record.total ?? withdrawals.length),
    page: toNumber(record.page ?? 1),
    page_size: toNumber(record.page_size ?? (withdrawals.length || 20)),
    has_more: Boolean(record.has_more)
  };
};

export const downloadSadakaTransactionsCsv = async (params?: ListParams): Promise<Blob> => {
  const { data } = await sadakaApiClient.get(`${API_ENDPOINTS.sadakaTransactionsExport}${toQuery(params)}`, {
    responseType: 'blob'
  });
  return data as Blob;
};

export const setSadakaChurchSuspended = async (
  id: string,
  suspended: boolean
): Promise<{ id: string; suspended: boolean }> => {
  const { data } = await sadakaApiClient.patch<{ church: { id: string; suspended: boolean } }>(
    API_ENDPOINTS.sadakaChurch(id),
    { suspended }
  );
  return {
    id: data.church?.id ?? id,
    suspended: Boolean(data.church?.suspended)
  };
};
