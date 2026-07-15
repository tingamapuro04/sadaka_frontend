import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../../config/api.config';
import type { PaymentPageData, PaymentSubmission, PaymentResponse } from '../types';
import type { ApiError } from '../../../types/api.types';

export const usePaymentData = (username: string) => {
  return useQuery<PaymentPageData, ApiError>({
    queryKey: ['paymentData', username],
    queryFn: async () => {
      const response = await apiClient.get<PaymentPageData>(API_ENDPOINTS.payByUsername(username));
      return response.data;
    },
    enabled: !!username
  });
};

export const useSubmitPayment = (username: string) => {
  return useMutation<PaymentResponse, ApiError, PaymentSubmission>({
    mutationFn: async (submission) => {
      const response = await apiClient.post<PaymentResponse>(
        API_ENDPOINTS.payByUsername(username),
        submission
      );
      return response.data;
    }
  });
};

function resolveStatusUrl(username: string, payment: PaymentResponse): string {
  if (payment.status_url?.startsWith('http')) {
    return payment.status_url;
  }
  const path =
    payment.status_url || API_ENDPOINTS.payTransaction(username, payment.transaction_id);
  return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
}

export const usePaymentStatusPolling = (
  username: string,
  payment: PaymentResponse | null,
  enabled: boolean
) => {
  const [timedOut, setTimedOut] = useState(false);
  const maxPollSeconds = payment?.max_poll_seconds ?? 90;
  const pollIntervalSeconds = payment?.poll_interval_seconds ?? 3;

  useEffect(() => {
    if (!enabled || !payment || payment.status !== 'awaiting_payment') {
      setTimedOut(false);
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setTimedOut(true);
    }, maxPollSeconds * 1000);

    return () => window.clearTimeout(timeout);
  }, [enabled, maxPollSeconds, payment]);

  const query = useQuery<PaymentResponse, ApiError>({
    queryKey: ['paymentStatus', username, payment?.transaction_id],
    queryFn: async () => {
      if (!payment) {
        throw new Error('Missing payment context');
      }
      const response = await apiClient.get<PaymentResponse>(
        resolveStatusUrl(username, payment)
      );
      return response.data;
    },
    enabled: enabled && !!payment && payment.status === 'awaiting_payment' && !timedOut,
    refetchInterval: (currentQuery) => {
      const status = currentQuery.state.data?.status ?? payment?.status;
      if (!status || status !== 'awaiting_payment' || timedOut) {
        return false;
      }
      return pollIntervalSeconds * 1000;
    },
    refetchIntervalInBackground: true
  });

  return { ...query, timedOut };
};
