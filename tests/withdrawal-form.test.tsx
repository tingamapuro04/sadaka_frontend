import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WithdrawalForm } from '../src/pages/admin/withdrawals/WithdrawalForm';

vi.mock('../src/config/env.config', () => ({
  env: {
    VITE_API_BASE_URL: 'http://localhost',
    VITE_WITHDRAWAL_MODE: 'instant'
  }
}));

const church = {
  id: 'church-1',
  name: 'Grace Church',
  username: 'grace-church',
  phone: '254712345678',
  groups_enabled: false,
  withdrawal_method: 'phone' as const,
  withdrawal_number: '254712345678',
  payment_url: 'http://localhost/pay/grace-church'
};

describe('WithdrawalForm', () => {
  it('renders instant withdrawal mode and continues to OTP request', () => {
    const onRequestOtp = vi.fn();
    const onConfirmWithOtp = vi.fn();
    const onClose = vi.fn();

    render(
      <WithdrawalForm
        church={church}
        availableBalance={2500}
        isSubmitting={false}
        error={null}
        onClose={onClose}
        onRequestOtp={onRequestOtp}
        onConfirmWithOtp={onConfirmWithOtp}
      />
    );

    expect(screen.getByText('Instant')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Scheduled for/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '250' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    expect(onRequestOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: '250',
        password: 'Secret123',
        scheduled_for: expect.any(String)
      })
    );
    expect(onConfirmWithOtp).not.toHaveBeenCalled();
  });

  it('confirms withdrawal with OTP code on the second step', () => {
    const onRequestOtp = vi.fn();
    const onConfirmWithOtp = vi.fn();

    render(
      <WithdrawalForm
        church={church}
        availableBalance={2500}
        isSubmitting={false}
        error={null}
        otpStep
        challengeMessage="We sent a code to 2547*****678."
        onClose={vi.fn()}
        onRequestOtp={onRequestOtp}
        onConfirmWithOtp={onConfirmWithOtp}
        onResendOtp={vi.fn()}
        onBackFromOtp={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/Verification code/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirm withdrawal/i }));

    expect(onConfirmWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        code: '123456'
      })
    );
  });
});
