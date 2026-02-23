/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
    outputFileTracingIncludes: {
      '/api/generate': ['./node_modules/@sparticuz/chromium/**'],
      '/api/generate/route': ['./node_modules/@sparticuz/chromium/**'],
    },
  },
}

module.exports = nextConfig
