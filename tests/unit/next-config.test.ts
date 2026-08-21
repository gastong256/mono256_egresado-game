import { afterEach, describe, expect, it, vi } from 'vitest'

describe('Next.js build environment validation', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('rejects a partial public Supabase pair while loading the config', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    vi.resetModules()

    await expect(import('../../next.config')).rejects.toThrow(
      'Invalid server environment configuration: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    )
  })
})
