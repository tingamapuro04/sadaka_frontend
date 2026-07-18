import {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren
} from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import { registerAuthHandlers } from '../lib/axios';
import type { AuthMeResponse } from '../types/api.types';
import type { UserRole } from '../types/common.types';

const INACTIVITY_MS = 15 * 60_000;
const WARNING_MS = 60_000;

/** First-party session fallback when the httpOnly cookie is not sent (cross-site). */
const STORAGE_KEY = 'sadaka_church_auth_v1';

type ChurchRole = Exclude<UserRole, null | 'sadaka_admin' | 'sadaka_super_admin'>;

type StoredChurchAuth = {
  token: string;
  role: ChurchRole;
};

type AuthContextValue = {
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  showSessionWarning: boolean;
  login: (token: string, role: Exclude<UserRole, null>) => void;
  logout: () => void;
  stayLoggedIn: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const isChurchRole = (role: unknown): role is ChurchRole =>
  role === 'church_super_admin' || role === 'readonly';

const readStoredAuth = (): StoredChurchAuth | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredChurchAuth>;
    if (typeof parsed.token === 'string' && isChurchRole(parsed.role)) {
      return { token: parsed.token, role: parsed.role };
    }
  } catch {
    return null;
  }

  return null;
};

const writeStoredAuth = (token: string | null, role: ChurchRole | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (token && role) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, role }));
      return;
    }
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore quota / private-mode failures; cookie path may still work.
  }
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const stored = readStoredAuth();
  const [token, setToken] = useState<string | null>(stored?.token ?? null);
  const [role, setRole] = useState<UserRole>(stored?.role ?? null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  // Ready immediately when we already restored from sessionStorage; still revalidate via cookie.
  const [isAuthReady, setIsAuthReady] = useState(Boolean(stored?.token));

  const warningTimer = useRef<number | null>(null);
  const logoutTimer = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (warningTimer.current) {
      window.clearTimeout(warningTimer.current);
      warningTimer.current = null;
    }
    if (logoutTimer.current) {
      window.clearTimeout(logoutTimer.current);
      logoutTimer.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearTimers();
    setShowSessionWarning(false);
    setToken(null);
    setRole(null);
    writeStoredAuth(null, null);
    setIsAuthReady(true);

    // Clear the httpOnly session cookie so refresh does not rehydrate via /api/auth/me.
    // Fire-and-forget: local state is already cleared even if the network call fails.
    void fetch(`${API_BASE_URL}${API_ENDPOINTS.authLogout}`, {
      method: 'POST',
      credentials: 'include'
    }).catch(() => {
      // Ignore network errors on logout
    });
  }, [clearTimers]);

  const scheduleInactivityTimers = useCallback(() => {
    clearTimers();

    warningTimer.current = window.setTimeout(() => {
      setShowSessionWarning(true);
    }, INACTIVITY_MS - WARNING_MS);

    logoutTimer.current = window.setTimeout(() => {
      logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login');
      }
    }, INACTIVITY_MS);
  }, [clearTimers, logout]);

  const stayLoggedIn = useCallback(() => {
    setShowSessionWarning(false);
    if (token) {
      scheduleInactivityTimers();
    }
  }, [scheduleInactivityTimers, token]);

  const login = useCallback(
    (nextToken: string, nextRole: Exclude<UserRole, null>) => {
      // Church AuthContext only accepts church roles; ignore platform tokens.
      if (!isChurchRole(nextRole)) {
        setToken(null);
        setRole(null);
        writeStoredAuth(null, null);
        setIsAuthReady(true);
        return;
      }

      setToken(nextToken);
      setRole(nextRole);
      writeStoredAuth(nextToken, nextRole);
      setShowSessionWarning(false);
      setIsAuthReady(true);
    },
    []
  );

  // Register axios handlers before child effects so a refresh does not race a dashboard
  // fetch (which would 401 and clear the restored session).
  useLayoutEffect(() => {
    registerAuthHandlers({
      getToken: () => token,
      handleUnauthorized: logout
    });
  }, [logout, token]);

  useEffect(() => {
    let cancelled = false;

    const bootstrapAuth = async () => {
      // Prefer httpOnly cookie rehydration (validates session server-side).
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.authMe}`, {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const data = (await response.json()) as AuthMeResponse;
          if (cancelled) {
            return;
          }

          // Only restore church-admin sessions here. Platform (Sadaka) tokens share
          // the same cookie name but must not mark the church AuthContext as logged in.
          if (isChurchRole(data.role)) {
            setToken(data.token);
            setRole(data.role);
            writeStoredAuth(data.token, data.role);
            return;
          }

          // Cookie is a platform session — do not keep a stale church sessionStorage entry.
          setToken(null);
          setRole(null);
          writeStoredAuth(null, null);
          return;
        }
      } catch {
        // Network errors fall through to sessionStorage fallback below.
      }

      if (cancelled) {
        return;
      }

      // Cookie missing / blocked (cross-site without SameSite=None) or offline:
      // keep the first-party sessionStorage restore if we already have one.
      const fallback = readStoredAuth();
      if (fallback) {
        setToken(fallback.token);
        setRole(fallback.role);
      } else {
        setToken(null);
        setRole(null);
      }
    };

    void bootstrapAuth().finally(() => {
      if (!cancelled) {
        setIsAuthReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      clearTimers();
      setShowSessionWarning(false);
      return;
    }

    scheduleInactivityTimers();

    const activityEvents: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const reset = () => {
      setShowSessionWarning(false);
      scheduleInactivityTimers();
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, reset);
    });

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, reset);
      });
      clearTimers();
    };
  }, [clearTimers, scheduleInactivityTimers, token]);

  const value = useMemo(
    () => ({
      token,
      role,
      isAuthenticated: Boolean(token),
      isAuthReady,
      showSessionWarning,
      login,
      logout,
      stayLoggedIn
    }),
    [isAuthReady, login, logout, role, showSessionWarning, stayLoggedIn, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
