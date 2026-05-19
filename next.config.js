/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./gtfs_data/**/*'],
    },
  },
  // Suppress specific warnings from dependencies
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prisma requires these to be marked as externals
      config.externals = [...(config.externals || []), '@prisma/client', 'prisma'];
    }
    return config;
  },
}

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

module.exports = withPWA(nextConfig);
