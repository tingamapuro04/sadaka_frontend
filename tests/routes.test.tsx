import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SadakaAuthProvider } from '../src/contexts/SadakaAuthContext';
import { ToastProvider } from '../src/components/ui';
import { queryClient } from '../src/lib/query-client';
import { App } from '../src/App';

describe('route shells', () => {
  it('renders home route', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <SadakaAuthProvider>
              <MemoryRouter initialEntries={['/']}>
                <App />
              </MemoryRouter>
            </SadakaAuthProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Give with M-Pesa')).toBeInTheDocument();
      expect(screen.getByLabelText(/search for a church/i)).toBeInTheDocument();
    });
  });
});
