import { useState } from 'react';
import { API_ENDPOINTS } from '../../../config/api.config';
import { apiClient } from '../../../lib/axios';
import type { RegisterChurchResponse } from '../../../types/api.types';
import { loginCredentialErrorMessage, otpErrorMessage } from '../../../utils/auth-errors';
import { normalizePhone } from '../../../utils/phone';

export type RegistrationFormData = {
  name: string;
  username: string;
  phone: string;
  email: string;
  password: string;
  withdrawal_method: 'phone' | 'till' | 'paybill';
  withdrawal_number: string;
  logo: File | null;
  challenge_id?: string;
  code?: string;
};

export type RegisterOtpChallenge = {
  otp_required: true;
  challenge_id: string;
  expires_at: string;
  delivery_channel: 'sms';
  masked_phone: string;
};

export type RegisterOtpRequestResponse = { otp_required: false } | RegisterOtpChallenge;

export const useChurchRegistration = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestRegisterOtp = async (phone: string): Promise<RegisterOtpRequestResponse | null> => {
    setError(null);
    setIsRequestingOtp(true);
    try {
      const { data } = await apiClient.post<RegisterOtpRequestResponse>(API_ENDPOINTS.registerOtpRequest, {
        phone: normalizePhone(phone)
      });
      return data;
    } catch (err) {
      setError(otpErrorMessage(err, 'resend'));
      return null;
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const registerChurch = async (payload: RegistrationFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', payload.name.trim());
      formData.append('username', payload.username.trim());
      formData.append('phone', normalizePhone(payload.phone.trim()));
      formData.append('password', payload.password);
      formData.append('withdrawal_method', payload.withdrawal_method);
      formData.append('withdrawal_number', payload.withdrawal_number.trim());

      if (payload.email.trim()) {
        formData.append('email', payload.email.trim());
      }

      if (payload.logo) {
        formData.append('logo', payload.logo);
      }

      if (payload.challenge_id) {
        formData.append('challenge_id', payload.challenge_id);
      }
      if (payload.code) {
        formData.append('code', payload.code);
      }

      const { data } = await apiClient.post<RegisterChurchResponse>(API_ENDPOINTS.registerChurch, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      return data;
    } catch (err) {
      const apiError = err as { status?: number; message?: string };
      if (apiError.status === 409) {
        setError(apiError.message?.toLowerCase().includes('phone')
          ? 'That phone number is already registered.'
          : 'That username is already taken.');
      } else if (apiError.status === 401) {
        setError(otpErrorMessage(err, 'verify'));
      } else if (apiError.status === 400) {
        setError(apiError.message ?? 'Please check your input and try again.');
      } else if (apiError.status === 502 || apiError.status === 503) {
        setError(loginCredentialErrorMessage(err));
      } else {
        setError('Registration failed. Please try again.');
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim()) {
      return null;
    }

    try {
      const { data } = await apiClient.get<{ available?: boolean }>(API_ENDPOINTS.usernameAvailability(username));
      if (typeof data.available === 'boolean') {
        return data.available;
      }
      return null;
    } catch {
      return null;
    }
  };

  return {
    isSubmitting,
    isRequestingOtp,
    error,
    setError,
    registerChurch,
    requestRegisterOtp,
    checkUsernameAvailability
  };
};
