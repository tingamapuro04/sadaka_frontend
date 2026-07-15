import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';
import { apiClient } from '../../lib/axios';
import type {
  AdminChurch,
  AdminDashboard,
  AdminListItem,
  AuditLog,
  AdminLoginChallengeResponse,
  AdminLoginVerifyResponse,
  ReadonlyAdminAccount,
  Withdrawal,
  AdminTransactionsResponse,
  TransactionFiltersState,
  ChurchEvent,
  CreateEventPayload,
  UpdateEventPayload,
  EventsListResponse,
  AdminTransaction
} from './types';

const cleanString = (value: string): string => value.trim().replace(/\s+/g, ' ');

const unwrapList = <T,>(data: T[] | Record<string, unknown>, key: string): T[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data) {
    const nested = (data as Record<string, unknown>).data;
    if (Array.isArray(nested)) return nested as T[];
    if (nested && typeof nested === 'object' && key in nested) {
      const nestedValue = (nested as Record<string, unknown>)[key];
      if (Array.isArray(nestedValue)) return nestedValue as T[];
    }
    if (nested && typeof nested === 'object' && 'auditLogs' in nested) {
      const auditNested = (nested as Record<string, unknown>).auditLogs;
      if (Array.isArray(auditNested)) return auditNested as T[];
      if (auditNested && typeof auditNested === 'object' && 'data' in auditNested) {
        const auditData = (auditNested as Record<string, unknown>).data;
        if (Array.isArray(auditData)) return auditData as T[];
      }
    }
  }
  const value = data[key];
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && 'data' in (value as Record<string, unknown>)) {
    const nestedValue = (value as Record<string, unknown>).data;
    if (Array.isArray(nestedValue)) return nestedValue as T[];
  }
  if ('auditLogs' in data) {
    const auditLogs = (data as Record<string, unknown>).auditLogs;
    if (Array.isArray(auditLogs)) return auditLogs as T[];
    if (auditLogs && typeof auditLogs === 'object' && 'data' in auditLogs) {
      const nestedAuditLogs = (auditLogs as Record<string, unknown>).data;
      if (Array.isArray(nestedAuditLogs)) return nestedAuditLogs as T[];
    }
  }
  return Array.isArray(value) ? (value as T[]) : [];
};

const unwrapObject = <T,>(data: T | Record<string, unknown>, key: string): T => {
  if (data && typeof data === 'object' && key in data) {
    const value = (data as Record<string, T | undefined>)[key];
    if (value !== undefined) return value;
  }
  if (data && typeof data === 'object' && 'data' in data) {
    const nested = (data as Record<string, unknown>).data;
    if (nested && typeof nested === 'object' && key in nested) {
      const value = (nested as Record<string, T | undefined>)[key];
      if (value !== undefined) return value;
    }
  }
  return data as T;
};

const toNumber = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeWithdrawal = (withdrawal: Withdrawal | Record<string, unknown>): Withdrawal => ({
  id: String(withdrawal.id),
  church_id: String(withdrawal.church_id),
  amount: toNumber(withdrawal.amount),
  method: withdrawal.method as Withdrawal['method'],
  withdrawal_number: String(withdrawal.withdrawal_number ?? ''),
  status: withdrawal.status as Withdrawal['status'],
  initiated_by: String(withdrawal.initiated_by ?? ''),
  initiated_at: String(withdrawal.initiated_at ?? ''),
  scheduled_for: String(withdrawal.scheduled_for ?? ''),
  completed_at: (withdrawal.completed_at as string | null | undefined) ?? null,
  notes: (withdrawal.notes as string | null | undefined) ?? null
});

const normalizeAuditLog = (log: AuditLog | Record<string, unknown>): AuditLog => ({
  id: String(log.id),
  action: String(log.action),
  church_id: (log.church_id as string | null | undefined) ?? null,
  actor_id: String(log.actor_id ?? ''),
  actor_role: String(log.actor_role ?? ''),
  metadata: (log.metadata as Record<string, unknown> | null | undefined) ?? null,
  created_at: String(log.created_at ?? '')
});

const normalizeAccount = (account: ReadonlyAdminAccount | Record<string, unknown>): ReadonlyAdminAccount => ({
  id: String(account.id),
  phone: String(account.phone ?? ''),
  role: 'readonly',
  created_at: String(account.created_at ?? '')
});

export const transactionQueryParams = (filters: Partial<TransactionFiltersState>): URLSearchParams => {
  const params = new URLSearchParams();
  const entries: Array<[string, string | number | undefined]> = [
    ['page', filters.page],
    ['status', filters.status],
    ['phone', filters.phone],
    ['mpesa_ref', filters.mpesa_ref],
    ['from', filters.from],
    ['to', filters.to],
    ['category_id', filters.category_id]
  ];

  entries.forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return params;
};

export const adminQueryKeys = {
  dashboard: ['admin', 'dashboard'] as const,
  transactions: (filters: Partial<TransactionFiltersState>) =>
    ['admin', 'transactions', Object.fromEntries(transactionQueryParams(filters))] as const,
  categories: ['admin', 'categories'] as const,
  groups: ['admin', 'groups'] as const,
  events: (params?: { status?: string; page?: number }) =>
    ['admin', 'events', params ?? {}] as const,
  event: (id: string) => ['admin', 'event', id] as const,
  eventTransactions: (id: string, page = 1) =>
    ['admin', 'event-transactions', id, page] as const,
  church: ['admin', 'church'] as const,
  auditLogs: (page = 1) => ['admin', 'audit-logs', page] as const,
  withdrawals: ['admin', 'withdrawals'] as const,
  accounts: ['admin', 'accounts'] as const
};

const normalizeEvent = (event: ChurchEvent | Record<string, unknown>): ChurchEvent => {
  const totals = (event.totals as Record<string, unknown> | undefined) ?? {};
  return {
    id: String(event.id),
    church_id: String(event.church_id ?? ''),
    title: String(event.title ?? ''),
    description: (event.description as string | null | undefined) ?? null,
    slug: String(event.slug ?? ''),
    status: (event.status as ChurchEvent['status']) ?? 'active',
    starts_at: (event.starts_at as string | null | undefined) ?? null,
    ends_at: (event.ends_at as string | null | undefined) ?? null,
    target_amount:
      event.target_amount == null ? null : toNumber(event.target_amount),
    payment_url: String(event.payment_url ?? ''),
    totals: {
      paid_count: toNumber(totals.paid_count),
      paid_gross: toNumber(totals.paid_gross),
      awaiting_count: toNumber(totals.awaiting_count)
    },
    created_at: event.created_at ? String(event.created_at) : undefined,
    updated_at: event.updated_at ? String(event.updated_at) : undefined
  };
};

export const fetchDashboard = async (): Promise<AdminDashboard> => {
  const { data } = await apiClient.get<AdminDashboard>(API_ENDPOINTS.adminDashboard);
  return data;
};

export const fetchTransactions = async (
  filters: Partial<TransactionFiltersState>
): Promise<AdminTransactionsResponse> => {
  const params = transactionQueryParams(filters);
  const { data } = await apiClient.get<AdminTransactionsResponse>(API_ENDPOINTS.adminTransactions, { params });
  return data;
};

export const fetchCategories = async (): Promise<AdminListItem[]> => {
  const { data } = await apiClient.get<AdminListItem[] | { categories: AdminListItem[] }>(
    API_ENDPOINTS.adminCategories
  );
  return unwrapList<AdminListItem>(data, 'categories');
};

export const createCategory = async (name: string): Promise<AdminListItem> => {
  const { data } = await apiClient.post<AdminListItem | { category: AdminListItem }>(API_ENDPOINTS.adminCategories, {
    name: cleanString(name)
  });
  return unwrapObject<AdminListItem>(data, 'category');
};

export const updateCategory = async (
  id: string,
  payload: Partial<Pick<AdminListItem, 'name' | 'is_active'>>
): Promise<AdminListItem> => {
  const body = {
    ...payload,
    name: payload.name === undefined ? undefined : cleanString(payload.name)
  };
  const { data } = await apiClient.patch<AdminListItem | { category: AdminListItem }>(
    API_ENDPOINTS.adminCategory(id),
    body
  );
  return unwrapObject<AdminListItem>(data, 'category');
};

export const fetchGroups = async (): Promise<AdminListItem[]> => {
  try {
    const { data } = await apiClient.get<AdminListItem[] | { groups: AdminListItem[] }>(API_ENDPOINTS.adminGroups);
    return unwrapList<AdminListItem>(data, 'groups');
  } catch (error) {
    if ((error as { status?: number }).status === 404) return [];
    throw error;
  }
};

export const createGroup = async (name: string): Promise<AdminListItem> => {
  const { data } = await apiClient.post<AdminListItem | { group: AdminListItem }>(API_ENDPOINTS.adminGroups, {
    name: cleanString(name)
  });
  return unwrapObject<AdminListItem>(data, 'group');
};

export const updateGroup = async (
  id: string,
  payload: Partial<Pick<AdminListItem, 'name' | 'is_active'>>
): Promise<AdminListItem> => {
  const body = {
    ...payload,
    name: payload.name === undefined ? undefined : cleanString(payload.name),
    active: payload.is_active
  };
  const { data } = await apiClient.patch<AdminListItem | { group: AdminListItem }>(API_ENDPOINTS.adminGroup(id), body);
  return unwrapObject<AdminListItem>(data, 'group');
};

export const fetchEvents = async (params?: {
  status?: string;
  page?: number;
}): Promise<EventsListResponse> => {
  const { data } = await apiClient.get<Record<string, unknown>>(API_ENDPOINTS.adminEvents, {
    params
  });
  const list = unwrapList<ChurchEvent>(data, 'events').map(normalizeEvent);
  return {
    events: list,
    total: toNumber(data.total) || list.length,
    page: toNumber(data.page) || 1
  };
};

export const fetchEvent = async (id: string): Promise<ChurchEvent> => {
  const { data } = await apiClient.get<ChurchEvent | { event: ChurchEvent }>(
    API_ENDPOINTS.adminEvent(id)
  );
  return normalizeEvent(unwrapObject<ChurchEvent>(data, 'event'));
};

export const createEvent = async (payload: CreateEventPayload): Promise<ChurchEvent> => {
  const body: Record<string, unknown> = {
    title: cleanString(payload.title),
    status: payload.status ?? 'active'
  };
  if (payload.description !== undefined) {
    body.description = payload.description ? cleanString(payload.description) : null;
  }
  if (payload.slug?.trim()) {
    body.slug = payload.slug.trim().toLowerCase();
  }
  if (payload.target_amount != null) {
    body.target_amount = payload.target_amount;
  }
  const { data } = await apiClient.post<ChurchEvent | { event: ChurchEvent }>(
    API_ENDPOINTS.adminEvents,
    body
  );
  return normalizeEvent(unwrapObject<ChurchEvent>(data, 'event'));
};

export const updateEvent = async (
  id: string,
  payload: UpdateEventPayload
): Promise<ChurchEvent> => {
  const body: Record<string, unknown> = {};
  if (payload.title !== undefined) body.title = cleanString(payload.title);
  if (payload.description !== undefined) {
    body.description = payload.description ? cleanString(payload.description) : null;
  }
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.target_amount !== undefined) body.target_amount = payload.target_amount;

  const { data } = await apiClient.patch<ChurchEvent | { event: ChurchEvent }>(
    API_ENDPOINTS.adminEvent(id),
    body
  );
  return normalizeEvent(unwrapObject<ChurchEvent>(data, 'event'));
};

export const fetchEventTransactions = async (
  eventId: string,
  page = 1
): Promise<AdminTransactionsResponse> => {
  const { data } = await apiClient.get<AdminTransactionsResponse>(
    API_ENDPOINTS.adminEventTransactions(eventId),
    { params: { page } }
  );
  return {
    total: toNumber(data.total),
    page: toNumber(data.page) || page,
    transactions: (data.transactions ?? []).map((tx) => ({
      id: String(tx.id),
      church_id: String(tx.church_id),
      group_id: tx.group_id ?? null,
      payer_name: tx.payer_name ?? null,
      payer_phone: String(tx.payer_phone ?? ''),
      gross_amount: toNumber(tx.gross_amount),
      fee: toNumber(tx.fee),
      total_amount: toNumber(tx.total_amount),
      status: tx.status,
      mpesa_ref: tx.mpesa_ref ?? null,
      created_at: String(tx.created_at ?? '')
    })) as AdminTransaction[]
  };
};

export const fetchChurch = async (): Promise<AdminChurch> => {
  const { data } = await apiClient.get<AdminChurch | { church: AdminChurch }>(API_ENDPOINTS.adminChurch);
  return unwrapObject<AdminChurch>(data, 'church');
};

export const startChurchLogin = async (payload: {
  phone: string;
  password: string;
}): Promise<AdminLoginChallengeResponse | AdminLoginVerifyResponse> => {
  const { data } = await apiClient.post<AdminLoginChallengeResponse | AdminLoginVerifyResponse>(
    API_ENDPOINTS.churchLogin,
    payload
  );
  return data;
};

export const requestChurchLoginOtp = async (payload: {
  phone: string;
  password: string;
}): Promise<AdminLoginChallengeResponse> => {
  const { data } = await apiClient.post<AdminLoginChallengeResponse>(API_ENDPOINTS.churchOtpRequest, payload);
  return data;
};

export const verifyChurchLogin = async (payload: {
  challenge_id: string;
  code: string;
}): Promise<AdminLoginVerifyResponse> => {
  const { data } = await apiClient.post<AdminLoginVerifyResponse>(API_ENDPOINTS.churchLoginVerify, payload);
  return data;
};

export const updateChurch = async (
  payload: Partial<Pick<AdminChurch, 'name' | 'phone' | 'email' | 'withdrawal_method' | 'withdrawal_number'>>
): Promise<AdminChurch> => {
  const body = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, typeof value === 'string' ? cleanString(value) : value])
  );
  const { data } = await apiClient.patch<AdminChurch | { church: AdminChurch }>(API_ENDPOINTS.adminChurch, body);
  return unwrapObject<AdminChurch>(data, 'church');
};

export const updateGroupsEnabled = async (groupsEnabled: boolean): Promise<{ groups_enabled: boolean }> => {
  const { data } = await apiClient.patch<{ groups_enabled: boolean } | { church: AdminChurch }>(API_ENDPOINTS.adminChurchGroups, {
    groups_enabled: groupsEnabled
  });
  if ('church' in data) {
    return { groups_enabled: data.church.groups_enabled };
  }
  return data;
};

export const uploadChurchLogo = async (logo: File): Promise<{ logo_url: string }> => {
  const formData = new FormData();
  formData.append('logo', logo);
  const { data } = await apiClient.post<{ logo_url: string } | { church: AdminChurch }>(
    API_ENDPOINTS.adminChurchLogo,
    formData,
    {
    headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  if ('church' in data) {
    return { logo_url: data.church.logo_url ?? '' };
  }
  return data;
};

export const changeChurchPassword = async (payload: {
  current_password: string;
  password: string;
}): Promise<void> => {
  await apiClient.patch(API_ENDPOINTS.adminChurchPassword, payload);
};

export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  const { data } = await apiClient.get<AuditLog[] | { logs: AuditLog[] }>(API_ENDPOINTS.adminAuditLogs);
  return unwrapList<AuditLog>(data, 'logs').map(normalizeAuditLog);
};

export const fetchAuditLogPage = async (page = 1): Promise<{ logs: AuditLog[]; page: number }> => {
  const { data } = await apiClient.get<{ logs: AuditLog[]; page: number }>(API_ENDPOINTS.adminAuditLogs, {
    params: { page }
  });
  return {
    logs: unwrapList<AuditLog>(data, 'logs').map(normalizeAuditLog),
    page: data.page ?? page
  };
};

export const fetchWithdrawals = async (): Promise<Withdrawal[]> => {
  const { data } = await apiClient.get<Withdrawal[] | { withdrawals: Withdrawal[] }>(API_ENDPOINTS.adminWithdrawals);
  return unwrapList<Withdrawal>(data, 'withdrawals').map(normalizeWithdrawal);
};

export type WithdrawalOtpChallenge = {
  otp_required: true;
  challenge_id: string;
  expires_at: string;
  delivery_channel: 'sms';
  masked_phone: string;
};

export type WithdrawalOtpRequestResponse =
  | { otp_required: false }
  | WithdrawalOtpChallenge;

export const requestWithdrawalOtp = async (payload: {
  amount: number;
  password: string;
}): Promise<WithdrawalOtpRequestResponse> => {
  const { data } = await apiClient.post<WithdrawalOtpRequestResponse>(
    API_ENDPOINTS.adminWithdrawalOtpRequest,
    payload
  );
  return data;
};

export const createWithdrawal = async (payload: {
  amount: number;
  password: string;
  scheduled_for?: string;
  challenge_id?: string;
  code?: string;
}): Promise<Withdrawal> => {
  const body: Record<string, unknown> = {
    amount: payload.amount,
    password: payload.password
  };
  if (payload.challenge_id) body.challenge_id = payload.challenge_id;
  if (payload.code) body.code = payload.code;

  const { data } = await apiClient.post<Withdrawal | { withdrawal: Withdrawal }>(
    API_ENDPOINTS.adminWithdrawals,
    body
  );
  return normalizeWithdrawal(unwrapObject<Withdrawal>(data, 'withdrawal'));
};

export const cancelWithdrawal = async (id: string): Promise<Withdrawal> => {
  const { data } = await apiClient.post<Withdrawal | { withdrawal: Withdrawal }>(
    API_ENDPOINTS.adminWithdrawalCancel(id)
  );
  return normalizeWithdrawal(unwrapObject<Withdrawal>(data, 'withdrawal'));
};

export const retryWithdrawal = async (id: string): Promise<Withdrawal> => {
  const { data } = await apiClient.post<Withdrawal | { withdrawal: Withdrawal }>(
    API_ENDPOINTS.adminWithdrawalRetry(id)
  );
  return normalizeWithdrawal(unwrapObject<Withdrawal>(data, 'withdrawal'));
};

export const fetchAccounts = async (): Promise<ReadonlyAdminAccount[]> => {
  const { data } = await apiClient.get<ReadonlyAdminAccount[] | { accounts: ReadonlyAdminAccount[] }>(
    API_ENDPOINTS.adminAccounts
  );
  return unwrapList<ReadonlyAdminAccount>(data, 'accounts').map(normalizeAccount);
};

export const createAccount = async (payload: { phone: string; password: string }): Promise<ReadonlyAdminAccount> => {
  const { data } = await apiClient.post<ReadonlyAdminAccount | { account: ReadonlyAdminAccount }>(
    API_ENDPOINTS.adminAccounts,
    payload
  );
  return normalizeAccount(unwrapObject<ReadonlyAdminAccount>(data, 'account'));
};

export const deleteAccount = async (id: string): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.adminAccount(id));
};

export const transactionExportUrl = (filters: Partial<TransactionFiltersState>): string => {
  const params = transactionQueryParams(filters);
  const query = params.toString();
  return `${API_BASE_URL}${API_ENDPOINTS.adminTransactionsExport}${query ? `?${query}` : ''}`;
};
