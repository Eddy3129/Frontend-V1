import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack is now the default bundler in Next.js 16
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: '*.mypinata.cloud',
      },
    ],
  },
}

export default nextConfig
