import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
    // Enable instrumentation for logging
  },
  /* config options here */
};

export default nextConfig;
