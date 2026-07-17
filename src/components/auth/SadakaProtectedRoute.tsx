import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { platformLoginHref } from '../../config/platform-login';
import { useSadakaAuth } from '../../hooks/useSadakaAuth';

export const SadakaProtectedRoute = () => {
  const { isAuthenticated, isAuthReady } = useSadakaAuth();
  const location = useLocation();

  if (!isAuthReady) {
    return <div className="p-4 text-sm text-slate-600">Restoring Sadaka session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={platformLoginHref()} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
