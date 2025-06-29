'use client';

import { usePageTracking } from '@/hooks/useMetrics';

export default function MetricsProvider({ children }: { children: React.ReactNode }) {
  usePageTracking();

  return <>{children}</>;
}
