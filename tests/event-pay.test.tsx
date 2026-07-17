import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EventPayPage } from '../src/pages/event-pay';
import { apiClient } from '../src/lib/axios';

vi.mock('../src/lib/axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/axios')>();
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      get: vi.fn(),
      post: vi.fn()
    }
  };
});

const eventPagePayload = {
  church: {
    id: 'church-1',
    name: 'Grace Community',
    username: 'grace-community',
    phone: '254712345678',
    groups_enabled: false,
    withdrawal_method: 'phone' as const,
    withdrawal_number: '254712345678',
    payment_url: 'http://localhost/pay/grace-community'
  },
  event: {
    id: 'event-1',
    title: 'Youth Camp 2026',
    description: 'Help send youth to camp',
    slug: 'youth-camp-2026',
    status: 'active' as const,
    target_amount: 100000,
    paid_gross: 25000
  },
  platform_fee_kes: 2
};

const paymentCreated = {
  transaction_id: 'tx-evt-1',
  status: 'awaiting_payment' as const,
  gross_amount: 500,
  fee: 2,
  total_amount: 502,
  status_url: '/api/v1/pay/grace-community/events/youth-camp-2026/transactions/tx-evt-1',
  poll_interval_seconds: 1,
  max_poll_seconds: 90
};

describe('EventPayPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 }
      }
    });
    vi.resetAllMocks();
  });

  const renderPage = (path = '/pay/grace-community/events/youth-camp-2026') =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/pay/:username/events/:eventSlug" element={<EventPayPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  it('shows a loading skeleton while fetching', () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows event not found for 404', async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ status: 404, message: 'Event not found' });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Event Not Found')).toBeInTheDocument();
    });
  });

  it('shows closed state for 410', async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      status: 410,
      message: 'This event is no longer accepting payments.'
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /event closed/i })).toBeInTheDocument();
      expect(screen.getByText(/no longer accepting payments/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /find a church/i })).toBeInTheDocument();
    });
  });

  it('renders event details and fundraising progress', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: eventPagePayload });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Youth Camp 2026')).toBeInTheDocument();
      expect(screen.getByText('Grace Community')).toBeInTheDocument();
      expect(screen.getByText(/Help send youth to camp/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/25%/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount \(KES\)/i)).toBeInTheDocument();
  });

  it('submits payment and shows status view', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (String(url).includes('/transactions/')) {
        return { data: paymentCreated };
      }
      return { data: eventPagePayload };
    });
    vi.mocked(apiClient.post).mockResolvedValue({ data: paymentCreated });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Youth Camp 2026')).toBeInTheDocument();
    });

    // PhoneInput shows 9-digit local part; value stored as 254…
    fireEvent.change(screen.getByPlaceholderText('712345678'), {
      target: { value: '712345678' }
    });
    fireEvent.change(screen.getByLabelText(/Amount \(KES\)/i), {
      target: { value: '500' }
    });
    fireEvent.click(screen.getByRole('button', { name: /pay now/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/pay/grace-community/events/youth-camp-2026',
        expect.objectContaining({
          payer_phone: '254712345678',
          amount: 500
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Idempotency-Key': expect.any(String)
          })
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/prompt sent/i)).toBeInTheDocument();
    });
  });

  it('shows API error when submit fails', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: eventPagePayload });
    vi.mocked(apiClient.post).mockRejectedValue({
      status: 502,
      message: 'M-Pesa unavailable'
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Youth Camp 2026')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('712345678'), {
      target: { value: '712345678' }
    });
    fireEvent.change(screen.getByLabelText(/Amount \(KES\)/i), {
      target: { value: '100' }
    });
    fireEvent.click(screen.getByRole('button', { name: /pay now/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/M-Pesa unavailable/i);
    });
  });
});
