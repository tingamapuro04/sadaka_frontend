import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { ChurchInfoForm } from './components/ChurchInfoForm';
import { AdminAccountForm } from './components/AdminAccountForm';
import { WithdrawalSetupForm } from './components/WithdrawalSetupForm';
import { RegisterOtpStep } from './components/RegisterOtpStep';
import { useChurchRegistration } from './hooks/useChurchRegistration';
import { useAuth } from '../../hooks/useAuth';
import { adminAccountSchema, churchInfoSchema, withdrawalSetupSchema } from '../../utils/validation';
import { formatOtpChallengeMessage } from '../../utils/auth-errors';

type FormState = {
  name: string;
  username: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  withdrawal_method: 'phone' | 'till' | 'paybill';
  withdrawal_number: string;
  logo: File | null;
};

const initialState: FormState = {
  name: '',
  username: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  withdrawal_method: 'phone',
  withdrawal_number: '',
  logo: null
};

const validateLogoDimensions = async (file: File): Promise<boolean> => {
  const imageUrl = URL.createObjectURL(file);
  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.width, height: image.height });
      image.onerror = () => reject(new Error('Unable to load image for validation'));
      image.src = imageUrl;
    });

    return dimensions.width >= 120 && dimensions.height >= 120;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    isSubmitting,
    isRequestingOtp,
    error,
    setError,
    registerChurch,
    requestRegisterOtp,
    checkUsernameAvailability
  } = useChurchRegistration();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [challengeMessage, setChallengeMessage] = useState<string | undefined>();
  const [maskedPhone, setMaskedPhone] = useState('');

  const canSubmit = useMemo(() => !isSubmitting && !isRequestingOtp, [isSubmitting, isRequestingOtp]);

  const mapIssuesToFieldErrors = (issues: z.ZodIssue[]) => {
    const errors: Record<string, string> = {};
    issues.forEach((issue) => {
      const key = issue.path.join('.') || 'form';
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    });
    return errors;
  };

  const nextFromChurchInfo = () => {
    const parsed = churchInfoSchema.safeParse({
      name: form.name,
      username: form.username,
      phone: form.phone,
      email: form.email
    });

    if (!parsed.success) {
      setFieldErrors(mapIssuesToFieldErrors(parsed.error.issues));
      return;
    }

    setFieldErrors({});
    setStep(2);
  };

  const nextFromAdminInfo = () => {
    const parsed = adminAccountSchema.safeParse({
      password: form.password,
      confirmPassword: form.confirmPassword,
      acceptTerms: form.acceptTerms
    });

    if (!parsed.success) {
      setFieldErrors(mapIssuesToFieldErrors(parsed.error.issues));
      return;
    }

    setFieldErrors({});
    setStep(3);
  };

  const completeRegistration = async (otp?: { challenge_id: string; code: string }) => {
    const response = await registerChurch({
      name: form.name,
      username: form.username,
      phone: form.phone,
      email: form.email,
      password: form.password,
      withdrawal_method: form.withdrawal_method,
      withdrawal_number: form.withdrawal_number,
      logo: form.logo,
      ...(otp ?? {})
    });

    if (!response) {
      return;
    }

    login(response.token, 'church_super_admin');
    setForm(initialState);
    navigate('/admin/dashboard', { replace: true });
  };

  const beginOtpOrRegister = async () => {
    const parsed = withdrawalSetupSchema.safeParse({
      withdrawal_method: form.withdrawal_method,
      withdrawal_number: form.withdrawal_number
    });

    if (!parsed.success) {
      setFieldErrors(mapIssuesToFieldErrors(parsed.error.issues));
      return;
    }

    if (form.logo) {
      const maxSizeBytes = 2 * 1024 * 1024;
      if (form.logo.size > maxSizeBytes) {
        setFieldErrors({ withdrawal_number: 'Logo must be 2MB or smaller.' });
        return;
      }

      const hasValidDimensions = await validateLogoDimensions(form.logo);
      if (!hasValidDimensions) {
        setFieldErrors({ withdrawal_number: 'Logo must be at least 120x120 pixels.' });
        return;
      }
    }

    setFieldErrors({});
    setError(null);

    const otpResponse = await requestRegisterOtp(form.phone);
    if (!otpResponse) {
      return;
    }

    if (!otpResponse.otp_required) {
      await completeRegistration();
      return;
    }

    setChallengeId(otpResponse.challenge_id);
    setMaskedPhone(otpResponse.masked_phone);
    setChallengeMessage(
      formatOtpChallengeMessage(otpResponse.masked_phone, otpResponse.expires_at)
    );
    setStep(4);
  };

  const resendOtp = async () => {
    const otpResponse = await requestRegisterOtp(form.phone);
    if (!otpResponse || !otpResponse.otp_required) {
      return;
    }
    setChallengeId(otpResponse.challenge_id);
    setMaskedPhone(otpResponse.masked_phone);
    setChallengeMessage(
      formatOtpChallengeMessage(otpResponse.masked_phone, otpResponse.expires_at)
    );
  };

  const verifyAndRegister = async (code: string) => {
    if (!challengeId) {
      setError('Please request a new verification code.');
      setStep(3);
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError('OTP code must be a 6-digit number');
      return;
    }
    await completeRegistration({ challenge_id: challengeId, code: code.trim() });
  };

  const totalSteps = step === 4 ? 4 : 3;
  const displayStep = step === 4 ? 4 : step;

  return (
    <div className="mx-auto mt-8 max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Register Your Church</h1>
          <p className="mt-1 text-sm text-slate-500">
            Set up your church details, admin account, and withdrawal method.
            {step === 4 ? ' Verify the SMS code sent to your phone to finish.' : ''}
          </p>
        </div>
        <Link to="/admin/login" className="text-sm text-blue-600 hover:text-blue-700">
          Already have an account? Login
        </Link>
      </div>
      <div className="mb-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepIndex) => (
            <div
              key={stepIndex}
              className={`flex min-w-[2.5rem] items-center justify-center rounded-full border px-3 py-2 text-sm font-semibold ${
                stepIndex === displayStep
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : stepIndex < displayStep
                    ? 'border-slate-300 bg-slate-100 text-slate-700'
                    : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              {stepIndex}
            </div>
          ))}
          <div className="text-sm text-slate-500">
            Step {displayStep} of {totalSteps}
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${(displayStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 ? (
        <ChurchInfoForm
          values={{ name: form.name, username: form.username, phone: form.phone, email: form.email }}
          onChange={(values) => setForm((prev) => ({ ...prev, ...values }))}
          onNext={nextFromChurchInfo}
          onCheckUsername={checkUsernameAvailability}
          disabled={!canSubmit}
          error={error}
          fieldErrors={fieldErrors}
        />
      ) : null}

      {step === 2 ? (
        <AdminAccountForm
          values={{
            password: form.password,
            confirmPassword: form.confirmPassword,
            acceptTerms: form.acceptTerms
          }}
          onChange={(values) => setForm((prev) => ({ ...prev, ...values }))}
          onBack={() => setStep(1)}
          onNext={nextFromAdminInfo}
          disabled={!canSubmit}
          error={error}
          fieldErrors={fieldErrors}
        />
      ) : null}

      {step === 3 ? (
        <WithdrawalSetupForm
          values={{
            withdrawal_method: form.withdrawal_method,
            withdrawal_number: form.withdrawal_number,
            logo: form.logo
          }}
          onChange={(values) => setForm((prev) => ({ ...prev, ...values }))}
          onBack={() => setStep(2)}
          onSubmit={() => void beginOtpOrRegister()}
          disabled={!canSubmit}
          error={error}
          fieldErrors={fieldErrors}
        />
      ) : null}

      {step === 4 ? (
        <RegisterOtpStep
          maskedPhone={maskedPhone}
          challengeMessage={challengeMessage}
          isSubmitting={isSubmitting}
          isResending={isRequestingOtp}
          error={error}
          onBack={() => {
            setStep(3);
            setChallengeId(null);
            setError(null);
          }}
          onResend={() => void resendOtp()}
          onVerify={(code) => void verifyAndRegister(code)}
        />
      ) : null}
    </div>
  );
};
