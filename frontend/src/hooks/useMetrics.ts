'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { metrics } from '@/lib/metrics';
import { logger } from '@/lib/logger';

export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view
    metrics.recordPageView(pathname);
    logger.pageView(pathname, {
      userAgent: navigator.userAgent,
      referrer: document.referrer,
    });
  }, [pathname]);
}

export function useApiTracking() {
  const trackApiCall = async (
    endpoint: string,
    method: string,
    apiCall: () => Promise<Response>
  ): Promise<Response> => {
    const start = Date.now();

    try {
      const response = await apiCall();
      const duration = (Date.now() - start) / 1000;
      const status = response.status.toString();

      // Track metrics
      metrics.recordApiCall(endpoint, method, status, duration);

      // Log the API call
      logger.apiCall(method, endpoint, response.status, duration * 1000);

      return response;
    } catch (error) {
      const duration = (Date.now() - start) / 1000;

      // Track failed API call
      metrics.recordApiCall(endpoint, method, 'error', duration);

      // Log the error
      logger.error(`API call failed: ${method} ${endpoint}`, { duration }, error as Error);

      throw error;
    }
  };

  return { trackApiCall };
}
