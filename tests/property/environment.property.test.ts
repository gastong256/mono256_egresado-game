import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { parsePublicEnvironment } from '@/config/env-schema'

const publicEndpoint = fc.webUrl().filter((value) => {
  const url = new URL(value)
  return (
    url.username.length === 0 &&
    url.password.length === 0 &&
    url.hash.length === 0
  )
})

describe('public Supabase environment property', () => {
  it('accepts exactly zero or two public Supabase values', () => {
    fc.assert(
      fc.property(
        publicEndpoint,
        fc.string({ minLength: 1 }).map((suffix) => `sb_publishable_${suffix}`),
        fc.boolean(),
        fc.boolean(),
        (url, key, includeUrl, includeKey) => {
          const source = {
            NEXT_PUBLIC_SUPABASE_URL: includeUrl ? url : undefined,
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: includeKey ? key : undefined,
          }

          if (includeUrl === includeKey) {
            expect(() => parsePublicEnvironment(source)).not.toThrow()
          } else {
            expect(() => parsePublicEnvironment(source)).toThrow()
          }
        },
      ),
      { numRuns: 200 },
    )
  })
})
