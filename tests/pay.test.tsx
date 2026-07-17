import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PayPage } from '../src/pages/pay';
import { PaymentStatus } from '../src/pages/pay/components/PaymentStatus';
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

const churchPayload = {
  church: {
    id: 'church-1',
    name: 'Grace Community',
    username: 'grace-community',
    phone: '254712345678',
    groups_enabled: true,
    withdrawal_method: 'phone',
    withdrawal_number: '254712345678',
    payment_url: 'http://localhost/pay/grace-community'
  },
  categories: [
    { id: 'cat-1', name: 'Tithe' },
    { id: 'cat-2', name: 'Missions' }
  ],
  groups: [{ id: 'group-1', name: 'Youth' }]
};

const paymentCreated = {
  transaction_id: 'tx-123',
  status: 'awaiting_payment' as const,
  gross_amount: 700,
  fee: 2,
  total_amount: 702,
  status_url: '/api/v1/pay/grace-community/transactions/tx-123',
  poll_interval_seconds: 1,
  max_poll_seconds: 90
};

describe('PayPage component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0
        }
      }
    });
    vi.resetAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/pay/grace-community']}>
          <Routes>
            <Route path="/pay/:username" element={<PayPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders loading state initially', () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    renderComponent();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders "Church Not Found" when API returns 404', async () => {
    vi.mocked(apiClient.get).mockRejectedValue({
      status: 404,
      message: 'Not Found'
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Church Not Found')).toBeInTheDocument();
      expect(screen.getByText(/No church registered as/i)).toBeInTheDocument();
    });
  });

  it('renders church name, groups, categories, fee copy, and STK guidance', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: churchPayload });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Grace Community')).toBeInTheDocument();
      expect(screen.getByText('Tithe')).toBeInTheDocument();
      expect(screen.getByText('Missions')).toBeInTheDocument();
      expect(screen.getByText(/Group \/ fellowship/i)).toBeInTheDocument();
      expect(screen.getByText('Youth')).toBeInTheDocument();
    });

    expect(screen.getByText(/KES 2 platform fee/i)).toBeInTheDocument();
    expect(screen.getByText(/STK prompt/i)).toBeInTheDocument();
  });

  it('validates phone number and offering amount, then submits correctly', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        ...churchPayload,
        groups: []
      }
    });

    vi.mocked(apiClient.post).mockResolvedValue({ data: paymentCreated });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Grace Community')).toBeInTheDocument();
    });

    const phoneInput = screen.getByPlaceholderText('712345678');
    fireEvent.change(phoneInput, { target: { value: '123' } });

    fireEvent.click(screen.getByRole('button', { name: /Add category/i }));

    const categorySelects = screen.getAllByRole('combobox');
    fireEvent.change(categorySelects[0]!, { target: { value: 'cat-1' } });
    fireEvent.change(categorySelects[1]!, { target: { value: 'cat-2' } });

    const amountInputs = screen.getAllByPlaceholderText('0');
    fireEvent.change(amountInputs[0]!, { target: { value: '500' } });
    fireEvent.change(amountInputs[1]!, { target: { value: '200' } });

    const submitBtn = screen.getByRole('button', { name: /Pay Now/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Phone must be a valid Kenyan number/i)).toBeInTheDocument();
    });

    fireEvent.change(phoneInput, { target: { value: '712345678' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/pay/grace-community',
        expect.objectContaining({
          payer_phone: '254712345678',
          items: [
            { category_id: 'cat-1', amount: 500 },
            { category_id: 'cat-2', amount: 200 }
          ]
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Idempotency-Key': expect.any(String)
          })
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Check your phone' })).toBeInTheDocument();
      expect(screen.getByText(/An M-Pesa prompt was sent to/i)).toBeInTheDocument();
      expect(screen.getByText(/(KES|Ksh)\s*702/i)).toBeInTheDocument();
    });
  });
});

describe('PaymentStatus polling', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0
        }
      }
    });
    vi.resetAllMocks();
  });

  it('polls status endpoint and transitions to paid', async () => {
    let pollCount = 0;
    vi.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url.includes('/transactions/tx-123')) {
        pollCount += 1;
        if (pollCount < 2) {
          return { data: paymentCreated };
        }
        return {
          data: {
            ...paymentCreated,
            status: 'paid',
            mpesa_ref: 'ABC123',
            paid_at: '2026-07-04T08:00:00.000Z'
          }
        };
      }
      throw new Error(`Unexpected GET ${url}`);
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PaymentStatus
            username="grace-community"
            payment={paymentCreated}
            phone="254712345678"
            onReset={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: 'Check your phone' })).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: 'Payment successful' })).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(pollCount).toBeGreaterThanOrEqual(2);
  });

  it('shows failure reason when polling returns failed', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        ...paymentCreated,
        status: 'failed',
        failure_reason: 'Request cancelled by user.'
      }
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PaymentStatus
            username="grace-community"
            payment={paymentCreated}
            phone="254712345678"
            onReset={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', { name: 'Payment could not be completed' })
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.getByText('Request cancelled by user.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contact support/i })).toBeInTheDocument();
  });

  it('shows success CTAs after paid', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        ...paymentCreated,
        status: 'paid',
        mpesa_ref: 'XYZ999',
        paid_at: '2026-07-04T08:00:00.000Z'
      }
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PaymentStatus
            username="grace-community"
            payment={paymentCreated}
            phone="254712345678"
            onReset={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Payment successful' })).toBeInTheDocument();
    });

    expect(screen.getByText('XYZ999')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /make another offering/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /print receipt/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument();
  });
});
