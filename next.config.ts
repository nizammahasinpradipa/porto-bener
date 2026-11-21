import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/rapier', 'meshline'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'hls.js': false,
    };
    return config;
  },
};

export default nextConfig;
