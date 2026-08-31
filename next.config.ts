import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    inlineCss: true,
    useOffline: true,
  },
  async headers() {
    return [
      {
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
        source: '/covers/:path*',
      },
    ];
  },
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      '*.wgsl': {
        as: '*.js',
        loaders: ['@vgpu/wgsl/loader-webpack'],
      },
    },
  },
  typedRoutes: true,
};

export default nextConfig;
