import { describe, expect, it } from 'vitest'

import {
  emptyProgression,
  obligationFor,
  owesRecovery,
  pendingForStage,
  progressionIssues,
  recoveriesPlayedInStage,
  withGraduation,
  withObligation,
  withRecovery,
  developmentRecoveryPolicy,
  MAX_RECOVERIES_PER_STAGE,
  SOLUTION_QUALITIES,
  type ChallengeVariantRef,
  type ProgressionState,
  type SolutionQuality,
  type StageId,
} from '@/game'
import { SIX_STAGE_IDS } from '@/game/testing'

/**
 * Auditoría de alcanzabilidad de la progresión.
 *
 * Las property tests generan formas de jugar y comprueban que ninguna encuentra
 * una salida distinta. Esto hace lo complementario y más fuerte donde se puede
 * hacer: **recorre el espacio de estados entero**.
 *
 * El modelo lo permite porque es chico a propósito. Lo único que un año le
 * comunica a la progresión es qué calidades sacó, y lo único que la progresión
 * recuerda es qué debe y qué cerró. Con seis años y cuatro calidades por beat,
 * el espacio se enumera completo — y «completo» es una palabra que una property
 * test no puede usar.
 */

const policy = developmentRecoveryPolicy

const source = (stageId: StageId, index: number): ChallengeVariantRef => ({
  familyId: 'test' as ChallengeVariantRef['familyId'],
  templateId:
    `t.${stageId}.${String(index)}` as ChallengeVariantRef['templateId'],
  variantId: 'v' as ChallengeVariantRef['variantId'],
})

/** Every combination of two ordinary results a year can produce. */
const YEAR_OUTCOMES: readonly (readonly SolutionQuality[])[] =
  SOLUTION_QUALITIES.flatMap((first) =>
    SOLUTION_QUALITIES.map((second) => [first, second] as const),
  )

interface Walk {
  readonly state: ProgressionState
  readonly recoveries: number
  readonly issues: readonly string[]
}

/**
 * Plays one year: two ordinary beats, then the remediation the year owes.
 *
 * Deliberately a re-implementation of the *shape* the transition applies, not a
 * call into it: the point is to audit the progression rules on their own, where
 * a whole career costs microseconds and the space can be exhausted.
 */
function playYear(
  before: ProgressionState,
  stageId: StageId,
  outcomes: readonly SolutionQuality[],
  recoveryQuality: SolutionQuality,
): Walk {
  let state = before
  const issues: string[] = []

  outcomes.forEach((quality, index) => {
    const obligation = obligationFor(
      policy,
      stageId,
      index,
      source(stageId, index),
      quality,
    )
    if (obligation !== undefined) {
      state = withObligation(state, obligation)
    }
  })

  let recoveries = 0
  // The bound, asserted by running against it: if the year could ever owe a
  // second remediation, this loop would spin and the cap would catch it.
  while (owesRecovery(state, stageId) && recoveries < 8) {
    state = withRecovery(
      state,
      stageId,
      source(stageId, 99),
      recoveryQuality,
      policy,
    )
    recoveries += 1
    issues.push(...progressionIssues(state))
  }

  if (pendingForStage(state, stageId).length > 0) {
    issues.push(`${stageId} ended owing something`)
  }
  if (recoveriesPlayedInStage(state, stageId) > MAX_RECOVERIES_PER_STAGE) {
    issues.push(`${stageId} played more remediations than the structure allows`)
  }

  return { state, recoveries, issues }
}

describe('el espacio de estados de la progresión, recorrido entero', () => {
  it('todo año posible cierra debiendo nada, con un repaso como mucho', () => {
    const seen = new Set<string>()
    let worstRecoveries = 0
    const problems: string[] = []

    for (const outcomes of YEAR_OUTCOMES) {
      for (const recoveryQuality of SOLUTION_QUALITIES) {
        const walk = playYear(
          emptyProgression(),
          'grade-7',
          outcomes,
          recoveryQuality,
        )
        problems.push(...walk.issues)
        worstRecoveries = Math.max(worstRecoveries, walk.recoveries)
        seen.add(
          `${String(walk.state.pending.length)}/${String(walk.state.history.length)}`,
        )
      }
    }

    // 4 × 4 resultados ordinarios × 4 del repaso: sesenta y cuatro años
    // distintos, y ninguno termina debiendo.
    expect(problems).toEqual([])
    expect(worstRecoveries).toBeLessThanOrEqual(MAX_RECOVERIES_PER_STAGE)
    // Dos formas de cerrar un año: sin repaso, o con uno.
    expect([...seen].sort()).toEqual(['0/0', '0/1'])
  })

  it('toda carrera de seis años llega al egreso', () => {
    /*
     * El espacio completo de carreras.
     *
     * Lo único que la progresión distingue de un año es si dejó algo por cerrar
     * o no, así que una carrera son seis decisiones binarias: sesenta y cuatro
     * carreras, enumeradas de punta a punta.
     */
    const careers = 1 << SIX_STAGE_IDS.length
    const terminal = new Set<string>()
    const problems: string[] = []
    let worst = 0

    for (let mask = 0; mask < careers; mask += 1) {
      let state = emptyProgression()
      let recoveries = 0

      SIX_STAGE_IDS.forEach((stageId, index) => {
        const failing = (mask & (1 << index)) !== 0
        const walk = playYear(
          state,
          stageId,
          failing ? ['invalid', 'optimal'] : ['optimal', 'optimal'],
          failing ? 'invalid' : 'optimal',
        )
        state = walk.state
        recoveries += walk.recoveries
        problems.push(...walk.issues)
      })

      const graduated = withGraduation(state)
      problems.push(...progressionIssues(graduated))
      if (!graduated.graduated) {
        problems.push(`career ${String(mask)} did not graduate`)
      }
      if (graduated.pending.length > 0) {
        problems.push(`career ${String(mask)} graduated owing something`)
      }

      worst = Math.max(worst, recoveries)
      terminal.add(String(graduated.graduated))
    }

    expect(problems).toEqual([])
    // Un único estado terminal alcanzable: egresado. No hay otro.
    expect([...terminal]).toEqual(['true'])
    // Y el peor caso son seis repasos, uno por año: el techo es el que la
    // política declara, multiplicado por la cantidad de años, y nada más.
    expect(worst).toBe(SIX_STAGE_IDS.length)
  })

  it('no hay ciclos: una obligación cerrada no vuelve', () => {
    let state = withObligation(
      emptyProgression(),
      obligationFor(
        policy,
        'grade-7',
        0,
        source('grade-7', 0),
        'invalid',
      ) as NonNullable<ReturnType<typeof obligationFor>>,
    )

    state = withRecovery(state, 'grade-7', undefined, 'invalid', policy)
    const afterFirst = state

    // Cerrarla otra vez no hace nada, y el año no vuelve a deberla. Ésa es la
    // ausencia de ciclo, comprobada y no supuesta.
    state = withRecovery(state, 'grade-7', undefined, 'invalid', policy)
    expect(state).toBe(afterFirst)
    expect(owesRecovery(state, 'grade-7')).toBe(false)
  })

  it('no hay callejones sin salida: todo estado alcanzable puede seguir', () => {
    // Un callejón sería un estado donde el año debe algo y no puede repasarlo.
    // Con el tope en uno por año, eso sólo podría pasar si una obligación
    // apareciera después del repaso — y ninguna aparece, porque un repaso no
    // genera obligaciones.
    for (const outcomes of YEAR_OUTCOMES) {
      const walk = playYear(emptyProgression(), 'grade-7', outcomes, 'invalid')
      const stuck =
        pendingForStage(walk.state, 'grade-7').length > 0 &&
        !owesRecovery(walk.state, 'grade-7')
      expect(stuck).toBe(false)
    }
  })
})
