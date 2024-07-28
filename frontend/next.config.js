/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['avatars.githubusercontent.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3333',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*',
        port: '',
        pathname: '/uploads/**',
      },
    ],
  },
  output: 'standalone',
}

module.exports = nextConfig
