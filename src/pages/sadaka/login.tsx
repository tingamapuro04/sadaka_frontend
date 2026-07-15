import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';
import { useOtpLoginFlow } from '../../hooks/useOtpLoginFlow';
import { useSadakaAuth } from '../../hooks/useSadakaAuth';
import { requestSadakaLoginOtp, startSadakaLogin, verifySadakaLogin } from './api';
import type { SadakaLoginVerifyResponse } from './types';

export const SadakaLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useSadakaAuth();

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
      login(result.token, 'sadaka_super_admin');
      navigate('/sadaka/dashboard', { replace: true });
    }
  });

  return (
    <div className="mx-auto mt-10 max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 px-6 py-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Sadaka Platform</p>
        <h1 className="mt-2 text-3xl font-semibold">Super Admin Login</h1>
        <p className="mt-2 text-sm text-slate-300">Platform-wide monitoring and withdrawal control.</p>
      </div>
      <div className="p-6">
        <p className="mb-6 text-sm text-slate-600">
          {step === 'credentials'
            ? 'Use the dedicated platform credentials. When SMS login is enabled, we will send a one-time code.'
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
    </div>
  );
};
