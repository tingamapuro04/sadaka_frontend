import { Link, Outlet } from 'react-router-dom';
import { BrandMark, IconShield } from '../components/icons';
import { OfflineBanner } from '../components/ui';

type AuthLayoutProps = {
  /** Optional label under the logo */
  productLabel?: string;
};

export const AuthLayout = ({ productLabel = 'Church admin' }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50/80 via-surface to-surface">
      <OfflineBanner />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <BrandMark className="h-10 w-10" />
          <div className="text-left leading-tight">
            <span className="block text-base font-bold text-ink">Sadaka</span>
            <span className="text-xs text-ink-muted">{productLabel}</span>
          </div>
        </Link>

        <div className="w-full max-w-form animate-fade-in">
          <div className="card card-pad shadow-card sm:p-7">
            <Outlet />
          </div>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-2xs text-ink-muted">
            <IconShield className="h-3.5 w-3.5 text-brand-600" />
            Secured sessions · M-Pesa powered collections
          </p>
        </div>
      </div>
    </div>
  );
};

export const PlatformAuthLayout = () => <AuthLayout productLabel="Platform admin" />;
