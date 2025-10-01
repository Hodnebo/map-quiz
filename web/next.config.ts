import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // GitHub Pages serves from a subdirectory, we'll set this if needed
  // basePath: '/map-quiz',
  // assetPrefix: '/map-quiz/',
};

export default nextConfig;
