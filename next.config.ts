import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/wheelwright/api/:path*',
          destination: 'https://vinito-wheelwright-production.up.railway.app/api/:path*',
        },
        {
          source: '/wheelwright/:path*',
          destination: 'https://vinito-wheelwright-production.up.railway.app/:path*',
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      {
        source: '/wheelwright/:path*',
        headers: [
          {
            key: 'x-forwarded-host',
            value: 'vinitorosario.com',
          },
        ],
      },
    ];
  },
};

export default nextConfig;