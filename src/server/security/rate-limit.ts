import 'server-only'

import { createHash } from 'node:crypto'

/** Security infrastructure: this port cannot read or write game entities. */
export interface RateLimitCounter {
  incrementRateLimit(bucket: string, windowStart: string): Promise<number>
}

export interface RateLimitPolicy {
  readonly windowSeconds: number
  readonly limit: number
}

export function clientFingerprint(secret: string, address: string): string {
  return createHash('sha256')
    .update(`${secret}:rate:${address}`, 'utf8')
    .digest('hex')
    .slice(0, 32)
}

/** Failure handling belongs to the caller: practice fails closed, fair does not. */
export async function consumeRateLimit(
  counter: RateLimitCounter,
  now: Date,
  operation: string,
  subject: string,
  policy: RateLimitPolicy,
): Promise<boolean> {
  const seconds = Math.floor(now.getTime() / 1000)
  const aligned = seconds - (seconds % policy.windowSeconds)
  const hits = await counter.incrementRateLimit(
    `${operation}:${subject}`,
    new Date(aligned * 1000).toISOString(),
  )
  return hits <= policy.limit
}
