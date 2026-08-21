import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: [
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
      'tests/component/**/*.{test,spec}.{ts,tsx}',
      'tests/integration/**/*.{test,spec}.{ts,tsx}',
      'tests/property/**/*.{test,spec}.{ts,tsx}',
    ],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: [
        'src/app/api/health/route.ts',
        'src/components/**/*.tsx',
        'src/config/env-schema.ts',
        'src/game/**/*.{ts,tsx,mts}',
      ],
      thresholds: {
        branches: 75,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
  },
})
