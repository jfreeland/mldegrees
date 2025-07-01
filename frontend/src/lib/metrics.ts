// Server-side metrics (only available in Node.js environment)
let dogstatsd: any = null;

if (typeof window === 'undefined') {
  // Only import hot-shots on the server side
  try {
    const StatsD = require('hot-shots');

    // Get DogStatsD configuration from environment
    const host = process.env.DD_AGENT_HOST || 'localhost';
    const port = parseInt(process.env.DD_DOGSTATSD_PORT || '8125');

    dogstatsd = new StatsD({
      host,
      port,
      prefix: 'nextjs.',
      globalTags: {
        service: 'mldegrees-frontend',
        env: process.env.NODE_ENV || 'development',
      },
    });

    console.log(`DogStatsD client initialized, sending to ${host}:${port}`);
  } catch (error) {
    console.warn('Failed to initialize DogStatsD client:', error);
  }
}

// Client-side metrics storage (simple counters for browser)
const clientMetrics = {
  pageViews: new Map<string, number>(),
  apiCalls: new Map<string, { count: number; totalDuration: number }>(),
  httpRequests: new Map<string, { count: number; totalDuration: number }>(),
};

// Unified interface for both client and server
export const metrics = {
  // Page view tracking
  recordPageView: (route: string) => {
    if (dogstatsd) {
      dogstatsd.increment('page.views', 1, { route });
    } else {
      const current = clientMetrics.pageViews.get(route) || 0;
      clientMetrics.pageViews.set(route, current + 1);
    }
  },

  // API call tracking
  recordApiCall: (endpoint: string, method: string, status: string, duration: number) => {
    if (dogstatsd) {
      dogstatsd.increment('api.calls.total', 1, { endpoint, method, status });
      dogstatsd.timing('api.call.duration', duration * 1000, { endpoint, method, status }); // Convert to ms
    } else {
      const key = `${method}:${endpoint}:${status}`;
      const current = clientMetrics.apiCalls.get(key) || { count: 0, totalDuration: 0 };
      clientMetrics.apiCalls.set(key, {
        count: current.count + 1,
        totalDuration: current.totalDuration + duration,
      });
    }
  },

  // HTTP request tracking
  recordHttpRequest: (method: string, route: string, statusCode: string, duration: number) => {
    if (dogstatsd) {
      dogstatsd.increment('http.requests.total', 1, { method, route, status_code: statusCode });
      dogstatsd.timing('http.request.duration', duration * 1000, { method, route, status_code: statusCode }); // Convert to ms
    } else {
      const key = `${method}:${route}:${statusCode}`;
      const current = clientMetrics.httpRequests.get(key) || { count: 0, totalDuration: 0 };
      clientMetrics.httpRequests.set(key, {
        count: current.count + 1,
        totalDuration: current.totalDuration + duration,
      });
    }
  },

  // In-flight request tracking (server only)
  incrementInFlight: () => {
    if (dogstatsd) {
      dogstatsd.increment('http.requests.in_flight', 1);
    }
  },

  decrementInFlight: () => {
    if (dogstatsd) {
      dogstatsd.decrement('http.requests.in_flight', 1);
    }
  },

  // Get metrics for export (legacy support)
  getMetrics: async () => {
    // For DogStatsD, metrics are pushed directly to the agent
    // Return client-side metrics in simple format for debugging
    const lines: string[] = [];

    if (!dogstatsd) {
      // Page views
      clientMetrics.pageViews.forEach((count, route) => {
        lines.push(`page_views{route="${route}"} ${count}`);
      });

      // API calls
      clientMetrics.apiCalls.forEach((data, key) => {
        const [method, endpoint, status] = key.split(':');
        lines.push(`api_calls{endpoint="${endpoint}",method="${method}",status="${status}"} ${data.count}`);
        lines.push(`api_call_duration_sum{endpoint="${endpoint}",method="${method}",status="${status}"} ${data.totalDuration}`);
      });

      // HTTP requests
      clientMetrics.httpRequests.forEach((data, key) => {
        const [method, route, statusCode] = key.split(':');
        lines.push(`http_requests{method="${method}",route="${route}",status_code="${statusCode}"} ${data.count}`);
        lines.push(`http_request_duration_sum{method="${method}",route="${route}",status_code="${statusCode}"} ${data.totalDuration}`);
      });
    }

    return lines.join('\n') || 'Metrics are being sent to DogStatsD agent';
  },

  // Get register for server-side use (legacy support)
  getRegister: () => {
    return null; // DogStatsD doesn't use a register
  },
};
