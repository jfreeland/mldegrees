import { logger } from '@/lib/logger';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation
    logger.info('Next.js server instrumentation initialized', {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV,
    });

    // Keep original console methods available for logger to use
    if (process.env.NODE_ENV === 'production') {
      const originalConsole = { ...console };
      (console as any).originalLog = originalConsole.log;
      (console as any).originalInfo = originalConsole.info;
      (console as any).originalWarn = originalConsole.warn;
      (console as any).originalError = originalConsole.error;
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime instrumentation
    logger.info('Next.js edge runtime instrumentation initialized');
  }
}
