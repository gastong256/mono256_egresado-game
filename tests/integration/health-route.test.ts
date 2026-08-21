import { describe, expect, it } from 'vitest'

import { GET } from '@/app/api/health/route'

describe('GET /api/health', () => {
  it('returns non-sensitive liveness data without caching', async () => {
    const response = GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      status: 'ok',
      service: 'egresado-web',
    })
  })
})
