import { logger } from '@/lib/logger';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation
    logger.info('Next.js server instrumentation initialized', {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV,
    });

    // Override console methods to ensure structured logging in production
    if (process.env.NODE_ENV === 'production') {
      const originalConsole = { ...console };

      console.log = (...args) => {
        logger.info(args.join(' '));
      };

      console.info = (...args) => {
        logger.info(args.join(' '));
      };

      console.warn = (...args) => {
        logger.warn(args.join(' '));
      };

      console.error = (...args) => {
        logger.error(args.join(' '));
      };

      // Keep original methods available
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
