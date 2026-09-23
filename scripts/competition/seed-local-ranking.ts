/** Synthetic local competition, isolated from existing player data. Idempotent. */
import { createHash, randomUUID } from 'node:crypto'
import { loadCompetitionEnvironment } from './environment'
import { requireCompetitionConfiguration } from '@/server/competition/config'
import { createCompetitionStore } from '@/server/competition/runtime'
import { FULL_CAREER_EDITION } from '@/server/competition/editions'
import { validateSubmittedRun } from '@/server/game/validate-run'
import { summarizeVerifiedRun } from '@/server/competition/run-summary'
import { deriveIdentityKey } from '@/server/competition/identity'
import { playCareer } from '../../tests/helpers/competition'
import type { SolutionQuality } from '@/game'

loadCompetitionEnvironment()
for (const key of ['SUPABASE_INTERNAL_URL', 'NEXT_PUBLIC_SUPABASE_URL']) {
  const value = process.env[key]
  if (
    value &&
    !['localhost', '127.0.0.1', '[::1]'].includes(new URL(value).hostname)
  )
    throw new Error('Seed permitido únicamente contra Supabase local.')
}
if (process.env['EGRESADO_ENVIRONMENT'] === 'production')
  throw new Error('Seed no permitido en producción.')
const config = requireCompetitionConfiguration()
const store = createCompetitionStore()
const slug = 'ranking-demo-local'
const seed = 'ranking-demo-4'
const descriptor = FULL_CAREER_EDITION.createDescriptor(seed, randomUUID())
if (!descriptor?.planFingerprint) throw new Error('Plan local inválido')
const competition =
  (await store.findCompetitionBySlug(slug)) ??
  (await store.insertCompetition({
    slug,
    name: 'Feria del Libro 2026',
    status: 'OPEN',
    opensAt: new Date(Date.now() - 3600000).toISOString(),
    closesAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    submissionGraceSeconds: 300,
    runSeed: seed,
    runPlanFingerprint: descriptor.planFingerprint,
    privacyNoticeVersion: config.privacy.noticeVersion,
    retentionDays: config.privacy.retentionDays,
    ...FULL_CAREER_EDITION.versions,
  }))
const names = [
  'Luna',
  'Mateo',
  'Sofi',
  'Tomi',
  'Juli',
  'Nico',
  'Mora',
  'Lauti',
  'Cata',
  'Fede',
  'Alma',
  'Teo',
  'Lola',
  'Bruno',
  'Emi',
  'Vera',
  'Ciro',
  'Paz',
  'Rama',
  'Luz',
  'Noa',
  'Milo',
  'Dante',
  'Pili',
  'Benja',
  'Abril',
  'Santi',
  'Ivo',
  'Delfi',
  'Tina',
  'Alex',
  'Vicky',
  'Fran',
  'Sol',
  'Dani',
  'Renzo',
]
let inserted = 0
for (const [index, name] of names.entries()) {
  const nickname = `Demo${name}`
  const key = nickname.toLocaleLowerCase('es-AR')
  let participant = await store.findParticipantByNickname(competition.id, key)
  if (!participant) {
    const dni = String(81000000 + index)
    const created = await store.insertParticipant({
      competitionId: competition.id,
      publicNickname: nickname,
      nicknameKey: key,
      fullNamePrivate: `Demo ${name}`,
      schoolYearPrivate: config.schoolYears[0] ?? '7.º',
      divisionPrivate: undefined,
      identityHmac: deriveIdentityKey(
        config.identitySecret,
        competition.id,
        dni,
      ),
      dniLast4Private: dni.slice(-4),
      privacyNoticeVersion: competition.privacyNoticeVersion,
    })
    if (created.outcome !== 'created')
      throw new Error('Conflicto en seed sintético')
    participant = created.participant
  }
  if (
    (await store.listAttemptsForParticipant(participant.id)).some(
      (attempt) => attempt.status === 'VERIFIED',
    )
  )
    continue
  const runId = randomUUID()
  const run = FULL_CAREER_EDITION.createDescriptor(competition.runSeed, runId)
  if (!run) throw new Error('Descriptor local inválido')
  const qualities: readonly SolutionQuality[] = [
    'optimal',
    'efficient',
    'functional',
    'invalid',
  ]
  // Two perfect runs share first; mixed witnesses create distinct later places.
  const played = playCareer(run, (template) => {
    if (index < 2) return 'optimal'
    const hash =
      createHash('sha256')
        .update(`${Math.floor(index / 2)}:${template}`)
        .digest()[0] ?? 0
    return qualities[hash % qualities.length] ?? 'optimal'
  })
  const verified = validateSubmittedRun(
    played.serialized,
    FULL_CAREER_EDITION.createDependencies(),
  )
  if (!verified.ok || !verified.value.competitiveScore)
    throw new Error('El replay rechazó el seed')
  const result = verified.value
  const now = new Date().toISOString()
  const created = await store.insertAttempt({
    competitionId: competition.id,
    participantId: participant.id,
    attemptNumber: 1,
    runId,
    seed: competition.runSeed,
    runPlanFingerprint: competition.runPlanFingerprint,
    startedAt: now,
    ...FULL_CAREER_EDITION.versions,
  })
  if (created.outcome !== 'created')
    throw new Error('Intento sintético existente sin verificar')
  await store.finalizeAttempt(created.attempt.id, ['STARTED'], {
    status: 'VERIFIED',
    submittedAt: now,
    verifiedAt: now,
    actionLog: played.serialized,
    submissionDigest: createHash('sha256')
      .update(JSON.stringify(played.serialized))
      .digest('hex'),
    verifiedFairScore: result.competitiveScore?.fairScore,
    verifiedPrestigeScore: result.prestige?.total ?? 0,
    verifiedSummary: {
      graduated: result.graduated,
      profile: result.profile,
      eventsPlayed: result.eventsPlayed,
      recoveries: result.recoveries,
      previas: result.previas,
      optimalCount: result.competitiveScore?.optimalCount,
      ranking: summarizeVerifiedRun(result),
    },
    rejectionCode: undefined,
  })
  inserted++
}
const best = await store.bestVerifiedAttempts(competition.id)
process.stdout.write(
  `${JSON.stringify({ slug, inserted, participants: best.length, differentScores: new Set(best.map((row) => row.verifiedFairScore)).size })}\n`,
)
process.stdout.write(
  'Activar en .env.local: EGRESADO_COMPETITION_SLUG=ranking-demo-local y reiniciar pnpm dev.\n',
)
