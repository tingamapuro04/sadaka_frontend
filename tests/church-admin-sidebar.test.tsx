import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Sidebar } from '../src/components/Navigation/Sidebar';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SadakaAuthProvider } from '../src/contexts/SadakaAuthContext';
import { useAuth } from '../src/hooks/useAuth';

const ChurchAdminBootstrap = ({ role }: { role: 'church_super_admin' | 'readonly' }) => {
  const { login } = useAuth();

  useEffect(() => {
    login('church-token', role);
  }, [login, role]);

  return null;
};

const renderSidebar = (role: 'church_super_admin' | 'readonly') =>
  render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <AuthProvider>
        <SadakaAuthProvider>
          <ChurchAdminBootstrap role={role} />
          <Sidebar isOpen onClose={() => undefined} />
        </SadakaAuthProvider>
      </AuthProvider>
    </MemoryRouter>
  );

describe('Church admin sidebar', () => {
  it('hides Home and Find a Church for church super admin', async () => {
    renderSidebar('church_super_admin');

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Find a Church')).not.toBeInTheDocument();
  });

  it('hides Home and Find a Church for readonly church admin', async () => {
    renderSidebar('readonly');

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Find a Church')).not.toBeInTheDocument();
  });
});
