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
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) return [];
    return [
      { source: '/api/v1/:path*', destination: `${backendUrl}/api/v1/:path*` },
    ];
  },
};

module.exports = nextConfig;
