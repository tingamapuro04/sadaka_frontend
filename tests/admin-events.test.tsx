import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../src/components/ui';
import { AdminEventsPage } from '../src/pages/admin/events';
import { AdminEventDetailPage } from '../src/pages/admin/events/EventDetail';
import { apiClient } from '../src/lib/axios';

const useAuthMock = vi.fn((): { role: 'church_super_admin' | 'readonly' } => ({
  role: 'church_super_admin'
}));

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock()
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

const sampleEvents = {
  total: 1,
  page: 1,
  events: [
    {
      id: 'evt-1',
      church_id: 'church-1',
      title: 'Youth Camp 2026',
      description: 'Camp fundraiser',
      slug: 'youth-camp-2026',
      status: 'active',
      target_amount: 100000,
      payment_url: 'http://localhost/pay/grace/events/youth-camp-2026',
      totals: { paid_count: 3, paid_gross: 15000, awaiting_count: 1 }
    }
  ]
};

describe('Admin events UI', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    vi.resetAllMocks();
    useAuthMock.mockReturnValue({ role: 'church_super_admin' });
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    });
  });

  const renderList = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter>
            <AdminEventsPage />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );

  it('lists events with totals and create button for super admin', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: sampleEvents });
    renderList();

    await waitFor(() => {
      expect(screen.getByText('Youth Camp 2026')).toBeInTheDocument();
    });
    expect(screen.getByText(/3 paid/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument();
  });

  it('hides create/edit for readonly admins', async () => {
    useAuthMock.mockReturnValue({ role: 'readonly' });
    vi.mocked(apiClient.get).mockResolvedValue({ data: sampleEvents });
    renderList();

    await waitFor(() => {
      expect(screen.getByText('Youth Camp 2026')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /create event/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open/i })).toBeInTheDocument();
  });

  it('creates an event from the modal', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { total: 0, page: 1, events: [] } });
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        event: {
          id: 'evt-2',
          title: 'Easter Drive',
          slug: 'easter-drive',
          status: 'active',
          payment_url: 'http://localhost/pay/grace/events/easter-drive',
          totals: { paid_count: 0, paid_gross: 0, awaiting_count: 0 }
        }
      }
    });

    renderList();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^create event$/i }));
    fireEvent.change(screen.getByLabelText(/^Title$/i), { target: { value: 'Easter Drive' } });
    // Modal submit is the last "Create event" button
    const createButtons = screen.getAllByRole('button', { name: /create event/i });
    fireEvent.click(createButtons.at(-1)!);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/admin/events',
        expect.objectContaining({
          title: 'Easter Drive',
          slug: 'easter-drive',
          status: 'active'
        })
      );
    });
  });

  it('copies payment link to clipboard', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: sampleEvents });
    renderList();

    await waitFor(() => {
      expect(screen.getByText('Youth Camp 2026')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'http://localhost/pay/grace/events/youth-camp-2026'
      );
    });
    expect(await screen.findByText(/Payment link copied/i)).toBeInTheDocument();
  });

  it('shows event detail with only that event’s transactions', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (String(url).includes('/transactions')) {
        return {
          data: {
            total: 1,
            page: 1,
            transactions: [
              {
                id: 'tx-1',
                church_id: 'church-1',
                payer_name: 'Jane',
                payer_phone: '254712345678',
                gross_amount: 500,
                fee: 2,
                total_amount: 502,
                status: 'paid',
                mpesa_ref: 'ABC',
                created_at: '2026-07-01T10:00:00.000Z'
              }
            ]
          }
        };
      }
      return {
        data: {
          event: sampleEvents.events[0]
        }
      };
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/admin/events/evt-1']}>
            <Routes>
              <Route path="/admin/events/:eventId" element={<AdminEventDetailPage />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Youth Camp 2026' })).toBeInTheDocument();
    });
    expect(screen.getByText('Event transactions')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Jane')).toBeInTheDocument();
      expect(screen.getByText('254712345678')).toBeInTheDocument();
    });
  });
});
