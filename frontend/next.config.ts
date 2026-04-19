import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  distDir: '../.next',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'supabase.co' },
    ],
  },
}

export default nextConfig
