import { env } from './env.config';

/** Canonical platform (Sadaka super-admin) login path — not linked from public UI. */
export const PLATFORM_LOGIN_PATH = env.VITE_PLATFORM_LOGIN_PATH;

const ACCESS_STORAGE_KEY = 'sadaka_platform_login_access';

/**
 * Soft gate for the platform login page.
 * When VITE_PLATFORM_LOGIN_KEY is set, require matching ?access= or a prior grant in sessionStorage.
 * This is operator-facing obscurity, not a substitute for strong auth / network controls.
 */
export function hasPlatformLoginAccess(search: string = typeof window !== 'undefined' ? window.location.search : ''): boolean {
  const required = env.VITE_PLATFORM_LOGIN_KEY?.trim();
  if (!required) {
    return true;
  }

  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  if (params.get('access') === required) {
    try {
      sessionStorage.setItem(ACCESS_STORAGE_KEY, required);
    } catch {
      // ignore storage failures
    }
    return true;
  }

  try {
    return sessionStorage.getItem(ACCESS_STORAGE_KEY) === required;
  } catch {
    return false;
  }
}

/** Path used for redirects after 401 / unauthenticated platform routes. Includes access key when configured. */
export function platformLoginHref(): string {
  const key = env.VITE_PLATFORM_LOGIN_KEY?.trim();
  if (!key) {
    return PLATFORM_LOGIN_PATH;
  }
  return `${PLATFORM_LOGIN_PATH}?access=${encodeURIComponent(key)}`;
}
