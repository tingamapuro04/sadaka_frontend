import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminChurchSettingsPage } from '../src/pages/admin/church/settings';
import { apiClient } from '../src/lib/axios';

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({ role: 'church_super_admin' })
}));

vi.mock('../src/lib/axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/axios')>();
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn()
    }
  };
});

describe('AdminChurchSettingsPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false
        }
      }
    });
    vi.resetAllMocks();
  });

  it('renders wrapped audit log responses safely', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === '/api/v1/admin/church') {
        return {
          data: {
            church: {
              id: 'church-1',
              name: 'Grace Church',
              username: 'grace-church',
              phone: '254712345678',
              email: 'info@example.com',
              logo_url: null,
              groups_enabled: false,
              withdrawal_method: 'phone',
              withdrawal_number: '254712345678',
              payment_url: 'http://localhost/pay/grace-church'
            }
          }
        };
      }

      return {
        data: {
          data: {
            auditLogs: [
              {
                id: 'log-1',
                action: 'withdrawal.created',
                church_id: 'church-1',
                actor_id: 'actor-1',
                actor_role: 'church_super_admin',
                metadata: null,
                created_at: '2026-06-08T10:00:00.000Z'
              }
            ]
          }
        }
      };
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminChurchSettingsPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Grace Church')).toBeInTheDocument();
      expect(screen.getByText('withdrawal.created')).toBeInTheDocument();
    });
  });
});
