import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/wheelwright/:path*',
        destination: 'https://vinito-wheelwright-production.up.railway.app/:path*',
      },
    ];
  },
};

export default nextConfig;
