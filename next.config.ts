import type { NextConfig } from 'next';

const coverStudio = process.env.COVER_STUDIO === '1';

const nextConfig: NextConfig = {
  ...(coverStudio ? { distDir: '.next-cover-studio', typescript: { tsconfigPath: 'tsconfig.cover-studio.json' } } : {}),
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
