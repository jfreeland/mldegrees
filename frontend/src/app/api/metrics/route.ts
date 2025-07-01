import { NextRequest, NextResponse } from 'next/server';
import { metrics } from '@/lib/metrics';

export async function GET(request: NextRequest) {
  try {
    const promMetrics = await metrics.getMetrics();
    const register = metrics.getRegister();

    if (!register) {
      return new NextResponse('Metrics are not available', { status: 500 });
    }

    return new NextResponse(promMetrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return new NextResponse('Error generating metrics', { status: 500 });
  }
}
