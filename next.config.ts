import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/wheelwright/:path*',
        destination: 'https://vinito-wheelwright-production.up.railway.app/:path*',
        permanent: false,
      },
      {
        source: '/administracion/:path*',
        destination: 'https://vinito-gestion-production.up.railway.app/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
