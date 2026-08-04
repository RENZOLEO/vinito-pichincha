import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/wheelwright/:path*',
        destination: 'https://vinito-wheelwright-production.up.railway.app/:path*',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/administracion/:path*',
        destination: 'https://vinito-gestion-production.up.railway.app/:path*',
      },
      {
        source: '/carta/pichincha',
        destination: '/carta',
      },
    ];
  },
};

export default nextConfig;
