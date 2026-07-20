import { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Sidebar } from '../src/components/Navigation/Sidebar';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SadakaAuthProvider } from '../src/contexts/SadakaAuthContext';
import { useAuth } from '../src/hooks/useAuth';
import { useSadakaAuth } from '../src/hooks/useSadakaAuth';

const SadakaBootstrap = () => {
  const { login } = useSadakaAuth();

  useEffect(() => {
    login('sadaka-token', 'sadaka_super_admin');
  }, [login]);

  return null;
};

const DualSessionBootstrap = () => {
  const { login: churchLogin } = useAuth();
  const { login: sadakaLogin } = useSadakaAuth();

  useEffect(() => {
    sadakaLogin('sadaka-token', 'sadaka_super_admin');
    churchLogin('church-token', 'church_super_admin');
  }, [churchLogin, sadakaLogin]);

  return null;
};

describe('Sidebar', () => {
  it('shows Sadaka portal navigation for super admins without public discovery links', async () => {
    render(
      <MemoryRouter initialEntries={['/sadaka/dashboard']}>
        <AuthProvider>
          <SadakaAuthProvider>
            <SadakaBootstrap />
            <Sidebar isOpen onClose={() => undefined} />
          </SadakaAuthProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Churches')).toBeInTheDocument();
    expect(screen.getByText('Withdrawals')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Find a Church')).not.toBeInTheDocument();
    expect(screen.queryByText('Church admin')).not.toBeInTheDocument();
  });

  it('shows only church admin nav when both sessions exist outside /sadaka', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <AuthProvider>
          <SadakaAuthProvider>
            <DualSessionBootstrap />
            <Sidebar isOpen onClose={() => undefined} />
          </SadakaAuthProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Church admin')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Platform')).not.toBeInTheDocument();
    expect(screen.queryByText('Churches')).not.toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Find a Church')).not.toBeInTheDocument();
  });

  it('shows only platform nav when both sessions exist on /sadaka routes', async () => {
    render(
      <MemoryRouter initialEntries={['/sadaka/dashboard']}>
        <AuthProvider>
          <SadakaAuthProvider>
            <DualSessionBootstrap />
            <Sidebar isOpen onClose={() => undefined} />
          </SadakaAuthProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Platform')).toBeInTheDocument();
    });
    expect(screen.getByText('Churches')).toBeInTheDocument();
    expect(screen.queryByText('Church admin')).not.toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });
});
