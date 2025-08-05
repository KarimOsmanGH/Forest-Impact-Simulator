import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // For forest-impact-simulator.github.io, we don't need basePath
  basePath: '',
  assetPrefix: '',
};

export default nextConfig;
