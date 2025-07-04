// Server-side metrics (only available in Node.js environment, not Edge Runtime)
let serverMetrics: any = null;

// Check if we're in a Node.js environment (not Edge Runtime or browser)
// Edge Runtime has EdgeRuntime global, browser has window, Node.js has neither
const isNodeJSRuntime = typeof window === 'undefined' &&
                        typeof (globalThis as any).EdgeRuntime === 'undefined';

if (isNodeJSRuntime) {
  // Only import prom-client in Node.js runtime (not Edge Runtime)
  try {
    const promClient = require('prom-client');
    promClient.collectDefaultMetrics();

    const httpRequestsTotal = new promClient.Counter({
      name: 'nextjs_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    const httpRequestDuration = new promClient.Histogram({
      name: 'nextjs_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    const httpRequestsInFlight = new promClient.Gauge({
      name: 'nextjs_http_requests_in_flight',
      help: 'Number of HTTP requests currently being processed',
    });

    const pageViews = new promClient.Counter({
      name: 'nextjs_page_views_total',
      help: 'Total number of page views',
      labelNames: ['route'],
    });

    const apiCallsTotal = new promClient.Counter({
      name: 'nextjs_api_calls_total',
      help: 'Total number of API calls made from frontend',
      labelNames: ['endpoint', 'method', 'status'],
    });

    const apiCallDuration = new promClient.Histogram({
      name: 'nextjs_api_call_duration_seconds',
      help: 'Duration of API calls in seconds',
      labelNames: ['endpoint', 'method', 'status'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    serverMetrics = {
      httpRequestsTotal,
      httpRequestDuration,
      httpRequestsInFlight,
      pageViews,
      apiCallsTotal,
      apiCallDuration,
      register: promClient.register,
    };
  } catch (error) {
    console.warn('Failed to initialize server metrics:', error);
  }
}

// Edge Runtime and Client-side metrics storage (simple counters)
const edgeMetrics = {
  pageViews: new Map<string, number>(),
  apiCalls: new Map<string, { count: number; totalDuration: number }>(),
  httpRequests: new Map<string, { count: number; totalDuration: number }>(),
  inFlightRequests: 0,
};

// Unified interface for server, edge runtime, and client
export const metrics = {
  // Page view tracking
  recordPageView: (route: string) => {
    if (serverMetrics) {
      serverMetrics.pageViews.inc({ route });
    } else {
      const current = edgeMetrics.pageViews.get(route) || 0;
      edgeMetrics.pageViews.set(route, current + 1);
    }
  },

  // API call tracking
  recordApiCall: (endpoint: string, method: string, status: string, duration: number) => {
    if (serverMetrics) {
      serverMetrics.apiCallsTotal.inc({ endpoint, method, status });
      serverMetrics.apiCallDuration.observe({ endpoint, method, status }, duration);
    } else {
      const key = `${method}:${endpoint}:${status}`;
      const current = edgeMetrics.apiCalls.get(key) || { count: 0, totalDuration: 0 };
      edgeMetrics.apiCalls.set(key, {
        count: current.count + 1,
        totalDuration: current.totalDuration + duration,
      });
    }
  },

  // HTTP request tracking
  recordHttpRequest: (method: string, route: string, statusCode: string, duration: number) => {
    if (serverMetrics) {
      serverMetrics.httpRequestsTotal.inc({ method, route, status_code: statusCode });
      serverMetrics.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    } else {
      const key = `${method}:${route}:${statusCode}`;
      const current = edgeMetrics.httpRequests.get(key) || { count: 0, totalDuration: 0 };
      edgeMetrics.httpRequests.set(key, {
        count: current.count + 1,
        totalDuration: current.totalDuration + duration,
      });
    }
  },

  // In-flight request tracking
  incrementInFlight: () => {
    if (serverMetrics) {
      serverMetrics.httpRequestsInFlight.inc();
    } else {
      edgeMetrics.inFlightRequests++;
    }
  },

  decrementInFlight: () => {
    if (serverMetrics) {
      serverMetrics.httpRequestsInFlight.dec();
    } else {
      edgeMetrics.inFlightRequests = Math.max(0, edgeMetrics.inFlightRequests - 1);
    }
  },

  // Get metrics for export
  getMetrics: async () => {
    if (serverMetrics) {
      return await serverMetrics.register.metrics();
    } else {
      // Return edge/client-side metrics in Prometheus format
      const lines: string[] = [];

      // Page views
      edgeMetrics.pageViews.forEach((count, route) => {
        lines.push(`nextjs_page_views_total{route="${route}"} ${count}`);
      });

      // API calls
      edgeMetrics.apiCalls.forEach((data, key) => {
        const [method, endpoint, status] = key.split(':');
        lines.push(`nextjs_api_calls_total{endpoint="${endpoint}",method="${method}",status="${status}"} ${data.count}`);
        lines.push(`nextjs_api_call_duration_seconds_sum{endpoint="${endpoint}",method="${method}",status="${status}"} ${data.totalDuration}`);
      });

      // HTTP requests
      edgeMetrics.httpRequests.forEach((data, key) => {
        const [method, route, statusCode] = key.split(':');
        lines.push(`nextjs_http_requests_total{method="${method}",route="${route}",status_code="${statusCode}"} ${data.count}`);
        lines.push(`nextjs_http_request_duration_seconds_sum{method="${method}",route="${route}",status_code="${statusCode}"} ${data.totalDuration}`);
      });

      // In-flight requests
      lines.push(`nextjs_http_requests_in_flight ${edgeMetrics.inFlightRequests}`);

      return lines.join('\n');
    }
  },

  // Get register for server-side use
  getRegister: () => {
    return serverMetrics?.register || null;
  },
};
