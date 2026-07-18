/** @type {import('next').NextConfig} */
const hostUrl = process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3333'
const apiHostname = hostUrl ? new URL(hostUrl).hostname : 'sw-api.wplr.rocks'

const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    hostUrl,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3333',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: apiHostname,
        pathname: '/uploads/**',
      },
    ],
  },
  output: 'standalone',
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
      ],
    },
  ],
}

export default nextConfig
