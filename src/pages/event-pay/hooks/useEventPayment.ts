import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/axios';
import { API_ENDPOINTS } from '../../../config/api.config';
import type { ApiError } from '../../../types/api.types';
import type {
  EventPaymentPageData,
  EventPaymentSubmission,
  PaymentResponse
} from '../types';

export const useEventPaymentData = (username: string, eventSlug: string) => {
  return useQuery<EventPaymentPageData, ApiError>({
    queryKey: ['eventPaymentData', username, eventSlug],
    queryFn: async () => {
      const response = await apiClient.get<EventPaymentPageData>(
        API_ENDPOINTS.eventPay(username, eventSlug)
      );
      return response.data;
    },
    enabled: Boolean(username && eventSlug),
    retry: false
  });
};

export const useSubmitEventPayment = (username: string, eventSlug: string) => {
  return useMutation<PaymentResponse, ApiError, EventPaymentSubmission>({
    mutationFn: async (submission) => {
      const response = await apiClient.post<PaymentResponse>(
        API_ENDPOINTS.eventPay(username, eventSlug),
        submission
      );
      return response.data;
    }
  });
};
