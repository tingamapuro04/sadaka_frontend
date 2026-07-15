import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSadakaAuth } from '../../hooks/useSadakaAuth';

export const SadakaProtectedRoute = () => {
  const { isAuthenticated, isAuthReady } = useSadakaAuth();
  const location = useLocation();

  if (!isAuthReady) {
    return <div className="p-4 text-sm text-slate-600">Restoring Sadaka session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sadaka/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
