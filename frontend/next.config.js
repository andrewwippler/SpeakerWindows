/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  output: 'standalone',
  publicRuntimeConfig: {
    // remove private variables from processEnv
    // thanks to https://github.com/benmarte/nextjs-docker/blob/78cc2cec88ee1ecb203d46e2f83a1243ce61f94f/next.config.js
    processEnv: Object.fromEntries(
      Object.entries(process.env).filter(([key]) =>
        key.includes('NEXT_PUBLIC_')
      )
    ),
  },
}

module.exports = nextConfig
