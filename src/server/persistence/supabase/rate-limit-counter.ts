import 'server-only'

import { createPrivilegedSupabaseClient } from './privileged-client'
import type { RateLimitCounter } from '@/server/security/rate-limit'

type Client = ReturnType<typeof createPrivilegedSupabaseClient>

/** The same atomic RPC as competition, without a CompetitionStore capability. */
export async function incrementRateLimit(
  client: Client,
  bucket: string,
  windowStart: string,
): Promise<number> {
  const { data, error } = await client.rpc('competition_bump_rate_limit', {
    p_bucket: bucket,
    p_window_start: windowStart,
  })
  if (error) throw new Error('rate limit counter unavailable')
  return Number(data ?? 0)
}

export function createDatabaseRateLimitCounter(): RateLimitCounter {
  const client = createPrivilegedSupabaseClient()
  return {
    incrementRateLimit: (bucket, windowStart) =>
      incrementRateLimit(client, bucket, windowStart),
  }
}
