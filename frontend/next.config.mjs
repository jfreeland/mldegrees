/** @type {import('next').NextConfig} */
const nextConfig = {
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
