import { describe, expect, it } from 'vitest'
import {
  PRESTIGE_MAX,
  PRESTIGE_TRACKS,
  buildEpilogue,
  candidatePrestigePolicy,
  careerMemories,
  earnedMilestones,
  milestoneIssues,
  prestigeOpportunityIssues,
  prestigePolicyIssues,
  scorePrestige,
  selectSalientMemories,
  type CareerMemory,
  type PrestigeOpportunity,
  type RunState,
} from '@/game'
import {
  careerMilestones,
  careerPrestigeOpportunities,
  iconicStorylets,
} from '@/content/career-closing'
import { careerRareEvents } from '@/content/rare-events'
import { createFullCareerDependencies } from '@/content/full-career'

const state = {} as RunState

function opportunity(
  overrides: Partial<PrestigeOpportunity> = {},
): PrestigeOpportunity {
  return {
    id: 'prestige.test',
    track: 'special',
    points: 10,
    evidence: 'evidence.test',
    independence: 'no la cobró ninguna otra dimensión',
    earned: () => true,
    ...overrides,
  }
}

describe('Prestige', () => {
  it('los tres tracks suman el techo estructural y la política es candidata', () => {
    expect(prestigePolicyIssues(candidatePrestigePolicy)).toEqual([])
    expect(candidatePrestigePolicy.official).toBe(false)
    expect(candidatePrestigePolicy.caps).toEqual({
      'career-arc': 40,
      special: 40,
      rare: 20,
    })
    expect(
      PRESTIGE_TRACKS.reduce(
        (total, track) => total + candidatePrestigePolicy.caps[track],
        0,
      ),
    ).toBe(PRESTIGE_MAX)
  })

  it('la misma evidencia no puede pagar dos veces', () => {
    const twice = [
      opportunity({ id: 'prestige.a' }),
      opportunity({ id: 'prestige.b' }),
    ]
    expect(prestigeOpportunityIssues(twice, candidatePrestigePolicy)).toContain(
      'two opportunities claim the same evidence: evidence.test',
    )
    const scored = scorePrestige(state, twice, candidatePrestigePolicy)
    expect(scored.awards).toHaveLength(1)
    expect(scored.total).toBe(10)
  })

  it('una oportunidad tiene que decir por qué su evidencia es independiente', () => {
    expect(
      prestigeOpportunityIssues(
        [opportunity({ independence: '  ' })],
        candidatePrestigePolicy,
      ),
    ).toContain('prestige.test does not say why its evidence is independent')
  })

  it('el techo de cada track manda sobre lo autorado', () => {
    const many = Array.from({ length: 6 }, (_, index) =>
      opportunity({
        id: `prestige.${String(index)}`,
        evidence: `evidence.${String(index)}`,
        points: 10,
      }),
    )
    expect(prestigeOpportunityIssues(many, candidatePrestigePolicy)).toContain(
      'track special offers more than its cap',
    )
    const scored = scorePrestige(state, many, candidatePrestigePolicy)
    expect(scored.byTrack.special).toBe(40)
    expect(scored.total).toBeLessThanOrEqual(PRESTIGE_MAX)
  })

  it('esta edición no ofrece Prestige, y lo dice en vez de inventar puntos', () => {
    expect(careerPrestigeOpportunities).toEqual([])
    const scored = scorePrestige(
      state,
      careerPrestigeOpportunities,
      candidatePrestigePolicy,
    )
    expect(scored.total).toBe(0)
    // El techo **ofrecido** es cero y es el mismo para todos: no se normaliza
    // para llegar a 100.
    expect(scored.offered).toEqual({ 'career-arc': 0, special: 0, rare: 0 })
    expect(scored.awards).toEqual([])
  })
})

describe('Hitos de display', () => {
  it('ninguno es elegible para Prestige, y eso es del contrato', () => {
    expect(milestoneIssues(careerMilestones)).toEqual([])
    for (const milestone of careerMilestones)
      expect(milestone.prestigeEligible).toBe(false)
    // Los hitos que el canon permite como badge son exactamente de este tipo:
    // matemática perfecta, Repaso, rareza, Estilo y terminar la carrera.
    expect(careerMilestones.map((entry) => entry.id)).toContain(
      'milestone.saw-something-rare',
    )
  })
})

describe('Saliencia narrativa v1', () => {
  const memory = (
    id: string,
    stage: CareerMemory['stage'],
    kind: CareerMemory['kind'],
    salienceRank = 10,
  ): CareerMemory => ({
    id,
    stage,
    kind,
    title: id,
    text: id,
    salienceRank,
  })

  it('elige uno temprano, uno medio y uno final, y hasta dos extras', () => {
    const chosen = selectSalientMemories([
      memory('a', 'grade-7', 'ordinary'),
      memory('b', 'year-2', 'iconic'),
      memory('c', 'year-3', 'ordinary'),
      memory('d', 'year-4', 'recovery'),
      memory('e', 'year-5', 'ordinary'),
      memory('f', 'year-5', 'milestone'),
      memory('g', 'year-1', 'rare'),
      memory('h', 'year-5', 'milestone', 5),
    ])
    expect(chosen.length).toBeGreaterThanOrEqual(3)
    expect(chosen.length).toBeLessThanOrEqual(5)
    // El temprano es el raro, el medio el Repaso, el final una escena de 5.º.
    expect(chosen.map((entry) => entry.id)).toContain('g')
    expect(chosen.map((entry) => entry.id)).toContain('d')
    expect(chosen.map((entry) => entry.id)).toContain('e')
    expect(new Set(chosen.map((entry) => entry.id)).size).toBe(chosen.length)
  })

  it('el mínimo no exige rareza ni Proyecto: alcanza con lo ordinario', () => {
    const chosen = selectSalientMemories([
      memory('a', 'grade-7', 'ordinary'),
      memory('c', 'year-3', 'ordinary'),
      memory('e', 'year-5', 'ordinary'),
    ])
    expect(chosen.map((entry) => entry.id)).toEqual(['a', 'c', 'e'])
  })

  it('los empates los rompe la prioridad editorial y después el id', () => {
    const first = selectSalientMemories([
      memory('zeta', 'year-5', 'ordinary', 10),
      memory('alfa', 'year-5', 'ordinary', 10),
    ])
    expect(first[0]?.id).toBe('alfa')
    const second = selectSalientMemories([
      memory('zeta', 'year-5', 'ordinary', 99),
      memory('alfa', 'year-5', 'ordinary', 10),
    ])
    expect(second[0]?.id).toBe('zeta')
  })

  it('un hito nunca ocupa el recuerdo de un tramo: no es un momento', () => {
    const chosen = selectSalientMemories([
      memory('milestone:x', 'year-5', 'milestone', 99),
      memory('scene:y', 'year-5', 'ordinary', 1),
    ])
    expect(chosen[0]?.id).toBe('scene:y')
    expect(chosen.map((entry) => entry.id)).toContain('milestone:x')
  })
})

describe('Career Epilogue v1', () => {
  const deps = createFullCareerDependencies()

  it('el epílogo es determinista y no toca el score', () => {
    const completed = {
      completion: { graduated: true },
      career: {
        grades: [],
        equipo: null,
        aura: null,
        estilo: { aplicado: 34, estratega: 33, improvisador: 33 },
        estiloEvidence: 0,
        mastery: {},
      },
      descriptor: { mode: 'practice' },
      history: [],
      rare: [],
      progression: { history: [] },
    } as unknown as RunState

    const built = () =>
      buildEpilogue({
        state: completed,
        storylets: deps.storylets,
        rareEvents: careerRareEvents,
        milestones: earnedMilestones(completed, careerMilestones),
        iconicStorylets,
      })
    expect(built()).toEqual(built())
    expect(built().graduated).toBe(true)
    // Perfil corto y sin jerarquía: dos a cuatro líneas.
    expect(built().profile.length).toBeGreaterThanOrEqual(2)
    expect(built().profile.length).toBeLessThanOrEqual(4)
    // Dimensiones no establecidas siguen en null, nunca dibujadas como cero.
    expect(built().career.equipo).toBeNull()
    expect(built().career.aura).toBeNull()
  })

  it('los recuerdos salen de lo que la carrera ya escribió', () => {
    const memories = careerMemories({
      state: {
        history: [],
        rare: [],
      } as unknown as RunState,
      storylets: deps.storylets,
      rareEvents: careerRareEvents,
      milestones: [{ id: 'm', label: 'Un hito', detail: 'Pasó algo' }],
      iconicStorylets,
    })
    // Sin historia jugada sólo queda el hito: nada se inventa.
    expect(memories.map((entry) => entry.kind)).toEqual(['milestone'])
    expect(memories[0]?.title).toBe('Un hito')
  })
})
