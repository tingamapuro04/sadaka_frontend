import { Outlet } from 'react-router-dom';

export const SuperAdminLayout = () => {
  return (
    <div className="page-shell admin-console">
      <Outlet />
    </div>
  );
};
