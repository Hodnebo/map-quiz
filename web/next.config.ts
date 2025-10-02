import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only use static export and base path for production builds
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
    basePath: '/map-quiz',
    assetPrefix: '/map-quiz/',
  }),
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
