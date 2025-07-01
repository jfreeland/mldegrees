import { NextRequest, NextResponse } from 'next/server';
import { metrics } from '@/lib/metrics';

export async function GET(request: NextRequest) {
  try {
    const metricsData = await metrics.getMetrics();

    return new NextResponse(metricsData, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return new NextResponse('Error generating metrics', { status: 500 });
  }
}
