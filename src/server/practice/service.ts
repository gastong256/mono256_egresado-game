import 'server-only'

import { randomBytes, randomUUID } from 'node:crypto'
import {
  createFullCareerDependencies,
  createFullCareerRunDescriptor,
} from '@/content/full-career'
import { canonicalize, parseActionLog, type RunDescriptor } from '@/game'
import { validateSubmittedRun } from '@/server/game/validate-run'
import type { PracticeResult } from '@/lib/practice/contracts'

export type PracticeVerification =
  | { readonly ok: true; readonly result: PracticeResult }
  | { readonly ok: false; readonly code: 'INVALID_RUN' | 'INCOMPATIBLE_RUN' }

const seedPattern = /^practice-v1-[0-9a-f]{48}$/u
const runIdPattern =
  /^practice-v1-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u

/** No store, active competition, session, official seed or client parameters. */
export function issuePracticeRun(): RunDescriptor {
  const built = createFullCareerRunDescriptor(
    `practice-v1-${randomBytes(24).toString('hex')}`,
    { runId: `practice-v1-${randomUUID()}`, mode: 'practice' },
  )
  if (!built.ok) throw new Error('practice composition unavailable')
  return built.value
}

/** A coherent new seed is permitted; no assertion of server issuance is made. */
export function verifyPracticeRun(actionLog: unknown): PracticeVerification {
  const parsed = parseActionLog(actionLog)
  if (!parsed.ok) return { ok: false, code: 'INVALID_RUN' }
  const descriptor = parsed.value.descriptor
  if (
    descriptor.mode !== 'practice' ||
    descriptor.difficulty !== 'fixed' ||
    !seedPattern.test(descriptor.seed) ||
    !runIdPattern.test(descriptor.runId)
  )
    return { ok: false, code: 'INVALID_RUN' }

  const expected = createFullCareerRunDescriptor(descriptor.seed, {
    runId: descriptor.runId,
    mode: 'practice',
  })
  if (
    !expected.ok ||
    canonicalize(expected.value) !== canonicalize(descriptor)
  ) {
    return { ok: false, code: 'INCOMPATIBLE_RUN' }
  }
  const replayed = validateSubmittedRun(
    actionLog,
    createFullCareerDependencies(),
  )
  if (!replayed.ok || replayed.value.competitiveScore === undefined) {
    return { ok: false, code: 'INVALID_RUN' }
  }
  return {
    ok: true,
    result: {
      kind: 'practice',
      runId: replayed.value.runId,
      fairScore: replayed.value.competitiveScore.fairScore,
      graduated: replayed.value.graduated,
    },
  }
}
