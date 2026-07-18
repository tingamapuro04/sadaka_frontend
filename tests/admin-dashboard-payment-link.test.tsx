import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from '../src/pages/admin/dashboard/index';
import { ToastProvider } from '../src/components/ui';

const fetchChurch = vi.fn();
const fetchDashboard = vi.fn();
const fetchTransactions = vi.fn();
const fetchEvents = vi.fn();

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    role: 'church_super_admin',
    isAuthenticated: true,
    isAuthReady: true,
    token: 'test-token',
    showSessionWarning: false,
    login: vi.fn(),
    logout: vi.fn(),
    stayLoggedIn: vi.fn()
  })
}));

vi.mock('../src/pages/admin/api', async () => {
  const actual = await vi.importActual<typeof import('../src/pages/admin/api')>('../src/pages/admin/api');
  return {
    ...actual,
    fetchChurch: (...args: unknown[]) => fetchChurch(...args),
    fetchDashboard: (...args: unknown[]) => fetchDashboard(...args),
    fetchTransactions: (...args: unknown[]) => fetchTransactions(...args),
    fetchEvents: (...args: unknown[]) => fetchEvents(...args)
  };
});

const renderPage = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
};

describe('AdminDashboardPage payment link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchDashboard.mockResolvedValue({
      total_income: 0,
      transaction_counts: { today: 0, week: 0, month: 0 },
      by_category: [],
      by_group: [],
      available_balance: 0
    });
    fetchTransactions.mockResolvedValue({ total: 0, page: 1, transactions: [] });
    fetchEvents.mockResolvedValue({ total: 0, page: 1, events: [] });
    fetchChurch.mockResolvedValue({
      id: 'c1',
      name: 'Grace Chapel',
      username: 'grace-chapel',
      phone: '254700000000',
      groups_enabled: true,
      withdrawal_method: 'phone',
      withdrawal_number: '254700000000',
      payment_url: 'https://app.example.com/pay/grace-chapel'
    });
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    });
  });

  it('shows the public payment link and copies it', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Public payment link')).toBeInTheDocument();
    });

    const link = screen.getByRole('link', { name: 'https://app.example.com/pay/grace-chapel' });
    expect(link).toHaveAttribute('href', 'https://app.example.com/pay/grace-chapel');
    expect(screen.getByText('@grace-chapel')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://app.example.com/pay/grace-chapel'
      );
    });
  });
});
