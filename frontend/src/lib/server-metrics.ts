// Server-only metrics using prom-client
// This file should only be imported in server-side code (API routes)

import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Set default labels for all metrics
register.setDefaultLabels({
  service: 'mldegrees-frontend',
  version: process.env.npm_package_version || 'unknown'
});

// Initialize default metrics collection
collectDefaultMetrics();

// Define custom metrics
const httpRequestsTotal = new Counter({
  name: 'nextjs_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new Histogram({
  name: 'nextjs_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const httpRequestsInFlight = new Gauge({
  name: 'nextjs_http_requests_in_flight',
  help: 'Number of HTTP requests currently being processed',
});

const pageViews = new Counter({
  name: 'nextjs_page_views_total',
  help: 'Total number of page views',
  labelNames: ['route'],
});

const apiCallsTotal = new Counter({
  name: 'nextjs_api_calls_total',
  help: 'Total number of API calls made from frontend',
  labelNames: ['endpoint', 'method', 'status'],
});

const apiCallDuration = new Histogram({
  name: 'nextjs_api_call_duration_seconds',
  help: 'Duration of API calls in seconds',
  labelNames: ['endpoint', 'method', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const serverMetrics = {
  httpRequestsTotal,
  httpRequestDuration,
  httpRequestsInFlight,
  pageViews,
  apiCallsTotal,
  apiCallDuration,
  register,
};
