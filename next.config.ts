import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Static export enabled - API routes moved to separate backend server
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Disable automatic trailing slashes for Capacitor compatibility
  trailingSlash: true,
}

export default nextConfig
