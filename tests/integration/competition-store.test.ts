import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { InMemoryCompetitionStore } from '@/server/persistence/competition/memory-store'
import { SupabaseCompetitionStore } from '@/server/persistence/competition/supabase-store'
import type { CompetitionStore } from '@/server/persistence/competition/store'
import type { CompetitionRow } from '@/server/persistence/competition/rows'
import {
  competitionFixture,
  TEST_COMPETITION_SEED,
} from '../helpers/competition'

/**
 * El contrato del puerto de persistencia, contra sus dos implementaciones.
 *
 * La misma suite corre sobre el store en memoria y —cuando hay base local—
 * sobre Postgres. Eso es lo que hace que el store en memoria no sea un mock
 * cómodo: si una garantía existe sólo en uno de los dos, la suite lo dice.
 *
 * Las garantías que se prueban son exactamente las que el servicio da por
 * ciertas para no necesitar un lock: la unicidad de identidad por edición, la
 * de alias, el único intento activo por participante, la finalización
 * condicionada por estado y el incremento atómico del contador de tasa. Todas
 * son restricciones de la base, no decisiones del proceso.
 */

const databaseConfigured =
  Boolean(process.env['SUPABASE_SECRET_KEY']) &&
  Boolean(
    process.env['SUPABASE_INTERNAL_URL'] ??
    process.env['NEXT_PUBLIC_SUPABASE_URL'],
  )

const implementations: readonly {
  readonly name: string
  readonly create: () => CompetitionStore
  readonly skip: boolean
}[] = [
  {
    name: 'memoria',
    create: () => new InMemoryCompetitionStore(),
    skip: false,
  },
  {
    name: 'postgres',
    create: () => new SupabaseCompetitionStore(),
    skip: !databaseConfigured,
  },
]

let uniqueCounter = 0

/**
 * Un sufijo distinto en cada llamada **y en cada corrida**.
 *
 * Postgres conserva las filas entre corridas, así que un `run_id` fijo como
 * `run-uno` pasa la primera vez y choca la segunda. Es el tipo de fallo que
 * hace dudar del código cuando el problema es el fixture.
 */
function unique(prefix: string): string {
  uniqueCounter += 1
  return `${prefix}-${String(Date.now()).slice(-9)}-${String(uniqueCounter)}`
}

function uniqueSlug(): string {
  return unique('contrato').slice(0, 63)
}

/**
 * Un digest hexadecimal distinto en cada llamada y en cada corrida.
 *
 * Un contador que arranca en cero produce `000…001` otra vez mañana, y contra
 * una base que conserva filas eso choca con la corrida anterior. El reloj y la
 * aleatoriedad lo evitan sin depender del orden de los tests.
 */
function uniqueHash(): string {
  uniqueCounter += 1
  const stamp = Date.now().toString(16)
  const noise = Math.floor(Math.random() * 0xffff_ffff).toString(16)
  return `${stamp}${noise}${String(uniqueCounter)}`
    .padEnd(64, '0')
    .slice(0, 64)
    .replace(/[^0-9a-f]/gu, '0')
}

const createdSlugs: string[] = []

async function freshCompetition(
  store: CompetitionStore,
  overrides: Partial<CompetitionRow> = {},
): Promise<CompetitionRow> {
  const slug = uniqueSlug()
  createdSlugs.push(slug)
  return store.insertCompetition(competitionFixture({ slug, ...overrides }))
}

function attemptInput(
  competition: CompetitionRow,
  participantId: string,
  attemptNumber: number,
  runId: string,
) {
  return {
    competitionId: competition.id,
    participantId,
    attemptNumber,
    runId,
    seed: competition.runSeed,
    runPlanFingerprint: competition.runPlanFingerprint,
    startedAt: new Date().toISOString(),
    engineVersion: competition.engineVersion,
    rulesetVersion: competition.rulesetVersion,
    contentVersion: competition.contentVersion,
    variantCatalogVersion: competition.variantCatalogVersion,
    scoreVersion: competition.scoreVersion,
    actionLogVersion: competition.actionLogVersion,
    snapshotVersion: competition.snapshotVersion,
  }
}

function participantInput(competition: CompetitionRow, nickname: string) {
  return {
    competitionId: competition.id,
    publicNickname: nickname,
    nicknameKey: nickname.toLocaleLowerCase('es'),
    fullNamePrivate: 'Persona De Prueba',
    schoolYearPrivate: '3.º',
    divisionPrivate: undefined,
    identityHmac: uniqueHash(),
    dniLast4Private: '1234',
    privacyNoticeVersion: '1',
  }
}

for (const implementation of implementations) {
  describe.skipIf(implementation.skip)(
    `puerto de competencia · ${implementation.name}`,
    () => {
      let store: CompetitionStore

      beforeEach(() => {
        store = implementation.create()
      })

      it('encuentra una edición por slug y conserva su tupla de versiones', async () => {
        const competition = await freshCompetition(store)
        const found = await store.findCompetitionBySlug(competition.slug)
        expect(found?.id).toBe(competition.id)
        expect(found?.runSeed).toBe(TEST_COMPETITION_SEED)
        expect(found?.engineVersion).toBe(competition.engineVersion)
        expect(found?.actionLogVersion).toBe(competition.actionLogVersion)
      })

      it('rechaza un segundo participante con la misma identidad', async () => {
        const competition = await freshCompetition(store)
        const input = participantInput(competition, 'Primera')
        const first = await store.insertParticipant(input)
        expect(first.outcome).toBe('created')

        // Mismo documento, otro alias: es la misma persona y no puede haber dos.
        const second = await store.insertParticipant({
          ...input,
          publicNickname: 'Segunda',
          nicknameKey: 'segunda',
        })
        expect(second.outcome).toBe('identity-conflict')
      })

      it('rechaza un alias tomado por otra persona', async () => {
        const competition = await freshCompetition(store)
        await store.insertParticipant(participantInput(competition, 'Repetida'))
        const clash = await store.insertParticipant({
          ...participantInput(competition, 'Repetida'),
          nicknameKey: 'repetida',
        })
        expect(clash.outcome).toBe('nickname-conflict')
      })

      it('resuelve una carrera de dos registros simultáneos con el mismo documento', async () => {
        const competition = await freshCompetition(store)
        const input = participantInput(competition, 'Simultanea')
        const results = await Promise.all([
          store.insertParticipant(input),
          store.insertParticipant({
            ...input,
            publicNickname: 'Simultanea2',
            nicknameKey: 'simultanea2',
          }),
        ])
        const created = results.filter((row) => row.outcome === 'created')
        expect(created).toHaveLength(1)
        expect(
          results.filter((row) => row.outcome === 'identity-conflict'),
        ).toHaveLength(1)
      })

      it('admite un solo intento activo por participante', async () => {
        const competition = await freshCompetition(store)
        const created = await store.insertParticipant(
          participantInput(competition, 'Jugadora'),
        )
        if (created.outcome !== 'created') throw new Error('no se creó')
        const participantId = created.participant.id

        const first = await store.insertAttempt(
          attemptInput(competition, participantId, 1, unique('run')),
        )
        expect(first.outcome).toBe('created')

        const second = await store.insertAttempt(
          attemptInput(competition, participantId, 2, unique('run')),
        )
        expect(second.outcome).toBe('active-conflict')

        // Al cerrar la primera, la siguiente entra: intentos ilimitados,
        // nunca dos en paralelo.
        if (first.outcome !== 'created') throw new Error('sin intento')
        await store.abandonAttempt(first.attempt.id)
        const third = await store.insertAttempt(
          attemptInput(competition, participantId, 2, unique('run')),
        )
        expect(third.outcome).toBe('created')
      })

      it('finaliza un intento sólo desde el estado esperado', async () => {
        const competition = await freshCompetition(store)
        const created = await store.insertParticipant(
          participantInput(competition, 'Finalizadora'),
        )
        if (created.outcome !== 'created') throw new Error('no se creó')
        const attempt = await store.insertAttempt(
          attemptInput(competition, created.participant.id, 1, unique('run')),
        )
        if (attempt.outcome !== 'created') throw new Error('sin intento')

        const finalization = {
          status: 'VERIFIED' as const,
          submittedAt: '2026-10-03T16:00:00.000Z',
          verifiedAt: '2026-10-03T16:00:00.000Z',
          actionLog: { version: 7 },
          submissionDigest: uniqueHash(),
          verifiedFairScore: 8000,
          verifiedPrestigeScore: 0,
          verifiedSummary: { graduated: true },
          rejectionCode: undefined,
        }

        const first = await store.finalizeAttempt(
          attempt.attempt.id,
          ['STARTED'],
          finalization,
        )
        expect(first?.status).toBe('VERIFIED')

        // El segundo intento de cerrar la misma fila no devuelve nada. Es lo
        // que convierte un doble envío en idempotente en vez de en dos
        // resultados distintos.
        const second = await store.finalizeAttempt(
          attempt.attempt.id,
          ['STARTED'],
          { ...finalization, verifiedFairScore: 9999 },
        )
        expect(second).toBeUndefined()

        const current = await store.findAttemptById(attempt.attempt.id)
        expect(current?.verifiedFairScore).toBe(8000)
      })

      it('deriva el mejor intento verificado de cada participante elegible', async () => {
        const competition = await freshCompetition(store)
        const created = await store.insertParticipant(
          participantInput(competition, 'Mejor'),
        )
        if (created.outcome !== 'created') throw new Error('no se creó')
        const participantId = created.participant.id

        for (const [index, score] of [7000, 8000, 6000].entries()) {
          const attempt = await store.insertAttempt(
            attemptInput(competition, participantId, index + 1, unique('run')),
          )
          if (attempt.outcome !== 'created') throw new Error('sin intento')
          await store.finalizeAttempt(attempt.attempt.id, ['STARTED'], {
            status: 'VERIFIED',
            submittedAt: '2026-10-03T16:00:00.000Z',
            verifiedAt: '2026-10-03T16:00:00.000Z',
            actionLog: { version: 7 },
            submissionDigest: uniqueHash(),
            verifiedFairScore: score,
            verifiedPrestigeScore: 0,
            verifiedSummary: { graduated: true },
            rejectionCode: undefined,
          })
        }

        const best = await store.bestVerifiedAttempts(competition.id)
        expect(best).toHaveLength(1)
        expect(best[0]?.verifiedFairScore).toBe(8000)
      })

      it('saca del ranking a quien queda descalificado, sin borrar su historia', async () => {
        const competition = await freshCompetition(store)
        const created = await store.insertParticipant(
          participantInput(competition, 'Descalificada'),
        )
        if (created.outcome !== 'created') throw new Error('no se creó')
        const attempt = await store.insertAttempt(
          attemptInput(competition, created.participant.id, 1, unique('run')),
        )
        if (attempt.outcome !== 'created') throw new Error('sin intento')
        await store.finalizeAttempt(attempt.attempt.id, ['STARTED'], {
          status: 'VERIFIED',
          submittedAt: '2026-10-03T16:00:00.000Z',
          verifiedAt: '2026-10-03T16:00:00.000Z',
          actionLog: { version: 7 },
          submissionDigest: uniqueHash(),
          verifiedFairScore: 9000,
          verifiedPrestigeScore: 0,
          verifiedSummary: { graduated: true },
          rejectionCode: undefined,
        })

        expect(await store.bestVerifiedAttempts(competition.id)).toHaveLength(1)

        await store.updateParticipant(created.participant.id, {
          status: 'DISQUALIFIED',
          statusReason: 'identidad falsa',
        })
        expect(await store.bestVerifiedAttempts(competition.id)).toHaveLength(0)

        // La evidencia sigue ahí: el intento no se borró.
        const kept = await store.findAttemptById(attempt.attempt.id)
        expect(kept?.verifiedFairScore).toBe(9000)
      })

      it('excluye un intento invalidado y promueve al siguiente mejor', async () => {
        const competition = await freshCompetition(store)
        const created = await store.insertParticipant(
          participantInput(competition, 'Invalidada'),
        )
        if (created.outcome !== 'created') throw new Error('no se creó')

        const ids: string[] = []
        for (const [index, score] of [7000, 9000].entries()) {
          const attempt = await store.insertAttempt(
            attemptInput(
              competition,
              created.participant.id,
              index + 1,
              unique('run'),
            ),
          )
          if (attempt.outcome !== 'created') throw new Error('sin intento')
          ids.push(attempt.attempt.id)
          await store.finalizeAttempt(attempt.attempt.id, ['STARTED'], {
            status: 'VERIFIED',
            submittedAt: '2026-10-03T16:00:00.000Z',
            verifiedAt: '2026-10-03T16:00:00.000Z',
            actionLog: { version: 7 },
            submissionDigest: uniqueHash(),
            verifiedFairScore: score,
            verifiedPrestigeScore: 0,
            verifiedSummary: { graduated: true },
            rejectionCode: undefined,
          })
        }

        expect(
          (await store.bestVerifiedAttempts(competition.id))[0]
            ?.verifiedFairScore,
        ).toBe(9000)

        await store.invalidateAttempt(
          ids[1] ?? '',
          '2026-10-03T17:00:00.000Z',
          'confirmado como copia',
        )
        expect(
          (await store.bestVerifiedAttempts(competition.id))[0]
            ?.verifiedFairScore,
        ).toBe(7000)
      })

      it('expira y revoca sesiones de participante', async () => {
        const competition = await freshCompetition(store)
        const created = await store.insertParticipant(
          participantInput(competition, 'Sesionada'),
        )
        if (created.outcome !== 'created') throw new Error('no se creó')

        const tokenHash = uniqueHash()
        const session = await store.insertParticipantSession({
          participantId: created.participant.id,
          tokenHash,
          expiresAt: '2026-12-31T00:00:00.000Z',
        })
        expect(session.revokedAt).toBeUndefined()

        await store.revokeParticipantSession(
          tokenHash,
          '2026-10-03T18:00:00.000Z',
        )
        const revoked = await store.findParticipantSession(tokenHash)
        expect(revoked?.revokedAt).toBe('2026-10-03T18:00:00.000Z')
      })

      it('incrementa el contador de tasa de forma atómica', async () => {
        const bucket = `prueba-${String(Date.now())}`
        const window = '2026-10-03T16:00:00.000Z'
        const counts = await Promise.all(
          Array.from({ length: 8 }, () =>
            store.incrementRateLimit(bucket, window),
          ),
        )
        // Ocho pedidos simultáneos suman ocho, no menos: si el incremento no
        // fuera atómico, dos leerían el mismo valor y escribirían el mismo.
        expect([...counts].sort((a, b) => a - b)).toEqual([
          1, 2, 3, 4, 5, 6, 7, 8,
        ])
      })

      it('registra las acciones del organizador en orden inverso', async () => {
        const competition = await freshCompetition(store)
        for (const action of ['competition.status', 'participant.correct']) {
          await store.appendAudit({
            competitionId: competition.id,
            actor: 'organizador',
            action,
            targetType: 'competition',
            targetId: competition.id,
            reason: 'prueba',
            metadata: { fields: ['nickname'] },
          })
        }
        const audit = await store.listAudit(competition.id, 10)
        expect(audit).toHaveLength(2)
        expect(audit[0]?.action).toBe('participant.correct')
      })
    },
  )
}

describe.skipIf(!databaseConfigured)('limpieza de postgres', () => {
  afterAll(async () => {
    // Las ediciones de prueba se borran al final; el resto cae por cascada.
    const store = new SupabaseCompetitionStore()
    for (const slug of createdSlugs) {
      const row = await store.findCompetitionBySlug(slug)
      if (row !== undefined) {
        await store.updateCompetition(row.id, { status: 'ARCHIVED' })
      }
    }
  })

  it('reporta que la base estuvo disponible para este contrato', () => {
    expect(databaseConfigured).toBe(true)
  })
})
