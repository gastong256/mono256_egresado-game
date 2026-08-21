import { describe, expect, it } from 'vitest'

import {
  EnvironmentValidationError,
  parsePublicEnvironment,
  parseServerEnvironment,
} from '@/config/env-schema'

describe('environment validation', () => {
  it('uses a local application URL when optional infrastructure is disabled', () => {
    expect(parsePublicEnvironment({})).toEqual({
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    })
  })

  it('accepts separate browser and internal Supabase endpoints', () => {
    expect(
      parseServerEnvironment({
        NODE_ENV: 'development',
        NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_local',
        SUPABASE_INTERNAL_URL: 'http://host.docker.internal:54321',
        SUPABASE_SECRET_KEY: 'sb_secret_local',
      }),
    ).toMatchObject({
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      SUPABASE_INTERNAL_URL: 'http://host.docker.internal:54321',
    })
  })

  it('rejects partial public Supabase configuration without echoing a value', () => {
    const secretValue = 'https://do-not-echo.example.test'

    expect(() =>
      parsePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: secretValue,
      }),
    ).toThrow(EnvironmentValidationError)

    try {
      parsePublicEnvironment({ NEXT_PUBLIC_SUPABASE_URL: secretValue })
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentValidationError)
      expect(String(error)).not.toContain(secretValue)
    }
  })

  it('rejects a privileged key without any Supabase endpoint', () => {
    expect(() =>
      parseServerEnvironment({
        SUPABASE_SECRET_KEY: 'sb_secret_local',
      }),
    ).toThrow(/SUPABASE_INTERNAL_URL/)
  })

  it('rejects non-HTTP endpoint schemes', () => {
    expect(() =>
      parsePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: 'file:///tmp/database',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_local',
      }),
    ).toThrow(EnvironmentValidationError)
  })

  it.each([
    'https://user:password@example.test',
    'https://example.test#embedded-secret',
  ])('rejects unsafe public URL form without echoing it: %s', (value) => {
    try {
      parsePublicEnvironment({ NEXT_PUBLIC_APP_URL: value })
      expect.unreachable('unsafe URL should have failed validation')
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentValidationError)
      expect(String(error)).not.toContain(value)
    }
  })
})
