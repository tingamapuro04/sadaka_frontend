import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';
import { useOtpLoginFlow } from '../../hooks/useOtpLoginFlow';
import { useSadakaAuth } from '../../hooks/useSadakaAuth';
import { requestSadakaLoginOtp, startSadakaLogin, verifySadakaLogin } from './api';
import type { SadakaLoginVerifyResponse } from './types';

export const SadakaLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useSadakaAuth();
  const { clearLocalSession: clearChurchSession } = useAuth();

  const {
    step,
    isSubmitting,
    isResending,
    error,
    challengeMessage,
    resendCooldown,
    handleFormSubmit,
    handleResend,
    goBackToCredentials
  } = useOtpLoginFlow<SadakaLoginVerifyResponse>({
    startLogin: startSadakaLogin,
    verifyLogin: verifySadakaLogin,
    requestOtp: requestSadakaLoginOtp,
    assertSuccessRole: (result) => {
      if (result.role !== 'sadaka_super_admin') {
        throw new Error('Invalid role');
      }
    },
    onSuccess: (result) => {
      // Shared cookie is now platform-scoped; drop any leftover church local session.
      clearChurchSession();
      login(result.token, 'sadaka_super_admin');
      navigate('/sadaka/dashboard', { replace: true });
    }
  });

  return (
    <div>
      <p className="text-2xs font-semibold uppercase tracking-wider text-brand-700">Platform</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">Super Admin Login</h1>
      <p className="mt-2 text-sm text-ink-muted">
        {step === 'credentials'
          ? 'Platform-wide monitoring and withdrawal control. When SMS login is enabled, we will send a one-time code.'
          : 'Enter the 6-digit code we sent to your phone.'}
      </p>
      <div className="mt-6">
        <LoginForm
          mode={step}
          isSubmitting={isSubmitting}
          isResending={isResending}
          error={error}
          challengeMessage={challengeMessage}
          submitLabel={step === 'otp' ? 'Verify code' : 'Sign in'}
          secondaryActionLabel={step === 'otp' ? 'Back' : undefined}
          onSecondaryAction={step === 'otp' ? goBackToCredentials : undefined}
          onResend={step === 'otp' ? handleResend : undefined}
          resendCooldownSeconds={resendCooldown}
          onSubmit={handleFormSubmit}
        />
      </div>
    </div>
  );
};
