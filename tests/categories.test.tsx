import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../src/components/ui';
import { AdminCategoriesPage } from '../src/pages/admin/categories';
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

describe('AdminCategoriesPage', () => {
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

  it('renders wrapped category responses without crashing', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: {
          categories: [
            { id: 'cat-1', name: 'Tithe', is_active: true },
            { id: 'cat-2', name: 'Offering', is_active: false }
          ]
        }
      }
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AdminCategoriesPage />
        </ToastProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Tithe')).toBeInTheDocument();
      expect(screen.getByText('Offering')).toBeInTheDocument();
    });
  });
});
