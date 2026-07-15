import {
  createContext,
  useCallback,
  useEffect,
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

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

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
    setIsAuthReady(true);
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
      setToken(nextToken);
      setRole(nextRole);
      setShowSessionWarning(false);
      setIsAuthReady(true);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    const bootstrapAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.authMe}`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          if (!cancelled) {
            setToken(null);
            setRole(null);
          }
          return;
        }

        const data = (await response.json()) as AuthMeResponse;
        if (cancelled) {
          return;
        }

        setToken(data.token);
        setRole(data.role);
      } catch {
        if (!cancelled) {
          setToken(null);
          setRole(null);
        }
      } finally {
        if (!cancelled) {
          setIsAuthReady(true);
        }
      }
    };

    void bootstrapAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    registerAuthHandlers({
      getToken: () => token,
      handleUnauthorized: logout
    });
  }, [logout, token]);

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
