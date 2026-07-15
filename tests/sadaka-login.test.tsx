import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SadakaAuthProvider } from '../src/contexts/SadakaAuthContext';
import { SadakaLoginPage } from '../src/pages/sadaka/login';

vi.mock('../src/pages/sadaka/api', () => ({
  startSadakaLogin: vi.fn(),
  verifySadakaLogin: vi.fn(),
  requestSadakaLoginOtp: vi.fn()
}));

const renderPage = () =>
  render(
    <SadakaAuthProvider>
      <MemoryRouter>
        <SadakaLoginPage />
      </MemoryRouter>
    </SadakaAuthProvider>
  );

const fillCredentials = () => {
  fireEvent.change(screen.getByPlaceholderText('254712345678'), {
    target: { value: '0712345678' }
  });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Sadaka@123' } });
};

describe('SadakaLoginPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows a generic error for invalid credentials', async () => {
    const { startSadakaLogin } = await import('../src/pages/sadaka/api');
    vi.mocked(startSadakaLogin).mockRejectedValue({ status: 401 });

    renderPage();
    fillCredentials();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid phone or password')).toBeInTheDocument();
    });
  });

  it('shows OTP step when challenge is required and verifies the code', async () => {
    const { startSadakaLogin, verifySadakaLogin } = await import('../src/pages/sadaka/api');
    vi.mocked(startSadakaLogin).mockResolvedValue({
      challenge_required: true,
      challenge_id: '11111111-1111-1111-1111-111111111111',
      expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
      delivery_channel: 'sms',
      masked_phone: '2547*****000',
      role: 'sadaka_super_admin'
    });
    vi.mocked(verifySadakaLogin).mockResolvedValue({
      token: 'sadaka-jwt',
      role: 'sadaka_super_admin'
    });

    renderPage();
    fillCredentials();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/2547\*{5}000/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: '123456' }
    });
    fireEvent.click(screen.getByRole('button', { name: /verify code/i }));

    await waitFor(() => {
      expect(verifySadakaLogin).toHaveBeenCalledWith({
        challenge_id: '11111111-1111-1111-1111-111111111111',
        code: '123456'
      });
    });
  });

  it('surfaces SMS delivery failures when starting login', async () => {
    const { startSadakaLogin } = await import('../src/pages/sadaka/api');
    vi.mocked(startSadakaLogin).mockRejectedValue({
      status: 502,
      message: "Africa's Talking SMS request failed"
    });

    renderPage();
    fillCredentials();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/could not send the SMS verification code/i)
      ).toBeInTheDocument();
    });
  });

});
