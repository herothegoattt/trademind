/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    // DiceBear returns SVGs, which Next Image blocks by default for security reasons.
    // Enabling `dangerouslyAllowSVG` makes it safe to render avatar SVGs from this trusted source.
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: 'http://localhost:8000/api/v1/:path*' },
    ];
  },
};

module.exports = nextConfig;
