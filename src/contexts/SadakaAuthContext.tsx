import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { registerSadakaAuthHandlers } from '../lib/sadaka-axios';
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
  const [role, setRole] = useState<Extract<UserRole, 'sadaka_super_admin'> | null>(stored?.role ?? null);
  const isAuthReady = true;

  const persist = useCallback((nextToken: string | null, nextRole: StoredSadakaAuth['role'] | null) => {
    if (typeof window === 'undefined') return;
    if (nextToken && nextRole) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, role: nextRole }));
      return;
    }
    window.sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setRole(null);
    persist(null, null);
  }, [persist]);

  const login = useCallback(
    (nextToken: string, nextRole: Extract<UserRole, 'sadaka_super_admin'>) => {
      setToken(nextToken);
      setRole(nextRole);
      persist(nextToken, nextRole);
    },
    [persist]
  );

  useEffect(() => {
    registerSadakaAuthHandlers({
      getToken: () => token,
      handleUnauthorized: logout
    });
  }, [logout, token]);

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
