import { NextRequest, NextResponse } from 'next/server';
import { metrics } from '@/lib/metrics';
import { logger } from '@/lib/logger';

export function middleware(request: NextRequest) {
  const start = Date.now();
  const { pathname, search } = request.nextUrl;
  const method = request.method;
  const fullUrl = pathname + search;

  // Increment in-flight requests
  metrics.incrementInFlight();

  const response = NextResponse.next();

  // Calculate duration and log completion
  const duration = Date.now() - start;
  const statusCode = response.status;
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  const isMainPage = pathname === '/';

  if (isMainPage) {
    logger.info(`${clientIP} - ${method} ${fullUrl} ${statusCode} ${duration}ms`);
  }

  // Record metrics
  metrics.recordHttpRequest(method, pathname, statusCode.toString(), duration);
  metrics.decrementInFlight();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
