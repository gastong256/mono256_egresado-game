import { describe, expect, it } from 'vitest'

import { isStablePatchedNextVersion } from '../../scripts/check-release-readiness.mjs'

describe('public release Next.js version policy', () => {
  it.each(['16.3.2-canary.1', '17.0.0-rc.1', '^16.3.2', '16.3', '016.3.2'])(
    'rejects non-exact or prerelease version %s',
    (version) => {
      expect(isStablePatchedNextVersion(version)).toBe(false)
    },
  )

  it('rejects the unpatched local foundation version', () => {
    expect(isStablePatchedNextVersion('16.3.1')).toBe(false)
  })

  it.each(['16.3.2', '16.4.0', '17.0.0'])(
    'accepts stable versions at or above the security floor: %s',
    (version) => {
      expect(isStablePatchedNextVersion(version)).toBe(true)
    },
  )
})
