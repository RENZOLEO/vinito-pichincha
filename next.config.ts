import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/wheelwright/:path*',
        destination: 'https://wheelwright.vinitorosario.com/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;