import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: '/Forest-Impact-Simulator',
  assetPrefix: '/Forest-Impact-Simulator/',
};

export default nextConfig;
