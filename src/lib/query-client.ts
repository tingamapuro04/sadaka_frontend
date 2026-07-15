import { QueryClient } from '@tanstack/react-query';
import { CHURCH_DATA_STALE_TIME_MS } from '../config/constants';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prefer longer stale time for relatively static church config
      staleTime: CHURCH_DATA_STALE_TIME_MS,
      // Only retry GETs once; avoid hammering failed endpoints
      retry: (failureCount, error) => {
        const status = (error as { status?: number } | undefined)?.status;
        if (status != null && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    },
    mutations: {
      // Mutations must not auto-retry (payments / withdrawals)
      retry: false
    }
  }
});
