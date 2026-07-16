import { env } from './env.config';

export const API_BASE_URL = env.VITE_API_BASE_URL;

export const API_ENDPOINTS = {
  payByUsername: (username: string) => `/api/pay/${username}`,
  eventPay: (username: string, eventSlug: string) =>
    `/api/pay/${encodeURIComponent(username)}/events/${encodeURIComponent(eventSlug)}`,
  eventPayTransaction: (username: string, eventSlug: string, transactionId: string) =>
    `/api/pay/${encodeURIComponent(username)}/events/${encodeURIComponent(eventSlug)}/transactions/${encodeURIComponent(transactionId)}`,
  registerChurch: '/api/churches/register',
  registerOtpRequest: '/api/churches/register/otp/request',
  churchLogin: '/api/auth/login',
  churchLoginVerify: '/api/auth/login/verify',
  churchOtpRequest: '/api/auth/otp/request',
  churchOtpVerify: '/api/auth/otp/verify',
  authMe: '/api/auth/me',
  authLogout: '/api/auth/logout',
  usernameAvailability: (username: string) =>
    `/api/churches/availability?username=${encodeURIComponent(username)}`,
  adminDashboard: '/api/admin/dashboard',
  adminTransactions: '/api/admin/transactions',
  adminTransactionsExport: '/api/admin/transactions/export',
  adminCategories: '/api/admin/categories',
  adminCategory: (id: string) => `/api/admin/categories/${encodeURIComponent(id)}`,
  adminGroups: '/api/admin/groups',
  adminGroup: (id: string) => `/api/admin/groups/${encodeURIComponent(id)}`,
  adminEvents: '/api/admin/events',
  adminEvent: (id: string) => `/api/admin/events/${encodeURIComponent(id)}`,
  adminEventTransactions: (id: string) =>
    `/api/admin/events/${encodeURIComponent(id)}/transactions`,
  adminChurch: '/api/admin/church',
  adminChurchGroups: '/api/admin/church/groups',
  adminChurchLogo: '/api/admin/church/logo',
  adminChurchPassword: '/api/admin/church/password',
  adminAuditLogs: '/api/admin/audit-logs',
  adminWithdrawals: '/api/admin/withdrawals',
  adminWithdrawalOtpRequest: '/api/admin/withdrawals/otp/request',
  adminWithdrawal: (id: string) => `/api/admin/withdrawals/${encodeURIComponent(id)}`,
  adminWithdrawalCancel: (id: string) => `/api/admin/withdrawals/${encodeURIComponent(id)}/cancel`,
  adminWithdrawalRetry: (id: string) => `/api/admin/withdrawals/${encodeURIComponent(id)}/retry`,
  payTransaction: (username: string, transactionId: string) =>
    `/api/pay/${encodeURIComponent(username)}/transactions/${encodeURIComponent(transactionId)}`,
  adminAccounts: '/api/admin/accounts',
  adminAccount: (id: string) => `/api/admin/accounts/${encodeURIComponent(id)}`,
  sadakaLogin: '/api/sadaka/auth/login',
  sadakaLoginVerify: '/api/sadaka/auth/login/verify',
  sadakaOtpRequest: '/api/sadaka/auth/otp/request',
  sadakaOtpVerify: '/api/sadaka/auth/otp/verify',
  sadakaLogout: '/api/sadaka/auth/logout',
  sadakaDashboard: '/api/sadaka/dashboard',
  sadakaChurches: '/api/sadaka/churches',
  sadakaChurch: (id: string) => `/api/sadaka/churches/${encodeURIComponent(id)}`,
  sadakaWithdrawals: '/api/sadaka/withdrawals',
  sadakaWithdrawalRetry: (id: string) => `/api/sadaka/withdrawals/${encodeURIComponent(id)}/retry`,
  sadakaWithdrawalCancel: (id: string) => `/api/sadaka/withdrawals/${encodeURIComponent(id)}/cancel`,
  sadakaAuditLogs: '/api/sadaka/audit-logs'
} as const;
