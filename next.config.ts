import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  async headers() {
    return [
      {
        source: '/covers/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  reactCompiler: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.wgsl': {
        loaders: ['@vgpu/wgsl/loader-webpack'],
        as: '*.js',
      },
    },
  },
  experimental: {
    inlineCss: true,
    useOffline: true,
  },
  typedRoutes: true,
};

export default nextConfig;
