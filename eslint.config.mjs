import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';
import autofix from 'eslint-plugin-autofix';
import sortKeysFix from 'eslint-plugin-sort-keys-fix';

export default defineConfig([
  globalIgnores([
    '.next/**',
    '.next-cover-studio/**',
    '.pnpm-store/**',
    '.vercel/**',
    'generated/**',
    'node_modules/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
    'wgsl-env.d.ts',
  ]),
  ...nextVitals,
  ...nextTypeScript,
  eslintConfigPrettier,
  {
    plugins: {
      autofix,
      'sort-keys-fix': sortKeysFix,
    },
    rules: {
      'sort-keys-fix/sort-keys-fix': 'warn',
    },
    settings: {
      'import/resolver': {
        typescript: true,
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      'arrow-body-style': ['warn', 'as-needed'],
      'autofix/no-unused-vars': [
        'warn',
        {
          args: 'none',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'import/order': [
        'warn',
        {
          alphabetize: { order: 'asc' },
          groups: ['builtin', 'external', 'parent', 'sibling', 'index', 'object', 'type'],
          pathGroups: [{ group: 'parent', pattern: '@/**/**', position: 'before' }],
        },
      ],
      'no-console': 'warn',
      'no-redeclare': 'warn',
      quotes: ['warn', 'single', { avoidEscape: true }],
      'react/display-name': 'error',
      'react/jsx-key': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/self-closing-comp': ['error', { component: true, html: true }],
      'spaced-comment': 'warn',
    },
  },
  {
    // Numbered data tables (synth profiles, motif maps). Alphabetical order would
    // interleave t1/t10/t2 and buys nothing over the authored grouping.
    files: ['lib/audio/**', 'features/artwork/artwork-motif.ts'],
    rules: { 'sort-keys-fix/sort-keys-fix': 'off' },
  },
  {
    // Seed and codegen scripts are CLIs: progress logging is the interface.
    files: ['prisma/**', 'scripts/**'],
    rules: { 'no-console': 'off' },
  },
]);
