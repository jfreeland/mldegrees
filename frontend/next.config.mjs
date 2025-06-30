/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  devIndicators: {
    buildActivity: false,
  },
};

export default nextConfig;
