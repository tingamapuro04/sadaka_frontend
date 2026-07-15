import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../src/App';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SadakaAuthProvider } from '../src/contexts/SadakaAuthContext';
import { queryClient } from '../src/lib/query-client';

describe('Sadaka routing', () => {
  it('redirects unauthenticated users to the Sadaka login page', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SadakaAuthProvider>
            <MemoryRouter initialEntries={['/sadaka/dashboard']}>
              <App />
            </MemoryRouter>
          </SadakaAuthProvider>
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Super Admin Login')).toBeInTheDocument();
    });
  });
});
