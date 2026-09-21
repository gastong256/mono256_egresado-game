import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

/*
 * Las credenciales locales llegan a los tests desde `.env.local`.
 *
 * Next.js lo lee solo para la aplicación, pero Vitest arranca con el entorno
 * pelado, así que sin esto la suite de contrato de persistencia no encontraría
 * la base y se saltaría su mitad de Postgres **en silencio** — que es la peor
 * forma posible de quedarse sin cobertura, porque se ve verde.
 *
 * El parseo es deliberadamente literal: sin expansión de `$variable`, que es lo
 * que truncaba el digest del organizador cuando el separador era `$`. Lo que ya
 * esté en el entorno gana, de modo que un pipeline pasa los suyos.
 */
function readEnvironmentFiles(): Record<string, string> {
  const values: Record<string, string> = {}
  for (const file of ['.env', '.env.local']) {
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (trimmed.length === 0 || trimmed.startsWith('#')) continue
      const separator = trimmed.indexOf('=')
      if (separator === -1) continue
      const key = trimmed.slice(0, separator).trim()
      let value = trimmed.slice(separator + 1).trim()
      if (
        value.length >= 2 &&
        value[0] === value[value.length - 1] &&
        (value.startsWith("'") || value.startsWith('"'))
      ) {
        value = value.slice(1, -1)
      }
      values[key] = process.env[key] ?? value
    }
  }
  return values
}

const fileEnvironment = readEnvironmentFiles()

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // See tests/stubs/server-only.ts for why this alias is safe.
      'server-only': fileURLToPath(
        new URL('./tests/stubs/server-only.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    env: fileEnvironment,
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
