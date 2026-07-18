import { useState, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Navigation/Sidebar';
import { IconClose, IconMenu } from '../components/icons';
import { Button, OfflineBanner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useSadakaAuth } from '../hooks/useSadakaAuth';
import { useRouteFocus } from '../hooks/useRouteFocus';

const mobileTitleFromPath = (pathname: string): string => {
  if (pathname.startsWith('/admin/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/admin/transactions')) return 'Transactions';
  if (pathname.startsWith('/admin/events')) return 'Events';
  if (pathname.startsWith('/admin/categories')) return 'Categories';
  if (pathname.startsWith('/admin/groups')) return 'Groups';
  if (pathname.startsWith('/admin/church')) return 'Settings';
  if (pathname.startsWith('/admin/withdrawals')) return 'Withdrawals';
  if (pathname.startsWith('/admin/accounts')) return 'Accounts';
  if (pathname.startsWith('/admin/audit-logs')) return 'Audit logs';
  if (pathname.startsWith('/sadaka/dashboard')) return 'Platform';
  if (pathname.startsWith('/sadaka/churches')) return 'Churches';
  if (pathname.startsWith('/sadaka/transactions')) return 'Transactions';
  if (pathname.startsWith('/sadaka/withdrawals')) return 'Withdrawals';
  if (pathname.startsWith('/sadaka/audit-logs')) return 'Logs';
  if (pathname.startsWith('/admin')) return 'Admin';
  if (pathname.startsWith('/sadaka')) return 'Platform';
  return 'Sadaka';
};

export const AppShell = ({ children }: { children?: ReactNode }) => {
  const { showSessionWarning, stayLoggedIn, logout, isAuthenticated } = useAuth();
  const { isAuthenticated: isSadakaAuthenticated } = useSadakaAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  useRouteFocus('main-content');

  const mobileTitle = mobileTitleFromPath(location.pathname);
  const consoleLabel = isSadakaAuthenticated
    ? 'Platform'
    : isAuthenticated
      ? 'Church'
      : null;

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] bg-surface">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <OfflineBanner />

        <header
          className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm safe-pt"
          role="banner"
        >
          <div className="flex min-h-14 items-center gap-3 px-3.5 py-2.5 sm:min-h-0 sm:px-6 sm:py-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-soft active:bg-slate-50 md:hidden"
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={sidebarOpen}
              aria-controls="app-sidebar"
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              {sidebarOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
            </button>

            <div className="min-w-0 flex-1 md:hidden">
              <p className="truncate text-sm font-semibold tracking-tight text-ink">{mobileTitle}</p>
              {consoleLabel ? (
                <p className="truncate text-2xs text-ink-muted">{consoleLabel} console</p>
              ) : null}
            </div>

            {/* Balance the hamburger so the title feels centered on phones */}
            <div className="h-10 w-10 shrink-0 md:hidden" aria-hidden />
          </div>
        </header>

        <main
          id="main-content"
          className="flex-1 overflow-y-auto overscroll-y-contain outline-none"
          tabIndex={-1}
        >
          {showSessionWarning && isAuthenticated ? (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center"
              role="alertdialog"
              aria-labelledby="session-timeout-title"
              aria-describedby="session-timeout-desc"
            >
              <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-overlay safe-pb">
                <h2 id="session-timeout-title" className="text-lg font-semibold text-ink">
                  Session timeout warning
                </h2>
                <p id="session-timeout-desc" className="mt-2 text-sm text-ink-muted">
                  You will be logged out soon due to inactivity.
                </p>
                <div className="mobile-actions mt-4">
                  <Button onClick={stayLoggedIn}>Stay logged in</Button>
                  <Button variant="secondary" onClick={logout}>
                    Logout now
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
};
