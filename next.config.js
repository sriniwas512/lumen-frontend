const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\/sectors\/.*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'sector-cache',
        expiration: { maxEntries: 200 }
      }
    }
  ]
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  }
}

module.exports = withPWA(nextConfig)
