import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';
import { useOtpLoginFlow } from '../../hooks/useOtpLoginFlow';
import { requestChurchLoginOtp, startChurchLogin, verifyChurchLogin } from './api';
import type { AdminLoginVerifyResponse } from './types';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

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
      login(result.token, result.role as 'church_super_admin' | 'readonly');
      navigate('/admin/dashboard', { replace: true });
    }
  });

  return (
    <div className="mx-auto mt-10 max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">Church Admin Login</h1>
      <p className="mb-6 text-sm text-slate-600">
        {step === 'credentials'
          ? 'Use your registered phone number and password. When SMS login is enabled, we will send a one-time code.'
          : 'Enter the 6-digit code we sent to your phone.'}
      </p>
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
  );
};
