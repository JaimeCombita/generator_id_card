/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    outputFileTracingIncludes: {
      '/api/generate': ['./node_modules/@sparticuz/chromium/**'],
      '/api/generate/route': ['./node_modules/@sparticuz/chromium/**'],
    },
  },
}

module.exports = nextConfig
