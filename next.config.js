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

module.exports = nextConfig
