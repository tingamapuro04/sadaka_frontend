import {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import { registerSadakaAuthHandlers } from '../lib/sadaka-axios';
import type { AuthMeResponse } from '../types/api.types';
import type { UserRole } from '../types/common.types';

const STORAGE_KEY = 'sadaka_auth_v1';

type SadakaAuthState = {
  token: string | null;
  role: Extract<UserRole, 'sadaka_super_admin'> | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  login: (token: string, role: Extract<UserRole, 'sadaka_super_admin'>) => void;
  logout: () => void;
};

type StoredSadakaAuth = {
  token: string;
  role: Extract<UserRole, 'sadaka_super_admin'>;
};

export const SadakaAuthContext = createContext<SadakaAuthState | undefined>(undefined);

const readStoredAuth = (): StoredSadakaAuth | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSadakaAuth>;
    if (typeof parsed.token === 'string' && parsed.role === 'sadaka_super_admin') {
      return { token: parsed.token, role: parsed.role };
    }
  } catch {
    return null;
  }

  return null;
};

export const SadakaAuthProvider = ({ children }: PropsWithChildren) => {
  const stored = readStoredAuth();
  const [token, setToken] = useState<string | null>(stored?.token ?? null);
  const [role, setRole] = useState<Extract<UserRole, 'sadaka_super_admin'> | null>(
    stored?.role ?? null
  );
  // Ready immediately when sessionStorage restored; still revalidate via cookie when possible.
  const [isAuthReady, setIsAuthReady] = useState(Boolean(stored?.token));

  const persist = useCallback((nextToken: string | null, nextRole: StoredSadakaAuth['role'] | null) => {
    if (typeof window === 'undefined') return;
    try {
      if (nextToken && nextRole) {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, role: nextRole }));
        return;
      }
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setRole(null);
    persist(null, null);
    setIsAuthReady(true);

    // Clear the shared httpOnly session cookie (login also sets sadaka_auth_token).
    void fetch(`${API_BASE_URL}${API_ENDPOINTS.sadakaLogout}`, {
      method: 'POST',
      credentials: 'include'
    }).catch(() => {
      // Ignore network errors on logout
    });
  }, [persist]);

  const login = useCallback(
    (nextToken: string, nextRole: Extract<UserRole, 'sadaka_super_admin'>) => {
      setToken(nextToken);
      setRole(nextRole);
      persist(nextToken, nextRole);
      setIsAuthReady(true);
    },
    [persist]
  );

  // Before child effects: avoid a post-refresh dashboard fetch racing without a token.
  useLayoutEffect(() => {
    registerSadakaAuthHandlers({
      getToken: () => token,
      handleUnauthorized: logout
    });
  }, [logout, token]);

  useEffect(() => {
    let cancelled = false;

    const bootstrapAuth = async () => {
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

          if (data.role === 'sadaka_super_admin') {
            setToken(data.token);
            setRole('sadaka_super_admin');
            persist(data.token, 'sadaka_super_admin');
            return;
          }

          // Cookie is a church session — do not treat as platform login.
          // Keep existing sessionStorage platform token if present (separate sessions).
          const fallback = readStoredAuth();
          if (fallback) {
            setToken(fallback.token);
            setRole(fallback.role);
          }
          return;
        }
      } catch {
        // Fall through to sessionStorage
      }

      if (cancelled) {
        return;
      }

      const fallback = readStoredAuth();
      if (fallback) {
        setToken(fallback.token);
        setRole(fallback.role);
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
  }, [persist]);

  const value = useMemo(
    () => ({
      token,
      role,
      isAuthenticated: Boolean(token && role === 'sadaka_super_admin'),
      isAuthReady,
      login,
      logout
    }),
    [isAuthReady, login, logout, role, token]
  );

  return <SadakaAuthContext.Provider value={value}>{children}</SadakaAuthContext.Provider>;
};
