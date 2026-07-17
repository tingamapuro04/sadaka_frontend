import { Suspense, lazy, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/home/index.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SadakaProtectedRoute } from './components/auth/SadakaProtectedRoute';
import { PlatformLoginGate } from './components/auth/PlatformLoginGate';
import { AdminLayout } from './layouts/AdminLayout';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { AuthLayout, PlatformAuthLayout } from './layouts/AuthLayout';
import { AppShell } from './layouts/AppShell';
import { useRouteFocus } from './hooks/useRouteFocus';
import { PLATFORM_LOGIN_PATH } from './config/platform-login';
import { NotFoundPage } from './pages/not-found';

const pageFallback = (
  <div className="flex min-h-[40vh] items-center justify-center p-6" role="status">
    <div className="flex flex-col items-center gap-3">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-r-transparent" />
      <p className="text-sm text-ink-muted">Loading…</p>
    </div>
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
const SadakaTransactionsPage = lazyPage(async () => {
  const module = await import('./pages/sadaka/transactions');
  return { default: module.SadakaTransactionsPage };
});

const SuspenseRoute = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={pageFallback}>{children}</Suspense>
);

export const App = () => {
  useRouteFocus('main-content');

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Routes>
        {/* Public marketing / payment — no admin sidebar */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/register"
            element={(
              <SuspenseRoute>
                <RegisterPage />
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
        </Route>

        {/* Auth cards */}
        <Route element={<AuthLayout />}>
          <Route
            path="/admin/login"
            element={(
              <SuspenseRoute>
                <AdminLoginPage />
              </SuspenseRoute>
            )}
          />
        </Route>
        <Route element={<PlatformLoginGate />}>
          <Route element={<PlatformAuthLayout />}>
            <Route
              path={PLATFORM_LOGIN_PATH}
              element={(
                <SuspenseRoute>
                  <SadakaLoginPage />
                </SuspenseRoute>
              )}
            />
          </Route>
        </Route>

        {/* Legacy public URL — no longer advertised; do not reveal platform console. */}
        <Route
          path="/sadaka/login"
          element={(
            <SuspenseRoute>
              <NotFoundPage />
            </SuspenseRoute>
          )}
        />

        <Route path="/login" element={<Navigate to="/admin/login" replace />} />

        {/* Church admin console */}
        <Route element={<AppShell />}>
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

          {/* Sadaka platform console */}
          <Route path="/sadaka" element={<Navigate to="/sadaka/dashboard" replace />} />
          <Route element={<SadakaProtectedRoute />}>
            <Route path="/sadaka" element={<SuperAdminLayout />}>
              <Route path="dashboard" element={<SuspenseRoute><SadakaDashboardPage /></SuspenseRoute>} />
              <Route path="churches" element={<SuspenseRoute><SadakaChurchesPage /></SuspenseRoute>} />
              <Route path="churches/:id" element={<SuspenseRoute><SadakaChurchDetailPage /></SuspenseRoute>} />
              <Route path="transactions" element={<SuspenseRoute><SadakaTransactionsPage /></SuspenseRoute>} />
              <Route path="withdrawals" element={<SuspenseRoute><SadakaWithdrawalsPage /></SuspenseRoute>} />
              <Route path="audit-logs" element={<SuspenseRoute><SadakaAuditLogsPage /></SuspenseRoute>} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
};
