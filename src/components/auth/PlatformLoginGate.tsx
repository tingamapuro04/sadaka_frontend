import { Outlet, useLocation } from 'react-router-dom';
import { hasPlatformLoginAccess } from '../../config/platform-login';
import { NotFoundPage } from '../../pages/not-found';

/**
 * Layout gate for platform login: no Platform chrome when access is denied.
 * Soft access is optional (env key); denied users see a generic 404.
 */
export const PlatformLoginGate = () => {
  const location = useLocation();

  if (!hasPlatformLoginAccess(location.search)) {
    return <NotFoundPage />;
  }

  return <Outlet />;
};
