import { useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Navigation/Sidebar';
import { IconClose, IconMenu } from '../components/icons';
import { Button, OfflineBanner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useRouteFocus } from '../hooks/useRouteFocus';

export const AppShell = ({ children }: { children?: ReactNode }) => {
  const { showSessionWarning, stayLoggedIn, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useRouteFocus('main-content');

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <OfflineBanner />

        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm" role="banner">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 md:hidden"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              aria-expanded={sidebarOpen}
              aria-controls="app-sidebar"
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              {sidebarOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
            </button>
            <p className="text-sm font-semibold text-ink md:hidden">Sadaka</p>
            <div className="hidden md:block" />
            <div className="w-11 md:hidden" aria-hidden />
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto outline-none" tabIndex={-1}>
          {showSessionWarning && isAuthenticated ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
              role="alertdialog"
              aria-labelledby="session-timeout-title"
              aria-describedby="session-timeout-desc"
            >
              <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-overlay">
                <h2 id="session-timeout-title" className="text-lg font-semibold text-ink">
                  Session timeout warning
                </h2>
                <p id="session-timeout-desc" className="mt-2 text-sm text-ink-muted">
                  You will be logged out soon due to inactivity.
                </p>
                <div className="mt-4 flex gap-2">
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
