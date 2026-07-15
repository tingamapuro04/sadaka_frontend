import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Sidebar } from '../src/components/Navigation/Sidebar';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SadakaAuthProvider } from '../src/contexts/SadakaAuthContext';
import { useSadakaAuth } from '../src/hooks/useSadakaAuth';

const SadakaBootstrap = () => {
  const { login } = useSadakaAuth();

  useEffect(() => {
    login('sadaka-token', 'sadaka_super_admin');
  }, [login]);

  return null;
};

describe('Sidebar', () => {
  it('shows Sadaka portal navigation for super admins', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <SadakaAuthProvider>
            <SadakaBootstrap />
            <Sidebar isOpen onClose={() => undefined} />
          </SadakaAuthProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Churches')).toBeInTheDocument();
    expect(screen.getByText('Withdrawals')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
  });
});
