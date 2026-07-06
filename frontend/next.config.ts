import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'supabase.co' },
    ],
  },
  webpack: (config, { dev }) => {
    // On Windows the webpack filesystem cache intermittently fails to rename
    // its temp pack file (0.pack.gz_ -> 0.pack.gz) when the file is briefly
    // locked by OneDrive/antivirus, spamming ENOENT warnings. Use the
    // in-memory cache during dev to avoid the disk rename entirely.
    // Production builds keep the default (faster) filesystem cache.
    if (dev) {
      config.cache = { type: 'memory' }
    }
    return config
  },
}

export default nextConfig
