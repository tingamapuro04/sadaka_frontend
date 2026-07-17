import { Link, Outlet, useLocation } from 'react-router-dom';
import { BrandMark } from '../components/icons';
import { OfflineBanner } from '../components/ui';

const hideChromePaths = (pathname: string) =>
  pathname.startsWith('/pay/');

export const PublicLayout = () => {
  const { pathname } = useLocation();
  const minimal = hideChromePaths(pathname);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <OfflineBanner />
      {!minimal ? (
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md" role="banner">
          <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <BrandMark className="h-9 w-9" />
              <div className="leading-tight">
                <span className="block text-sm font-bold tracking-tight text-ink">Sadaka</span>
                <span className="hidden text-2xs text-ink-muted sm:block">Church giving</span>
              </div>
            </Link>
            <nav className="flex items-center gap-1 sm:gap-2" aria-label="Public">
              <Link
                to="/register"
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:px-3"
              >
                Register
              </Link>
              <Link
                to="/admin/login"
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-soft hover:bg-brand-700"
              >
                Admin
              </Link>
            </nav>
          </div>
        </header>
      ) : null}

      <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
        <Outlet />
      </main>

      {!minimal ? (
        <footer className="border-t border-slate-200/80 bg-white py-6 safe-pb">
          <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-3 px-4 text-center text-xs text-ink-muted sm:flex-row sm:text-left sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} Sadaka · Secure church giving</p>
            <a href="mailto:support@sadaka.co.ke" className="font-medium text-brand-700 hover:underline">
              support@sadaka.co.ke
            </a>
          </div>
        </footer>
      ) : null}
    </div>
  );
};
