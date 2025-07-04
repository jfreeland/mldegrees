// Client-side and Edge Runtime metrics storage (simple counters)
const clientMetrics = {
  pageViews: new Map<string, number>(),
  apiCalls: new Map<string, { count: number; totalDuration: number }>(),
  httpRequests: new Map<string, { count: number; totalDuration: number }>(),
  inFlightRequests: 0,
};

// Client-side metrics interface (no server-side prom-client dependency)
export const metrics = {
  // Page view tracking
  recordPageView: (route: string) => {
    const current = clientMetrics.pageViews.get(route) || 0;
    clientMetrics.pageViews.set(route, current + 1);
  },

  // API call tracking
  recordApiCall: (endpoint: string, method: string, status: string, duration: number) => {
    const key = `${method}:${endpoint}:${status}`;
    const current = clientMetrics.apiCalls.get(key) || { count: 0, totalDuration: 0 };
    clientMetrics.apiCalls.set(key, {
      count: current.count + 1,
      totalDuration: current.totalDuration + duration,
    });
  },

  // HTTP request tracking
  recordHttpRequest: (method: string, route: string, statusCode: string, duration: number) => {
    const key = `${method}:${route}:${statusCode}`;
    const current = clientMetrics.httpRequests.get(key) || { count: 0, totalDuration: 0 };
    clientMetrics.httpRequests.set(key, {
      count: current.count + 1,
      totalDuration: current.totalDuration + duration,
    });
  },

  // In-flight request tracking
  incrementInFlight: () => {
    clientMetrics.inFlightRequests++;
  },

  decrementInFlight: () => {
    clientMetrics.inFlightRequests = Math.max(0, clientMetrics.inFlightRequests - 1);
  },

  // Get client-side metrics in Prometheus format
  getClientMetrics: () => {
    const lines: string[] = [];

    // Page views
    clientMetrics.pageViews.forEach((count, route) => {
      lines.push(`nextjs_page_views_total{route="${route}"} ${count}`);
    });

    // API calls
    clientMetrics.apiCalls.forEach((data, key) => {
      const [method, endpoint, status] = key.split(':');
      lines.push(`nextjs_api_calls_total{endpoint="${endpoint}",method="${method}",status="${status}"} ${data.count}`);
      lines.push(`nextjs_api_call_duration_seconds_sum{endpoint="${endpoint}",method="${method}",status="${status}"} ${data.totalDuration}`);
    });

    // HTTP requests
    clientMetrics.httpRequests.forEach((data, key) => {
      const [method, route, statusCode] = key.split(':');
      lines.push(`nextjs_http_requests_total{method="${method}",route="${route}",status_code="${statusCode}"} ${data.count}`);
      lines.push(`nextjs_http_request_duration_seconds_sum{method="${method}",route="${route}",status_code="${statusCode}"} ${data.totalDuration}`);
    });

    // In-flight requests
    lines.push(`nextjs_http_requests_in_flight ${clientMetrics.inFlightRequests}`);

    return lines.join('\n');
  },
};
