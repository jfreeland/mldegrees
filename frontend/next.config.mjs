/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/:path*',
        destination: '/api/not-found',
      },
    ];
  },
};

export default nextConfig;
