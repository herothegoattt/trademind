const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone for Docker/Fly.io; Vercel ignores this
  output: process.env.VERCEL ? undefined : 'standalone',

  reactStrictMode: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  webpack(config) {
    // Explicit @ alias so webpack never depends on tsconfig paths resolution
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },

  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },

  async rewrites() {
    // In production, BACKEND_INTERNAL_URL is the FastAPI server's direct URL
    // (e.g. http://YOUR_VPS_IP:8000 or https://api.trademindtech.com).
    // In development it falls back to localhost.
    const backend = process.env.BACKEND_INTERNAL_URL || 'http://localhost:8000';
    return [
      { source: '/api/v1/:path*', destination: `${backend}/api/v1/:path*` },
    ];
  },
};

module.exports = nextConfig;
