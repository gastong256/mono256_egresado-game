import 'server-only'

import { randomBytes } from 'node:crypto'
import { getServerEnvironment } from '@/config/env.server'
import { createDatabaseRateLimitCounter } from '@/server/persistence/supabase/rate-limit-counter'
import {
  clientFingerprint,
  consumeRateLimit,
  type RateLimitCounter,
  type RateLimitPolicy,
} from '@/server/security/rate-limit'

/** practice-limits-v1: shared school NATs, including retries after Wi-Fi loss. */
export const PRACTICE_RATE_LIMITS = {
  issue: { windowSeconds: 300, limit: 120 },
  verify: { windowSeconds: 300, limit: 240 },
} as const satisfies Readonly<Record<string, RateLimitPolicy>>

export type PracticeOperation = keyof typeof PRACTICE_RATE_LIMITS
export interface PracticeRuntime {
  allow(operation: PracticeOperation, request: Request): Promise<boolean>
}

// Only for local development without DB. Expired windows are pruned; cardinality
// is bounded too, so even arbitrary forwarded headers cannot grow this forever.
const localCounters = new Map<string, { hits: number; start: number }>()
const localSecret = randomBytes(32).toString('hex')
const localCounter: RateLimitCounter = {
  async incrementRateLimit(bucket, windowStart) {
    const start = Date.parse(windowStart)
    for (const [key, value] of localCounters) {
      if (value.start !== start) localCounters.delete(key)
    }
    const previous = localCounters.get(bucket)
    if (previous === undefined && localCounters.size >= 2048) {
      throw new Error('local practice counter capacity')
    }
    const hits = (previous?.hits ?? 0) + 1
    localCounters.set(bucket, { hits, start })
    return hits
  },
}

export function createPracticeRuntime(): PracticeRuntime {
  const env = getServerEnvironment()
  const hasDatabase = Boolean(
    env.SUPABASE_SECRET_KEY &&
    (env.SUPABASE_INTERNAL_URL ?? env.NEXT_PUBLIC_SUPABASE_URL),
  )
  const local =
    (env.EGRESADO_ENVIRONMENT ??
      (env.NODE_ENV === 'production' ? 'production' : 'local')) === 'local'
  if (!hasDatabase && !local) {
    throw new Error('practice rate limiter unavailable')
  }
  const counter = hasDatabase ? createDatabaseRateLimitCounter() : localCounter
  const secret =
    env.PARTICIPANT_IDENTITY_SECRET ?? env.SUPABASE_SECRET_KEY ?? localSecret
  return {
    async allow(operation, request) {
      // Same trusted reverse-proxy contract as the existing deployment.
      const address =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip') ??
        'desconocido'
      const subject = clientFingerprint(`${secret}:practice-v1`, address)
      return consumeRateLimit(
        counter,
        new Date(),
        `practice:${operation}`,
        subject,
        PRACTICE_RATE_LIMITS[operation],
      )
    },
  }
}
