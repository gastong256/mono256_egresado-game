import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  emptyProgression,
  obligationFor,
  obligationId,
  orderObligations,
  owesRecovery,
  pendingForStage,
  previasOf,
  progressionIssues,
  recoveriesPlayedInStage,
  recoveryPolicyIssues,
  withGraduation,
  withObligation,
  withRecovery,
  developmentRecoveryPolicy,
  isOrdinaryBeatRole,
  MAX_RECOVERIES_PER_STAGE,
  type ChallengeVariantRef,
  type ProgressionState,
  type RecoveryPolicy,
  type StageId,
} from '@/game'
import { grade7Challenges } from '@/content/grade-7'

/**
 * Las reglas de progresión, aisladas del motor.
 *
 * Lo que se prueba acá no es que una partida ande, sino que el modelo no admita
 * los estados que harían falsa la promesa: egresar debiendo algo, recuperar sin
 * deber nada, o recuperar de una recuperación sin fin.
 */

const policy = developmentRecoveryPolicy

const unsafePolicyWithMaximum = (maximum: unknown): RecoveryPolicy =>
  ({
    ...policy,
    maxRecoveriesPerStage: maximum,
  }) as unknown as RecoveryPolicy

const source = (templateId: string): ChallengeVariantRef => ({
  familyId: 'bus' as ChallengeVariantRef['familyId'],
  templateId: templateId as ChallengeVariantRef['templateId'],
  variantId: 'c00001' as ChallengeVariantRef['variantId'],
})

function obligation(stageId: StageId, eventIndex: number, templateId: string) {
  const entry = obligationFor(
    policy,
    stageId,
    eventIndex,
    source(templateId),
    'invalid',
  )
  if (entry === undefined) throw new Error('la política no disparó')
  return entry
}

describe('la política de recuperación', () => {
  it('es candidata y lo dice', () => {
    expect(policy.official).toBe(false)
    expect(policy.id).toBe('recovery-dev-1')
    expect(recoveryPolicyIssues(policy)).toEqual([])
  })

  it('un resultado óptimo no deja nada por cerrar', () => {
    expect(policy.triggers.optimal).toBe('none')
    expect(
      obligationFor(policy, 'grade-7', 1, source('x'), 'optimal'),
    ).toBeUndefined()
  })

  it('un resultado inválido sí', () => {
    const entry = obligationFor(policy, 'grade-7', 1, source('x'), 'invalid')
    expect(entry?.reason).toBe('unresolved')
    expect(entry?.quality).toBe('invalid')
  })

  it('acota cuántos repasos puede jugar un año', () => {
    // Uno. Es lo que impide que un mal año le gane en largo a la carrera que
    // integra, y está en la política para que el número sea inspeccionable.
    expect(policy.maxRecoveriesPerStage).toBe(MAX_RECOVERIES_PER_STAGE)
    expect(recoveryPolicyIssues(policy)).toEqual([])
  })

  it('expresa el techo estructural como el literal 1', () => {
    expectTypeOf<RecoveryPolicy['maxRecoveriesPerStage']>().toEqualTypeOf<1>()
  })

  it('rechaza una política que permitiría dos repasos en un año', () => {
    const runaway = unsafePolicyWithMaximum(2)
    expect(recoveryPolicyIssues(runaway)).toContainEqual(
      expect.stringContaining('exactly one'),
    )
  })

  it.each([0, -1, 1.5, '1', undefined])(
    'rechaza un máximo inválido: %s',
    (maximum) => {
      expect(
        recoveryPolicyIssues(unsafePolicyWithMaximum(maximum)),
      ).toContainEqual(expect.stringContaining('exactly one'))
    },
  )

  it('rechaza una política donde lo óptimo necesitaría repaso', () => {
    expect(
      recoveryPolicyIssues({
        ...policy,
        triggers: { ...policy.triggers, optimal: 'unresolved' },
      }),
    ).toContainEqual(expect.stringContaining('optimal result cannot require'))
  })

  it('rechaza una política que nunca dispararía', () => {
    expect(
      recoveryPolicyIssues({
        ...policy,
        triggers: {
          invalid: 'none',
          functional: 'none',
          efficient: 'none',
          optimal: 'none',
        },
      }),
    ).toContainEqual(expect.stringContaining('unreachable'))
  })
})

describe('la identidad de una obligación', () => {
  it('es semántica, no una posición en una lista', () => {
    expect(obligationId('grade-7', 3, source('g7.bus-timing'))).toBe(
      'grade-7/3/bus/g7.bus-timing/c00001',
    )
  })

  it('el mismo beat produce siempre la misma obligación', () => {
    expect(obligation('grade-7', 3, 'a').id).toBe(
      obligation('grade-7', 3, 'a').id,
    )
  })

  it('dos beats distintos producen obligaciones distintas', () => {
    expect(obligation('grade-7', 3, 'a').id).not.toBe(
      obligation('grade-7', 4, 'a').id,
    )
  })

  it('se ordenan por año, por beat y por dirección, sin empates', () => {
    const shuffled = [
      obligation('year-2', 9, 'b'),
      obligation('grade-7', 5, 'b'),
      obligation('grade-7', 2, 'a'),
      obligation('year-2', 8, 'a'),
    ]
    expect(orderObligations(shuffled).map((entry) => entry.id)).toEqual([
      'grade-7/2/bus/a/c00001',
      'grade-7/5/bus/b/c00001',
      'year-2/8/bus/a/c00001',
      'year-2/9/bus/b/c00001',
    ])
  })

  it('la misma obligación no se anota dos veces', () => {
    const entry = obligation('grade-7', 1, 'a')
    const once = withObligation(emptyProgression(), entry)
    expect(withObligation(once, entry).pending).toHaveLength(1)
  })
})

describe('un año no puede terminar debiendo', () => {
  it('un año con obligaciones debe un repaso', () => {
    const owing = withObligation(
      emptyProgression(),
      obligation('grade-7', 1, 'a'),
    )
    expect(owesRecovery(owing, 'grade-7')).toBe(true)
    expect(owesRecovery(owing, 'year-1')).toBe(false)
  })

  it('un repaso cierra todas las del año, no una', () => {
    let state = withObligation(
      emptyProgression(),
      obligation('grade-7', 1, 'a'),
    )
    state = withObligation(state, obligation('grade-7', 2, 'b'))
    expect(pendingForStage(state, 'grade-7')).toHaveLength(2)

    const closed = withRecovery(state, 'grade-7', undefined, 'optimal', policy)
    // De a una, un año con dos errores costaría dos beats extra, y la carrera
    // son seis años.
    expect(closed.pending).toHaveLength(0)
    expect(closed.history[0]?.resolved).toHaveLength(2)
  })

  it('después del repaso el año ya no debe nada', () => {
    const owing = withObligation(
      emptyProgression(),
      obligation('grade-7', 1, 'a'),
    )
    const closed = withRecovery(owing, 'grade-7', undefined, 'invalid', policy)
    expect(owesRecovery(closed, 'grade-7')).toBe(false)
  })

  it('un repaso que sale mal cierra igual, y deja una previa', () => {
    const owing = withObligation(
      emptyProgression(),
      obligation('grade-7', 1, 'a'),
    )
    const closed = withRecovery(owing, 'grade-7', undefined, 'invalid', policy)

    expect(closed.pending).toHaveLength(0)
    expect(previasOf(closed)).toBe(1)
    // Y no genera una obligación nueva: la recursión no tiene dónde escribirse.
    expect(recoveriesPlayedInStage(closed, 'grade-7')).toBe(1)
    expect(owesRecovery(closed, 'grade-7')).toBe(false)
  })

  it('un repaso que sale bien no deja previa', () => {
    const owing = withObligation(
      emptyProgression(),
      obligation('grade-7', 1, 'a'),
    )
    const closed = withRecovery(
      owing,
      'grade-7',
      undefined,
      'efficient',
      policy,
    )
    expect(previasOf(closed)).toBe(0)
  })

  it('un repaso sin nada que cerrar no cambia nada', () => {
    const clean = emptyProgression()
    expect(withRecovery(clean, 'grade-7', undefined, 'optimal', policy)).toBe(
      clean,
    )
  })
})

describe('el egreso', () => {
  it('no ocurre debiendo algo', () => {
    const owing = withObligation(
      emptyProgression(),
      obligation('year-5', 1, 'a'),
    )
    expect(withGraduation(owing).graduated).toBe(false)
  })

  it('ocurre cuando no se debe nada', () => {
    expect(withGraduation(emptyProgression()).graduated).toBe(true)
  })

  it('es idempotente: graduarse dos veces es graduarse una', () => {
    const once = withGraduation(emptyProgression())
    expect(withGraduation(once)).toBe(once)
  })
})

describe('los estados imposibles se rechazan', () => {
  const broken = (state: ProgressionState) => progressionIssues(state)

  it('egresado debiendo algo', () => {
    expect(
      broken({
        ...withObligation(emptyProgression(), obligation('year-5', 1, 'a')),
        graduated: true,
      }),
    ).toContainEqual(expect.stringContaining('graduated with'))
  })

  it('la misma obligación pendiente dos veces', () => {
    const entry = obligation('grade-7', 1, 'a')
    expect(
      broken({ pending: [entry, entry], history: [], graduated: false }),
    ).toContainEqual(expect.stringContaining('pending twice'))
  })

  it('la misma obligación resuelta dos veces', () => {
    const entry = obligation('grade-7', 1, 'a')
    const record = {
      stageId: 'grade-7' as StageId,
      resolved: [entry.id],
      content: undefined,
      quality: 'optimal' as const,
      previa: false,
    }
    expect(
      broken({ pending: [], history: [record, record], graduated: false }),
    ).toContainEqual(expect.stringContaining('resolved twice'))
  })

  it('pendiente y resuelta a la vez', () => {
    const entry = obligation('grade-7', 1, 'a')
    expect(
      broken({
        pending: [entry],
        history: [
          {
            stageId: 'grade-7',
            resolved: [entry.id],
            content: undefined,
            quality: 'optimal',
            previa: false,
          },
        ],
        graduated: false,
      }),
    ).toContainEqual(expect.stringContaining('both pending and resolved'))
  })

  it('un repaso que no cerró nada', () => {
    expect(
      broken({
        pending: [],
        history: [
          {
            stageId: 'grade-7',
            resolved: [],
            content: undefined,
            quality: 'optimal',
            previa: false,
          },
        ],
        graduated: false,
      }),
    ).toContainEqual(expect.stringContaining('resolved nothing'))
  })

  it('un año que repasó más veces de las que la política permite', () => {
    const record = (id: string) => ({
      stageId: 'grade-7' as StageId,
      resolved: [id],
      content: undefined,
      quality: 'optimal' as const,
      previa: false,
    })
    expect(
      broken({
        pending: [],
        history: [record('a'), record('b')],
        graduated: false,
      }),
    ).toContainEqual(
      expect.stringContaining('remediation beats and the structural bound'),
    )
  })
})

describe('el contenido de recuperación de 7.º', () => {
  const recovery = grade7Challenges.filter(
    (template) => template.placement === 'recovery',
  )

  it('existe y es exactamente una plantilla', () => {
    expect(recovery).toHaveLength(1)
    expect(recovery[0]?.id).toBe('g7.bus-travel-review')
  })

  it('nunca gasta un beat ordinario', () => {
    for (const template of recovery) {
      expect(isOrdinaryBeatRole(template.placement)).toBe(false)
    }
  })

  it('revisa el mismo concepto, con menos carga que lo que remedia', () => {
    const review = recovery[0]
    const source = grade7Challenges.find(
      (template) => template.id === 'g7.bus-timing',
    )
    if (review === undefined || source === undefined) throw new Error('faltan')

    // Misma familia: la recuperación vuelve sobre el concepto, no busca
    // novedad. Y más liviana: baja el piso sin tocar el techo.
    expect(review.family).toBe(source.family)
    expect(review.band).toBe('core')
    expect(review.baseDifficulty).toBeLessThan(source.baseDifficulty)
  })

  it('no aporta evidencia competitiva', () => {
    // Declarado en el perfil, y además excluido por rol en el scorer. Las dos
    // cosas: el perfil lo documenta, el rol lo hace imposible de eludir.
    expect(recovery[0]?.scoring.team).toBe('none')
    expect(recovery[0]?.scoring.aura).toBe('none')
    expect(recovery[0]?.scoring.rationale).toContain('recuperación')
  })
})
