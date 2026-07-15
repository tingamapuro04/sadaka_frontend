import { Suspense, lazy, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/home/index.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SadakaProtectedRoute } from './components/auth/SadakaProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { Sidebar } from './components/Navigation/Sidebar';
import { OfflineBanner, Button } from './components/ui';
import { useAuth } from './hooks/useAuth';
import { useRouteFocus } from './hooks/useRouteFocus';

const pageFallback = (
  <div className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-slate-600" role="status">
    Loading…
  </div>
);

const lazyPage = (factory: () => Promise<{ default: React.ComponentType }>) =>
  lazy(factory);

const PayPage = lazyPage(async () => {
  const module = await import('./pages/pay/index.tsx');
  return { default: module.PayPage };
});
const EventPayPage = lazyPage(async () => {
  const module = await import('./pages/event-pay/index.tsx');
  return { default: module.EventPayPage };
});
const RegisterPage = lazyPage(async () => {
  const module = await import('./pages/register/index.tsx');
  return { default: module.RegisterPage };
});
const AdminLoginPage = lazyPage(async () => {
  const module = await import('./pages/admin/login.tsx');
  return { default: module.AdminLoginPage };
});
const AdminDashboardPage = lazyPage(async () => {
  const module = await import('./pages/admin/dashboard/index.tsx');
  return { default: module.AdminDashboardPage };
});
const AdminTransactionsPage = lazyPage(async () => {
  const module = await import('./pages/admin/transactions/index.tsx');
  return { default: module.AdminTransactionsPage };
});
const AdminEventsPage = lazyPage(async () => {
  const module = await import('./pages/admin/events/index.tsx');
  return { default: module.AdminEventsPage };
});
const AdminEventDetailPage = lazyPage(async () => {
  const module = await import('./pages/admin/events/EventDetail.tsx');
  return { default: module.AdminEventDetailPage };
});
const AdminCategoriesPage = lazyPage(async () => {
  const module = await import('./pages/admin/categories/index.tsx');
  return { default: module.AdminCategoriesPage };
});
const AdminGroupsPage = lazyPage(async () => {
  const module = await import('./pages/admin/groups/index.tsx');
  return { default: module.AdminGroupsPage };
});
const AdminChurchSettingsPage = lazyPage(async () => {
  const module = await import('./pages/admin/church/settings.tsx');
  return { default: module.AdminChurchSettingsPage };
});
const AdminWithdrawalsPage = lazyPage(async () => {
  const module = await import('./pages/admin/withdrawals');
  return { default: module.AdminWithdrawalsPage };
});
const AdminAccountsPage = lazyPage(async () => {
  const module = await import('./pages/admin/accounts');
  return { default: module.AdminAccountsPage };
});
const AdminAuditLogsPage = lazyPage(async () => {
  const module = await import('./pages/admin/audit-logs');
  return { default: module.AdminAuditLogsPage };
});
const SadakaLoginPage = lazyPage(async () => {
  const module = await import('./pages/sadaka/login');
  return { default: module.SadakaLoginPage };
});
const SadakaDashboardPage = lazyPage(async () => {
  const module = await import('./pages/sadaka/dashboard');
  return { default: module.SadakaDashboardPage };
});
const SadakaChurchesPage = lazyPage(async () => {
  const module = await import('./pages/sadaka/churches');
  return { default: module.SadakaChurchesPage };
});
const SadakaChurchDetailPage = lazyPage(async () => {
  const module = await import('./pages/sadaka/churches/ChurchDetail');
  return { default: module.SadakaChurchDetailPage };
});
const SadakaWithdrawalsPage = lazyPage(async () => {
  const module = await import('./pages/sadaka/withdrawals');
  return { default: module.SadakaWithdrawalsPage };
});
const SadakaAuditLogsPage = lazyPage(async () => {
  const module = await import('./pages/sadaka/audit-logs');
  return { default: module.SadakaAuditLogsPage };
});

const SuspenseRoute = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={pageFallback}>{children}</Suspense>
);

export const App = () => {
  const { showSessionWarning, stayLoggedIn, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useRouteFocus('main-content');

  return (
    <div className="flex h-screen bg-slate-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <OfflineBanner />

        <header className="border-b border-slate-200 bg-white shadow-sm" role="banner">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              aria-expanded={sidebarOpen}
              aria-controls="app-sidebar"
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              {sidebarOpen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <p className="text-sm font-medium text-slate-600 md:hidden">Sadaka</p>
            <div />
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto outline-none" tabIndex={-1}>
          {showSessionWarning && isAuthenticated ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4" role="alertdialog" aria-labelledby="session-timeout-title" aria-describedby="session-timeout-desc">
              <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg">
                <h2 id="session-timeout-title" className="text-lg font-semibold text-slate-900">
                  Session timeout warning
                </h2>
                <p id="session-timeout-desc" className="mt-2 text-sm text-slate-600">
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

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Navigate to="/admin/login" replace />} />
            <Route
              path="/register"
              element={(
                <SuspenseRoute>
                  <RegisterPage />
                </SuspenseRoute>
              )}
            />
            <Route
              path="/admin/login"
              element={(
                <SuspenseRoute>
                  <AdminLoginPage />
                </SuspenseRoute>
              )}
            />
            <Route
              path="/sadaka/login"
              element={(
                <SuspenseRoute>
                  <SadakaLoginPage />
                </SuspenseRoute>
              )}
            />
            <Route
              path="/pay/:username/events/:eventSlug"
              element={(
                <SuspenseRoute>
                  <EventPayPage />
                </SuspenseRoute>
              )}
            />
            <Route
              path="/pay/:username"
              element={(
                <SuspenseRoute>
                  <PayPage />
                </SuspenseRoute>
              )}
            />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<SuspenseRoute><AdminDashboardPage /></SuspenseRoute>} />
                <Route path="transactions" element={<SuspenseRoute><AdminTransactionsPage /></SuspenseRoute>} />
                <Route path="events" element={<SuspenseRoute><AdminEventsPage /></SuspenseRoute>} />
                <Route path="events/:eventId" element={<SuspenseRoute><AdminEventDetailPage /></SuspenseRoute>} />
                <Route path="categories" element={<SuspenseRoute><AdminCategoriesPage /></SuspenseRoute>} />
                <Route path="groups" element={<SuspenseRoute><AdminGroupsPage /></SuspenseRoute>} />
                <Route path="church" element={<SuspenseRoute><AdminChurchSettingsPage /></SuspenseRoute>} />
                <Route path="withdrawals" element={<SuspenseRoute><AdminWithdrawalsPage /></SuspenseRoute>} />
                <Route path="accounts" element={<SuspenseRoute><AdminAccountsPage /></SuspenseRoute>} />
                <Route path="audit-logs" element={<SuspenseRoute><AdminAuditLogsPage /></SuspenseRoute>} />
              </Route>
            </Route>
            <Route path="/sadaka" element={<Navigate to="/sadaka/dashboard" replace />} />
            <Route element={<SadakaProtectedRoute />}>
              <Route path="/sadaka" element={<SuperAdminLayout />}>
                <Route path="dashboard" element={<SuspenseRoute><SadakaDashboardPage /></SuspenseRoute>} />
                <Route path="churches" element={<SuspenseRoute><SadakaChurchesPage /></SuspenseRoute>} />
                <Route path="churches/:id" element={<SuspenseRoute><SadakaChurchDetailPage /></SuspenseRoute>} />
                <Route path="withdrawals" element={<SuspenseRoute><SadakaWithdrawalsPage /></SuspenseRoute>} />
                <Route path="audit-logs" element={<SuspenseRoute><SadakaAuditLogsPage /></SuspenseRoute>} />
              </Route>
            </Route>
          </Routes>
        </main>
      </div>
    </div>
  );
};
