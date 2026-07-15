import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { API_TIMEOUT_MS } from '../config/constants';
import { normalizeApiError } from './axios';

let tokenProvider: (() => string | null) | null = null;
let onUnauthorized: (() => void) | null = null;

export const registerSadakaAuthHandlers = (handlers: {
  getToken: () => string | null;
  handleUnauthorized: () => void;
}): void => {
  tokenProvider = handlers.getToken;
  onUnauthorized = handlers.handleUnauthorized;
};

export const sadakaApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  withCredentials: true
});

sadakaApiClient.interceptors.request.use((config) => {
  const token = tokenProvider?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Platform login / OTP failures are not session expiry. */
const isSadakaAuthChallengeRequest = (url?: string): boolean => {
  if (!url) return false;
  try {
    const path = new URL(url, API_BASE_URL).pathname;
    return (
      path === '/api/sadaka/auth/login' ||
      path === '/api/sadaka/auth/login/verify' ||
      path === '/api/sadaka/auth/otp/request' ||
      path === '/api/sadaka/auth/otp/verify'
    );
  } catch {
    return /\/api\/sadaka\/auth\/(login|login\/verify|otp\/request|otp\/verify)/.test(url);
  }
};

sadakaApiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const normalized = normalizeApiError(error);
    const requestUrl = axios.isAxiosError(error) ? error.config?.url : undefined;

    if (
      (normalized.status === 401 || normalized.status === 403) &&
      !isSadakaAuthChallengeRequest(requestUrl)
    ) {
      onUnauthorized?.();
      if (typeof window !== 'undefined' && window.location.pathname !== '/sadaka/login') {
        window.location.assign('/sadaka/login');
      }
    }
    return Promise.reject(normalized);
  }
);
