import { describe, expect, it } from 'vitest'

import {
  AURA_STYLE_MIN,
  PERFORMANCE_BANDS,
  PERFORMANCE_FEEDBACK,
  PERFORMANCE_THRESHOLDS,
  TEAM_STYLE_MIN,
  deriveAchievements,
  deriveCareerRecap,
  deriveCompetitivePlacement,
  derivePlayStyle,
  performanceBand,
  placementCopy,
  type PlacementSnapshot,
} from '@/components/game/ending/ending-model'
import {
  createFullCareerDependencies,
  createFullCareerRunDescriptor,
  closeCareer,
} from '@/content/full-career'
import {
  activeChallengeView,
  createRun,
  transition,
  type GameCommand,
  type RunState,
  type SolutionQuality,
} from '@/game'
import type {
  PublicCompetitionState,
  VerifiedAttemptPayload,
} from '@/lib/competition'
import { grade5Answer } from '../helpers/grade-5-play'

/** Una carrera real jugada en el motor: los hechos salen de ahí, no de un mock. */
function playCareer(
  seed: string,
  quality: (templateId: string) => SolutionQuality,
): RunState {
  const dependencies = createFullCareerDependencies()
  const built = createFullCareerRunDescriptor(seed)
  if (!built.ok) throw new Error('descriptor failed')
  const created = createRun(built.value, dependencies)
  if (!created.ok) throw new Error('create failed')
  let state = created.value.state
  for (let step = 0; step < 240 && state.status === 'active'; step += 1) {
    let command: GameCommand = { type: 'CONTINUE' }
    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, dependencies)
      if (!view.ok || view.value === undefined) throw new Error('no view')
      let answer
      try {
        answer = grade5Answer(
          view.value,
          dependencies,
          quality(view.value.ref.templateId),
          built.value,
        )
      } catch {
        answer = grade5Answer(view.value, dependencies, 'optimal', built.value)
      }
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer,
      }
    }
    const next = transition(state, command, dependencies)
    if (!next.ok) throw new Error(JSON.stringify(next.error))
    state = next.value.state
  }
  if (state.status !== 'completed') throw new Error('career did not finish')
  return state
}

const routed = new Set(
  Object.entries(createFullCareerDependencies().recoveryContent?.reviews ?? {})
    .filter(([, reviews]) => reviews.length > 0)
    .map(([templateId]) => templateId),
)

describe('franjas de desempeño', () => {
  it('cubre la escala entera del FairScore en los límites', () => {
    expect(performanceBand(10_000)).toBe('exceptional')
    expect(performanceBand(PERFORMANCE_THRESHOLDS.exceptional)).toBe(
      'exceptional',
    )
    expect(performanceBand(PERFORMANCE_THRESHOLDS.exceptional - 1)).toBe(
      'strong',
    )
    expect(performanceBand(PERFORMANCE_THRESHOLDS.strong)).toBe('strong')
    expect(performanceBand(PERFORMANCE_THRESHOLDS.strong - 1)).toBe('solid')
    expect(performanceBand(PERFORMANCE_THRESHOLDS.solid)).toBe('solid')
    expect(performanceBand(PERFORMANCE_THRESHOLDS.solid - 1)).toBe('weak')
    expect(performanceBand(PERFORMANCE_THRESHOLDS.weak)).toBe('weak')
    expect(performanceBand(PERFORMANCE_THRESHOLDS.weak - 1)).toBe('struggling')
    expect(performanceBand(0)).toBe('struggling')
  })

  it('cada franja tiene sus dos frases, y ninguna se ríe de la persona', () => {
    for (const band of PERFORMANCE_BANDS) {
      const { headline, closing } = PERFORMANCE_FEEDBACK[band]
      expect(headline.length).toBeGreaterThan(8)
      expect(closing.length).toBeGreaterThan(8)
      for (const forbidden of [
        'pésimo',
        'fracas',
        'mal alumno',
        'burro',
        'tonto',
        'vergüenza',
        'peor',
      ])
        expect(`${headline} ${closing}`.toLowerCase()).not.toContain(forbidden)
    }
    // La franja baja invita a la revancha en vez de cerrar la puerta.
    expect(PERFORMANCE_FEEDBACK.struggling.closing).toMatch(/revancha|próxima/u)
    expect(PERFORMANCE_FEEDBACK.weak.closing).toMatch(/puntaje/u)
  })
})

describe('estilo de juego', () => {
  const base = {
    estilo: { aplicado: 34, estratega: 33, improvisador: 33 },
    estiloEstablished: true,
    equipo: null,
    aura: null,
  }

  it('nombra el eje que domina con margen', () => {
    expect(
      derivePlayStyle({
        ...base,
        estilo: { aplicado: 20, estratega: 55, improvisador: 25 },
      }).id,
    ).toBe('estratega')
    expect(
      derivePlayStyle({
        ...base,
        estilo: { aplicado: 60, estratega: 20, improvisador: 20 },
      }).id,
    ).toBe('cabeza-fria')
    expect(
      derivePlayStyle({
        ...base,
        estilo: { aplicado: 20, estratega: 25, improvisador: 55 },
      }).id,
    ).toBe('sobre-la-marcha')
  })

  it('un empate no fuerza un eje: es equilibrio', () => {
    expect(derivePlayStyle(base).id).toBe('equilibrio')
    expect(
      derivePlayStyle({
        ...base,
        estilo: { aplicado: 40, estratega: 31, improvisador: 29 },
      }).id,
    ).toBe('equilibrio')
    // Justo en el margen cuenta como dominante.
    expect(
      derivePlayStyle({
        ...base,
        estilo: { aplicado: 42, estratega: 32, improvisador: 26 },
      }).id,
    ).toBe('cabeza-fria')
  })

  it('sin evidencia de Estilo no afirma un eje', () => {
    expect(derivePlayStyle({ ...base, estiloEstablished: false }).id).toBe(
      'todo-terreno',
    )
  })

  it('Equipo y Aura altos pesan más que el eje, y Equipo antes que Aura', () => {
    const strategist = { aplicado: 20, estratega: 55, improvisador: 25 }
    expect(
      derivePlayStyle({ ...base, estilo: strategist, equipo: TEAM_STYLE_MIN })
        .id,
    ).toBe('motor-del-equipo')
    expect(
      derivePlayStyle({
        ...base,
        estilo: strategist,
        equipo: TEAM_STYLE_MIN - 1,
      }).id,
    ).toBe('estratega')
    expect(
      derivePlayStyle({ ...base, estilo: strategist, aura: AURA_STYLE_MIN }).id,
    ).toBe('aura-del-curso')
    expect(
      derivePlayStyle({
        ...base,
        estilo: strategist,
        equipo: TEAM_STYLE_MIN,
        aura: AURA_STYLE_MIN,
      }).id,
    ).toBe('motor-del-equipo')
    // Un Aura negativo no es un estilo.
    expect(
      derivePlayStyle({ ...base, estilo: strategist, aura: -300 }).id,
    ).toBe('estratega')
  })

  it('es determinista sobre una carrera real', () => {
    const state = playCareer('ending-style', () => 'optimal')
    const closed = closeCareer(state)
    const twice = closeCareer(state)
    expect(
      deriveAchievements(state, closed.milestones, closed.memories),
    ).toEqual(deriveAchievements(state, twice.milestones, twice.memories))
    expect(deriveCareerRecap(state, closed.memories)).toEqual(
      deriveCareerRecap(state, twice.memories),
    )
  })
})

describe('hitos', () => {
  it('sólo muestra lo que un hecho registrado sostiene', () => {
    const state = playCareer('ending-optimal', () => 'optimal')
    const closed = closeCareer(state)
    const achievements = deriveAchievements(
      state,
      closed.milestones,
      closed.memories,
    )
    const ids = achievements.map((entry) => entry.id)

    // Egresó jugando los seis años: el hito del motor está y se muestra.
    expect(closed.milestones.map((entry) => entry.id)).toContain(
      'milestone.graduated',
    )
    expect(ids).toContain('milestone.graduated')
    // Todo Óptimo: el hito del motor se completa con los años, derivados igual.
    expect(ids).toContain('milestone.perfect-year')
    const perfect = achievements.find(
      (entry) => entry.id === 'milestone.perfect-year',
    )
    expect(perfect?.detail).toMatch(/7\.º/u)
    // Nada que la carrera no haya hecho: sin Repaso no hay «Volviste».
    expect(ids).not.toContain('milestone.came-back')
    // Y nada que el dominio no tenga.
    for (const invented of ['abanderado', 'escolta', 'capitán'])
      expect(JSON.stringify(achievements).toLowerCase()).not.toContain(invented)
    for (const entry of achievements)
      expect(['milestone', 'flag', 'career']).toContain(entry.source)
  })

  it('un hito ausente no aparece, y uno presente sí', () => {
    const state = playCareer('ending-repaso', (id) =>
      routed.has(id) ? 'invalid' : 'optimal',
    )
    const closed = closeCareer(state)
    expect(state.progression.history.length).toBeGreaterThan(0)
    const ids = deriveAchievements(
      state,
      closed.milestones,
      closed.memories,
    ).map((entry) => entry.id)
    expect(ids).toContain('milestone.came-back')
    // Quitar el hito del motor lo quita de la pantalla: la pantalla no lo deduce sola.
    const without = deriveAchievements(
      state,
      closed.milestones.filter((entry) => entry.id !== 'milestone.came-back'),
      closed.memories,
    ).map((entry) => entry.id)
    expect(without).not.toContain('milestone.came-back')
  })

  it('los hitos de contenido salen de flags escritas por una Template', () => {
    const state = playCareer('ending-optimal', () => 'optimal')
    const closed = closeCareer(state)
    const withFlag = {
      ...state,
      flags: { ...state.flags, 'g7.actoImpecable': true },
    }
    const withoutFlag = { ...state, flags: {} }
    expect(
      deriveAchievements(withFlag, closed.milestones, closed.memories).map(
        (entry) => entry.id,
      ),
    ).toContain('flag.acto-impecable')
    expect(
      deriveAchievements(withoutFlag, closed.milestones, closed.memories).map(
        (entry) => entry.id,
      ),
    ).not.toContain('flag.acto-impecable')
  })

  it('una carrera sin hitos devuelve una lista vacía, no un premio de consuelo', () => {
    const state = playCareer('ending-optimal', () => 'optimal')
    const bare = {
      ...state,
      flags: {},
      career: { ...state.career, aura: null },
    }
    expect(deriveAchievements(bare, [], [])).toEqual([])
  })
})

describe('recorrido por año', () => {
  it('ordena los seis años, con tema aprobado y marcador verdadero', () => {
    const state = playCareer('ending-repaso', (id) =>
      routed.has(id) ? 'invalid' : 'optimal',
    )
    const recap = deriveCareerRecap(state, closeCareer(state).memories)
    expect(recap.map((year) => year.stage)).toEqual([
      'grade-7',
      'year-1',
      'year-2',
      'year-3',
      'year-4',
      'year-5',
    ])
    expect(recap.map((year) => year.theme)).toEqual([
      'Adaptación',
      'Consolidación',
      'Pertenencia',
      'Autonomía',
      'Responsabilidad',
      'Cierre',
    ])
    expect(recap.every((year) => year.played)).toBe(true)
    const reviewed = new Set(
      state.progression.history.map((record) => record.stageId),
    )
    for (const year of recap) {
      if (reviewed.has(year.stage))
        expect(['review', 'review-previa']).toContain(year.marker)
      else expect(['perfect', 'completed']).toContain(year.marker)
      expect(year.highlight).toBeTypeOf('string')
    }
  })

  it('un año que no se jugó no se inventa', () => {
    const state = playCareer('ending-optimal', () => 'optimal')
    const truncated = {
      ...state,
      history: state.history.filter((entry) => entry.stage !== 'year-5'),
    }
    const recap = deriveCareerRecap(truncated, [])
    expect(recap.at(-1)?.marker).toBe('not-played')
    expect(recap.at(-1)?.played).toBe(false)
    expect(recap.at(-1)?.highlight).toBeUndefined()
  })
})

describe('posición competitiva', () => {
  const verified = (
    overrides: Partial<VerifiedAttemptPayload> = {},
  ): VerifiedAttemptPayload => ({
    attemptId: 'a',
    status: 'VERIFIED',
    fairScore: 9000,
    prestigeScore: 0,
    graduated: true,
    rejectionCode: undefined,
    personalBest: true,
    ...overrides,
  })
  const state = (
    rank: number | undefined,
    leaderboard: readonly { rank: number; score: number; you?: boolean }[],
  ): PublicCompetitionState => ({
    competition: {
      name: 'Feria',
      status: 'open',
      opensAt: undefined,
      closesAt: undefined,
    },
    leaderboard: leaderboard.map((entry, index) => ({
      rank: entry.rank,
      nickname: `p${String(index)}`,
      fairScore: entry.score,
      isYou: entry.you === true,
    })),
    totalRanked: 12,
    you:
      rank === undefined
        ? undefined
        : {
            nickname: 'yo',
            bestFairScore: 9000,
            bestPrestigeScore: 0,
            rank,
            attempts: 1,
            activeAttempt: undefined,
          },
  })

  it('1.º solo: está 1.º, sin récord por el solo hecho de estar primero', () => {
    const placement = deriveCompetitivePlacement(
      verified(),
      state(1, [{ rank: 1, score: 9000, you: true }]),
    )
    expect(placement).toMatchObject({
      rank: 1,
      shared: false,
      podium: true,
      first: true,
      newFirst: false,
      record: false,
    })
    expect(placementCopy(placement).claim).toBe('Estás 1.º.')
  })

  it('1.º compartido nunca afirma exclusividad', () => {
    const placement = deriveCompetitivePlacement(
      verified(),
      state(1, [
        { rank: 1, score: 9000 },
        { rank: 1, score: 9000, you: true },
      ]),
      { rank: undefined, bestFairScore: undefined, topScore: 8000 },
    )
    expect(placement.shared).toBe(true)
    expect(placement.record).toBe(false)
    expect(placementCopy(placement).claim).toBe('Compartís el 1.º puesto.')
  })

  it('2.º y 3.º entran al podio; 4.º o más no', () => {
    const second = deriveCompetitivePlacement(
      verified(),
      state(2, [
        { rank: 1, score: 9500 },
        { rank: 2, score: 9000, you: true },
      ]),
    )
    expect(second.podium).toBe(true)
    expect(placementCopy(second).claim).toBe('Entraste al podio.')
    const third = deriveCompetitivePlacement(
      verified(),
      state(3, [
        { rank: 1, score: 9500 },
        { rank: 2, score: 9200 },
        { rank: 3, score: 9000, you: true },
      ]),
    )
    expect(third.podium).toBe(true)
    const seventh = deriveCompetitivePlacement(
      verified(),
      state(7, [
        { rank: 1, score: 9500 },
        { rank: 2, score: 9200 },
        { rank: 3, score: 9100 },
      ]),
    )
    expect(seventh.podium).toBe(false)
    expect(seventh.shared).toBeUndefined()
    expect(placementCopy(seventh).claim).toBeUndefined()
    // El número grande ya dice el puesto; no se repite en prosa.
    expect(placementCopy(seventh).rankLine).toBeUndefined()
  })

  it('sin puesto no dibuja un número ni afirma nada', () => {
    const placement = deriveCompetitivePlacement(
      verified(),
      state(undefined, []),
    )
    expect(placement.rank).toBeUndefined()
    expect(placement.podium).toBe(false)
    expect(placementCopy(placement).claim).toBeUndefined()
    expect(placementCopy(placement).rankLine).toMatch(/No pudimos leer/u)
  })

  it('«nuevo 1.º puesto» sólo con evidencia de antes y después', () => {
    const before: PlacementSnapshot = {
      rank: 4,
      bestFairScore: 7000,
      topScore: 9500,
    }
    const climbed = deriveCompetitivePlacement(
      verified({ fairScore: 9600 }),
      state(1, [{ rank: 1, score: 9600, you: true }]),
      before,
    )
    expect(climbed.newFirst).toBe(true)
    expect(placementCopy(climbed).claim).toMatch(/Récord/u)
    // Sin snapshot no hay «nuevo»: sólo «estás 1.º».
    const unknown = deriveCompetitivePlacement(
      verified({ fairScore: 9600 }),
      state(1, [{ rank: 1, score: 9600, you: true }]),
    )
    expect(unknown.newFirst).toBe(false)
    expect(unknown.record).toBe(false)
    // Si ya era 1.º, no subió.
    const stayed = deriveCompetitivePlacement(
      verified({ fairScore: 9000, personalBest: false }),
      state(1, [{ rank: 1, score: 9600, you: true }]),
      { rank: 1, bestFairScore: 9600, topScore: 9600 },
    )
    expect(stayed.newFirst).toBe(false)
    expect(stayed.record).toBe(false)
  })

  it('récord sólo si supera el mejor puntaje previo del podio, sin compartir', () => {
    const before: PlacementSnapshot = {
      rank: 2,
      bestFairScore: 9000,
      topScore: 9500,
    }
    const tied = deriveCompetitivePlacement(
      verified({ fairScore: 9500 }),
      state(1, [
        { rank: 1, score: 9500 },
        { rank: 1, score: 9500, you: true },
      ]),
      before,
    )
    expect(tied.record).toBe(false)
    const equal = deriveCompetitivePlacement(
      verified({ fairScore: 9500 }),
      state(1, [{ rank: 1, score: 9500, you: true }]),
      before,
    )
    expect(equal.record).toBe(false)
    const above = deriveCompetitivePlacement(
      verified({ fairScore: 9600 }),
      state(1, [{ rank: 1, score: 9600, you: true }]),
      before,
    )
    expect(above.record).toBe(true)
    expect(above.newFirst).toBe(true)
    expect(placementCopy(above).claim).toMatch(/^Récord de la competencia/u)
    // Un podio vacío al empezar no da un récord: no había marca que superar.
    const firstEver = deriveCompetitivePlacement(
      verified({ fairScore: 9600 }),
      state(1, [{ rank: 1, score: 9600, you: true }]),
      { rank: undefined, bestFairScore: undefined, topScore: undefined },
    )
    expect(firstEver.record).toBe(false)
    expect(firstEver.newFirst).toBe(true)
    expect(placementCopy(firstEver).claim).toBe('Subiste al 1.º puesto.')
  })

  it('el mejor puntaje personal distingue primera partida, mejora y no mejora', () => {
    const rows = state(5, [])
    expect(deriveCompetitivePlacement(verified(), rows).personalBest).toBe(
      'first',
    )
    expect(
      deriveCompetitivePlacement(verified(), rows, {
        rank: 6,
        bestFairScore: 8000,
        topScore: 9500,
      }).personalBest,
    ).toBe('improved')
    expect(
      deriveCompetitivePlacement(verified({ personalBest: false }), rows, {
        rank: 5,
        bestFairScore: 9500,
        topScore: 9800,
      }).personalBest,
    ).toBe('not-best')
    expect(
      placementCopy(deriveCompetitivePlacement(verified(), rows)).personalBest,
    ).toContain('Es tu mejor partida')
  })
})

// The compact ranking must not turn a shared first place into an exclusive record.
it('recognizes ties from compressed server membership', () => {
  const state = {
    competition: {
      name: 'Test',
      status: 'open' as const,
      opensAt: undefined,
      closesAt: undefined,
    },
    leaderboard: [
      {
        rank: 1,
        nickname: 'Yo',
        fairScore: 10000,
        isYou: true,
        sharedCount: 499,
      },
    ],
    totalRanked: 500,
    you: {
      nickname: 'Yo',
      rank: 1,
      bestFairScore: 10000,
      bestPrestigeScore: 0,
      attempts: 1,
      activeAttempt: undefined,
    },
  }
  const result = {
    attemptId: 'a',
    status: 'VERIFIED' as const,
    fairScore: 10000,
    prestigeScore: 0,
    graduated: true,
    rejectionCode: undefined,
    personalBest: true,
  }
  const placement = deriveCompetitivePlacement(result, state, {
    rank: undefined,
    bestFairScore: undefined,
    topScore: 9000,
  })
  expect(placement.shared).toBe(true)
  expect(placement.record).toBe(false)
})
