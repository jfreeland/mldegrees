import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Import server metrics only in API route (server-side)
    const { serverMetrics } = await import('@/lib/server-metrics');

    const promMetrics = await serverMetrics.register.metrics();

    return new NextResponse(promMetrics, {
      status: 200,
      headers: {
        'Content-Type': serverMetrics.register.contentType,
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return new NextResponse('Error generating metrics', { status: 500 });
  }
}
