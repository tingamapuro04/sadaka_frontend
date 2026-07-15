import { Outlet } from 'react-router-dom';

export const SuperAdminLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <Outlet />
      </main>
    </div>
  );
};
