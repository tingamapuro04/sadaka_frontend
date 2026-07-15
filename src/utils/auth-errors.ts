import type { ApiError } from '../types/api.types';

const asApiError = (error: unknown): Partial<ApiError> => {
  if (error && typeof error === 'object') {
    return error as Partial<ApiError>;
  }
  return {};
};

/** User-facing message for login credential failures. */
export const loginCredentialErrorMessage = (error: unknown): string => {
  const { status, message } = asApiError(error);

  if (status === 429) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }
  if (status === 503) {
    if (message && /otp login is disabled/i.test(message)) {
      return 'SMS login is currently disabled. Contact support if this persists.';
    }
    return 'SMS delivery is not configured. Please try again later or contact support.';
  }
  if (status === 502) {
    return 'We could not send the SMS verification code. Please try again in a moment.';
  }
  if (status === 400 && message) {
    return message;
  }

  return 'Invalid phone or password';
};

/** User-facing message for OTP verify / resend failures. */
export const otpErrorMessage = (error: unknown, action: 'verify' | 'resend' = 'verify'): string => {
  const { status, message } = asApiError(error);

  if (status === 429) {
    if (action === 'resend' || (message && /wait before requesting/i.test(message ?? ''))) {
      return 'Please wait before requesting another code.';
    }
    return 'Too many OTP attempts. Please request a new code.';
  }
  if (status === 503) {
    return 'SMS delivery is not available right now. Please try again later.';
  }
  if (status === 502) {
    return 'We could not send the SMS verification code. Please try again.';
  }
  if (status === 400 && message) {
    return message;
  }
  if (action === 'resend') {
    return 'Could not resend the code. Check your connection and try again.';
  }
  return 'Invalid or expired OTP code';
};

export const formatOtpChallengeMessage = (maskedPhone: string, expiresAt: string): string => {
  const expiry = new Date(expiresAt);
  const timeLabel = Number.isNaN(expiry.getTime())
    ? 'soon'
    : expiry.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return `We sent a code to ${maskedPhone}. It expires at ${timeLabel}.`;
};
