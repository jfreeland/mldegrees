import { NextRequest, NextResponse } from 'next/server';
import { metrics } from '@/lib/metrics';

export function middleware(request: NextRequest) {
  const start = Date.now();
  const { pathname, search } = request.nextUrl;
  const method = request.method;
  const fullUrl = pathname + search;

  // Increment in-flight requests
  metrics.incrementInFlight();

  // Log the incoming request
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  console.log(`[${new Date().toISOString()}] Started ${method} ${fullUrl} from ${clientIP}`);

  // Continue with the request
  const response = NextResponse.next();

  // Calculate duration and log completion
  const duration = (Date.now() - start) / 1000;
  const statusCode = response.status.toString();

  console.log(`[${new Date().toISOString()}] Completed ${method} ${fullUrl} ${response.status} in ${duration}s`);

  // Record metrics
  metrics.recordHttpRequest(method, pathname, statusCode, duration);
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
