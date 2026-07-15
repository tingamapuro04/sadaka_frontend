import { useCallback, useEffect, useRef, useState } from 'react';
import { OTP_RESEND_COOLDOWN_SECONDS } from '../config/constants';
import {
  formatOtpChallengeMessage,
  loginCredentialErrorMessage,
  otpErrorMessage
} from '../utils/auth-errors';
import { loginSchema } from '../utils/validation';

export type LoginStep = 'credentials' | 'otp';

export type LoginChallenge = {
  challenge_required: true;
  challenge_id: string;
  expires_at: string;
  masked_phone: string;
};

export type LoginSuccess = {
  token: string;
  role: string;
};

type Credentials = { phone: string; password: string };

type UseOtpLoginFlowOptions<TSuccess extends LoginSuccess> = {
  startLogin: (credentials: Credentials) => Promise<LoginChallenge | TSuccess>;
  verifyLogin: (payload: { challenge_id: string; code: string }) => Promise<TSuccess>;
  requestOtp: (credentials: Credentials) => Promise<LoginChallenge>;
  onSuccess: (result: TSuccess) => void;
  /** Optional role gate after password login without OTP */
  assertSuccessRole?: (result: TSuccess) => void;
};

const isChallenge = <TSuccess extends LoginSuccess>(
  response: LoginChallenge | TSuccess
): response is LoginChallenge =>
  Boolean(response && typeof response === 'object' && 'challenge_required' in response);

export function useOtpLoginFlow<TSuccess extends LoginSuccess>({
  startLogin,
  verifyLogin,
  requestOtp,
  onSuccess,
  assertSuccessRole
}: UseOtpLoginFlowOptions<TSuccess>) {
  const [step, setStep] = useState<LoginStep>('credentials');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [challengeMessage, setChallengeMessage] = useState<string | undefined>();
  const [resendCooldown, setResendCooldown] = useState(0);
  const credentialsRef = useRef<Credentials | null>(null);
  const cooldownTimer = useRef<number | null>(null);

  const clearCooldownTimer = useCallback(() => {
    if (cooldownTimer.current != null) {
      window.clearInterval(cooldownTimer.current);
      cooldownTimer.current = null;
    }
  }, []);

  const startCooldown = useCallback(
    (seconds = OTP_RESEND_COOLDOWN_SECONDS) => {
      clearCooldownTimer();
      setResendCooldown(seconds);
      cooldownTimer.current = window.setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearCooldownTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearCooldownTimer]
  );

  useEffect(() => () => clearCooldownTimer(), [clearCooldownTimer]);

  const applyChallenge = useCallback(
    (challenge: LoginChallenge) => {
      setChallengeId(challenge.challenge_id);
      setChallengeMessage(
        formatOtpChallengeMessage(challenge.masked_phone, challenge.expires_at)
      );
      setStep('otp');
      startCooldown();
    },
    [startCooldown]
  );

  const goBackToCredentials = useCallback(() => {
    setStep('credentials');
    setChallengeId(null);
    setChallengeMessage(undefined);
    setError(null);
    setResendCooldown(0);
    clearCooldownTimer();
  }, [clearCooldownTimer]);

  const handleCredentialsSubmit = useCallback(
    async (values: Credentials & { otpCode?: string }) => {
      setError(null);
      const parsed = loginSchema.safeParse({
        phone: values.phone,
        password: values.password
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Invalid phone or password');
        return;
      }

      setIsSubmitting(true);
      try {
        credentialsRef.current = parsed.data;
        const response = await startLogin(parsed.data);
        if (isChallenge(response)) {
          applyChallenge(response);
          return;
        }
        assertSuccessRole?.(response);
        onSuccess(response);
      } catch (err) {
        setError(loginCredentialErrorMessage(err));
      } finally {
        setIsSubmitting(false);
      }
    },
    [applyChallenge, assertSuccessRole, onSuccess, startLogin]
  );

  const handleVerify = useCallback(
    async (values: Credentials & { otpCode: string }) => {
      setError(null);
      if (!challengeId) {
        setError('Please request a new verification code.');
        goBackToCredentials();
        return;
      }

      const code = values.otpCode.trim();
      if (!/^\d{6}$/.test(code)) {
        setError('OTP code must be a 6-digit number');
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await verifyLogin({ challenge_id: challengeId, code });
        onSuccess(response);
      } catch (err) {
        setError(otpErrorMessage(err, 'verify'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [challengeId, goBackToCredentials, onSuccess, verifyLogin]
  );

  const handleResend = useCallback(async () => {
    setError(null);
    const credentials = credentialsRef.current;
    if (!credentials) {
      setError('Please enter your phone and password again.');
      goBackToCredentials();
      return;
    }
    if (resendCooldown > 0 || isResending) {
      return;
    }

    setIsResending(true);
    try {
      const challenge = await requestOtp(credentials);
      applyChallenge(challenge);
    } catch (err) {
      setError(otpErrorMessage(err, 'resend'));
    } finally {
      setIsResending(false);
    }
  }, [applyChallenge, goBackToCredentials, isResending, requestOtp, resendCooldown]);

  const handleFormSubmit = useCallback(
    async (values: Credentials & { otpCode: string }) => {
      if (step === 'otp') {
        await handleVerify(values);
        return;
      }
      await handleCredentialsSubmit(values);
    },
    [handleCredentialsSubmit, handleVerify, step]
  );

  return {
    step,
    isSubmitting,
    isResending,
    error,
    challengeMessage,
    resendCooldown,
    handleFormSubmit,
    handleResend,
    goBackToCredentials
  };
}
