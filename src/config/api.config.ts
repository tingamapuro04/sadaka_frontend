import { env } from './env.config';

export const API_BASE_URL = env.VITE_API_BASE_URL;

/** Canonical API prefix (backend dual-mounts /api and /api/v1). */
export const API_PREFIX = '/api/v1';

const apiPath = (path: string) =>
  `${API_PREFIX}${path.startsWith('/') ? path : `/${path}`}`;

export const API_ENDPOINTS = {
  payByUsername: (username: string) => apiPath(`/pay/${username}`),
  eventPay: (username: string, eventSlug: string) =>
    apiPath(
      `/pay/${encodeURIComponent(username)}/events/${encodeURIComponent(eventSlug)}`,
    ),
  eventPayTransaction: (username: string, eventSlug: string, transactionId: string) =>
    apiPath(
      `/pay/${encodeURIComponent(username)}/events/${encodeURIComponent(eventSlug)}/transactions/${encodeURIComponent(transactionId)}`,
    ),
  registerChurch: apiPath('/churches/register'),
  registerOtpRequest: apiPath('/churches/register/otp/request'),
  churchLogin: apiPath('/auth/login'),
  churchLoginVerify: apiPath('/auth/login/verify'),
  churchOtpRequest: apiPath('/auth/otp/request'),
  churchOtpVerify: apiPath('/auth/otp/verify'),
  authMe: apiPath('/auth/me'),
  authLogout: apiPath('/auth/logout'),
  usernameAvailability: (username: string) =>
    apiPath(`/churches/availability?username=${encodeURIComponent(username)}`),
  publicChurches: apiPath('/churches'),
  adminDashboard: apiPath('/admin/dashboard'),
  adminTransactions: apiPath('/admin/transactions'),
  adminTransactionsExport: apiPath('/admin/transactions/export'),
  adminCategories: apiPath('/admin/categories'),
  adminCategory: (id: string) => apiPath(`/admin/categories/${encodeURIComponent(id)}`),
  adminGroups: apiPath('/admin/groups'),
  adminGroup: (id: string) => apiPath(`/admin/groups/${encodeURIComponent(id)}`),
  adminEvents: apiPath('/admin/events'),
  adminEvent: (id: string) => apiPath(`/admin/events/${encodeURIComponent(id)}`),
  adminEventTransactions: (id: string) =>
    apiPath(`/admin/events/${encodeURIComponent(id)}/transactions`),
  adminChurch: apiPath('/admin/church'),
  adminChurchGroups: apiPath('/admin/church/groups'),
  adminChurchLogo: apiPath('/admin/church/logo'),
  adminChurchPassword: apiPath('/admin/church/password'),
  adminAuditLogs: apiPath('/admin/audit-logs'),
  adminWithdrawals: apiPath('/admin/withdrawals'),
  adminWithdrawalOtpRequest: apiPath('/admin/withdrawals/otp/request'),
  adminWithdrawal: (id: string) => apiPath(`/admin/withdrawals/${encodeURIComponent(id)}`),
  adminWithdrawalCancel: (id: string) =>
    apiPath(`/admin/withdrawals/${encodeURIComponent(id)}/cancel`),
  adminWithdrawalRetry: (id: string) =>
    apiPath(`/admin/withdrawals/${encodeURIComponent(id)}/retry`),
  payTransaction: (username: string, transactionId: string) =>
    apiPath(
      `/pay/${encodeURIComponent(username)}/transactions/${encodeURIComponent(transactionId)}`,
    ),
  adminAccounts: apiPath('/admin/accounts'),
  adminAccount: (id: string) => apiPath(`/admin/accounts/${encodeURIComponent(id)}`),
  sadakaLogin: apiPath('/sadaka/auth/login'),
  sadakaLoginVerify: apiPath('/sadaka/auth/login/verify'),
  sadakaOtpRequest: apiPath('/sadaka/auth/otp/request'),
  sadakaOtpVerify: apiPath('/sadaka/auth/otp/verify'),
  sadakaLogout: apiPath('/sadaka/auth/logout'),
  sadakaDashboard: apiPath('/sadaka/dashboard'),
  sadakaChurches: apiPath('/sadaka/churches'),
  sadakaChurch: (id: string) => apiPath(`/sadaka/churches/${encodeURIComponent(id)}`),
  // PATCH same path with { suspended: boolean }
  sadakaChurchTransactions: (id: string) =>
    apiPath(`/sadaka/churches/${encodeURIComponent(id)}/transactions`),
  sadakaChurchWithdrawals: (id: string) =>
    apiPath(`/sadaka/churches/${encodeURIComponent(id)}/withdrawals`),
  sadakaTransactions: apiPath('/sadaka/transactions'),
  sadakaTransactionsExport: apiPath('/sadaka/transactions/export'),
  sadakaWithdrawals: apiPath('/sadaka/withdrawals'),
  sadakaWithdrawalRetry: (id: string) =>
    apiPath(`/sadaka/withdrawals/${encodeURIComponent(id)}/retry`),
  sadakaWithdrawalCancel: (id: string) =>
    apiPath(`/sadaka/withdrawals/${encodeURIComponent(id)}/cancel`),
  sadakaAuditLogs: apiPath('/sadaka/audit-logs'),
} as const;
