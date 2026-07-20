import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';
import { useOtpLoginFlow } from '../../hooks/useOtpLoginFlow';
import { useSadakaAuth } from '../../hooks/useSadakaAuth';
import { requestChurchLoginOtp, startChurchLogin, verifyChurchLogin } from './api';
import type { AdminLoginVerifyResponse } from './types';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { clearLocalSession: clearPlatformSession } = useSadakaAuth();

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
  } = useOtpLoginFlow<AdminLoginVerifyResponse>({
    startLogin: startChurchLogin,
    verifyLogin: verifyChurchLogin,
    requestOtp: requestChurchLoginOtp,
    onSuccess: (result) => {
      // Shared cookie is now church-scoped; drop any leftover platform local session.
      clearPlatformSession();
      login(result.token, result.role as 'church_super_admin' | 'readonly');
      navigate('/admin/dashboard', { replace: true });
    }
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Church admin login</h1>
      <p className="mt-2 text-sm text-ink-muted">
        {step === 'credentials'
          ? 'Use your registered phone number and password. When SMS login is enabled, we will send a one-time code.'
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
