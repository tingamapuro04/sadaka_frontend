import { describe, expect, it } from 'vitest';
import {
  formatOtpChallengeMessage,
  loginCredentialErrorMessage,
  otpErrorMessage
} from '../src/utils/auth-errors';

describe('auth error helpers', () => {
  it('maps SMS gateway failures for login start', () => {
    expect(loginCredentialErrorMessage({ status: 502 })).toMatch(/could not send the SMS/i);
    expect(loginCredentialErrorMessage({ status: 503 })).toMatch(/not configured|not available|disabled/i);
    expect(loginCredentialErrorMessage({ status: 429 })).toMatch(/too many login/i);
    expect(loginCredentialErrorMessage({ status: 401 })).toBe('Invalid phone or password');
  });

  it('maps OTP verify and resend failures', () => {
    expect(otpErrorMessage({ status: 401 }, 'verify')).toMatch(/invalid or expired/i);
    expect(otpErrorMessage({ status: 429 }, 'verify')).toMatch(/too many otp/i);
    expect(
      otpErrorMessage({ status: 429, message: 'Please wait before requesting another OTP.' }, 'resend')
    ).toMatch(/wait before requesting/i);
    expect(otpErrorMessage({ status: 502 }, 'resend')).toMatch(/could not send/i);
  });

  it('formats challenge message with masked phone', () => {
    const expires = new Date('2030-01-01T12:30:00Z').toISOString();
    expect(formatOtpChallengeMessage('2547*****678', expires)).toContain('2547*****678');
  });
});
