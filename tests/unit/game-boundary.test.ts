import { describe, expect, it } from 'vitest'

import { GAME_CORE_BOUNDARY } from '@/game/core/foundation'

describe('game core boundary', () => {
  it('executes as pure TypeScript', () => {
    expect(GAME_CORE_BOUNDARY).toBe('framework-independent')
  })
})
