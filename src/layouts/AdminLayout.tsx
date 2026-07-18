import { Outlet } from 'react-router-dom';

export const AdminLayout = () => {
  return (
    <div className="page-shell admin-console">
      <Outlet />
    </div>
  );
};
