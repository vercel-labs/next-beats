import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  ...(process.env.COVER_STUDIO ? { typescript: { tsconfigPath: 'tsconfig.cover-studio.json' } } : {}),
  cacheComponents: true,
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
