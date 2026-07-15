import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { API_TIMEOUT_MS } from '../config/constants';
import type { ApiError } from '../types/api.types';

let tokenProvider: (() => string | null) | null = null;
let onUnauthorized: (() => void) | null = null;

export const registerAuthHandlers = (handlers: {
  getToken: () => string | null;
  handleUnauthorized: () => void;
}): void => {
  tokenProvider = handlers.getToken;
  onUnauthorized = handlers.handleUnauthorized;
};

export const normalizeApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      message?: string;
      error?: string;
      details?: unknown;
    }>;
    const data = axiosError.response?.data;
    return {
      status: axiosError.response?.status ?? 500,
      message: data?.message ?? data?.error ?? axiosError.message,
      details: data?.details
    };
  }

  return {
    status: 500,
    message: 'Unexpected error occurred'
  };
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  withCredentials: true
});

/** Offering + event public pay endpoints — never attach church JWT. */
const isPublicPayRequest = (url?: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url, API_BASE_URL);
    return parsed.pathname.startsWith('/api/pay/');
  } catch {
    return /\/api\/pay\//.test(url);
  }
};

apiClient.interceptors.request.use((config) => {
  const token = tokenProvider?.();
  if (token && !isPublicPayRequest(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Login / OTP endpoints return 401 for bad credentials or codes — not a session expiry. */
const isAuthChallengeRequest = (url?: string): boolean => {
  if (!url) return false;
  try {
    const path = new URL(url, API_BASE_URL).pathname;
    return (
      path === '/api/auth/login' ||
      path === '/api/auth/login/verify' ||
      path === '/api/auth/otp/request' ||
      path === '/api/auth/otp/verify' ||
      path === '/api/churches/register' ||
      path === '/api/churches/register/otp/request' ||
      path === '/api/admin/withdrawals' ||
      path === '/api/admin/withdrawals/otp/request'
    );
  } catch {
    return /\/api\/(auth\/(login|login\/verify|otp\/request|otp\/verify)|churches\/register(\/otp\/request)?|admin\/withdrawals(\/otp\/request)?)$/.test(
      url
    );
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const normalized = normalizeApiError(error);
    const requestUrl = axios.isAxiosError(error) ? error.config?.url : undefined;

    if (
      (normalized.status === 401 || normalized.status === 403) &&
      !isAuthChallengeRequest(requestUrl)
    ) {
      onUnauthorized?.();
      if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login');
      }
    }
    return Promise.reject(normalized);
  }
);
