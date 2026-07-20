import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import { SadakaAuthProvider } from '../src/contexts/SadakaAuthContext';
import { AdminLoginPage } from '../src/pages/admin/login';

vi.mock('../src/pages/admin/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/pages/admin/api')>();
  return {
    ...actual,
    startChurchLogin: vi.fn(),
    verifyChurchLogin: vi.fn(),
    requestChurchLoginOtp: vi.fn()
  };
});

// Auth bootstrap hits /api/auth/me — keep it offline for unit tests
vi.stubGlobal(
  'fetch',
  vi.fn(async () => ({
    ok: false,
    json: async () => ({})
  }))
);

const renderPage = () =>
  render(
    <AuthProvider>
      <SadakaAuthProvider>
        <MemoryRouter>
          <AdminLoginPage />
        </MemoryRouter>
      </SadakaAuthProvider>
    </AuthProvider>
  );

const fillCredentials = (phone = '712345678', password = 'OtpDemo@123') => {
  fireEvent.change(screen.getByPlaceholderText('712345678'), {
    target: { value: phone }
  });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
};

describe('AdminLoginPage OTP flow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('moves to OTP step, verifies code, and supports resend after cooldown', async () => {
    const { startChurchLogin, verifyChurchLogin, requestChurchLoginOtp } = await import(
      '../src/pages/admin/api'
    );

    vi.mocked(startChurchLogin).mockResolvedValue({
      challenge_required: true,
      challenge_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
      delivery_channel: 'sms',
      masked_phone: '2547*****678',
      role: 'church_super_admin'
    });
    vi.mocked(requestChurchLoginOtp).mockResolvedValue({
      challenge_required: true,
      challenge_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
      delivery_channel: 'sms',
      masked_phone: '2547*****678',
      role: 'church_super_admin'
    });
    vi.mocked(verifyChurchLogin).mockResolvedValue({
      token: 'church-jwt',
      role: 'church_super_admin'
    });

    renderPage();
    fillCredentials();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });

    expect(startChurchLogin).toHaveBeenCalledWith({
      phone: '254712345678',
      password: 'OtpDemo@123'
    });

    const resendButton = screen.getByRole('button', { name: /resend/i });
    expect(resendButton).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^resend code$/i })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /^resend code$/i }));

    await waitFor(() => {
      expect(requestChurchLoginOtp).toHaveBeenCalledWith({
        phone: '254712345678',
        password: 'OtpDemo@123'
      });
    });

    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: '654321' }
    });
    fireEvent.click(screen.getByRole('button', { name: /verify code/i }));

    await waitFor(() => {
      expect(verifyChurchLogin).toHaveBeenCalledWith({
        challenge_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        code: '654321'
      });
    });
  });

  it('shows invalid OTP message without clearing the OTP form', async () => {
    const { startChurchLogin, verifyChurchLogin } = await import('../src/pages/admin/api');
    vi.mocked(startChurchLogin).mockResolvedValue({
      challenge_required: true,
      challenge_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
      delivery_channel: 'sms',
      masked_phone: '2547*****678',
      role: 'church_super_admin'
    });
    vi.mocked(verifyChurchLogin).mockRejectedValue({ status: 401, message: 'Invalid or expired OTP code' });

    renderPage();
    fillCredentials();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: '000000' }
    });
    fireEvent.click(screen.getByRole('button', { name: /verify code/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired otp code/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
  });
});
