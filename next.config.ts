import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.galaxycine.vn',
        port: '',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
