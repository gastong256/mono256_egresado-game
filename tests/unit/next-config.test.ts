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

describe('Competition configuration is validated at build time', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('rejects an identity secret without enough entropy', async () => {
    // Un secreto corto protege un dato de baja entropía con una llave débil.
    // Tiene que romper el build, no la feria.
    vi.stubEnv('PARTICIPANT_IDENTITY_SECRET', 'corto')
    vi.resetModules()

    await expect(import('../../next.config')).rejects.toThrow(
      /PARTICIPANT_IDENTITY_SECRET/u,
    )
  })

  it('rejects an organizer credential that is not a scrypt digest', async () => {
    vi.stubEnv('EGRESADO_ORGANIZER_USERNAME', 'organizador')
    vi.stubEnv('EGRESADO_ORGANIZER_PASSWORD_HASH', 'la-contraseña-en-claro')
    vi.resetModules()

    await expect(import('../../next.config')).rejects.toThrow(
      /EGRESADO_ORGANIZER_PASSWORD_HASH/u,
    )
  })

  it('rejects an organizer username without its digest', async () => {
    // Un usuario sin digest no es una credencial: es media credencial, y la
    // mitad que falta es la que autentica.
    vi.stubEnv('EGRESADO_ORGANIZER_USERNAME', 'organizador')
    vi.stubEnv('EGRESADO_ORGANIZER_PASSWORD_HASH', '')
    vi.resetModules()

    await expect(import('../../next.config')).rejects.toThrow(
      /EGRESADO_ORGANIZER_PASSWORD_HASH/u,
    )
  })
})
