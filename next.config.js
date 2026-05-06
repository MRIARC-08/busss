/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./gtfs_data/**/*'],
    },
  },
}

module.exports = nextConfig
