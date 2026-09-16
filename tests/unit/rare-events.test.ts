import { describe, expect, it } from 'vitest'
import {
  candidateRarePolicy,
  rareBudgetLeft,
  rareEventIssues,
  rarePolicyIssues,
  selectRareEvent,
  toChallengeId,
  toRunSeed,
  toStoryletId,
  type RareEventDefinition,
  type RareOccurrence,
} from '@/game'
import { initialCareer } from '@/game/progression/career'
import type { NarrativeContext } from '@/game/narrative/conditions'
import { careerRareEvents } from '@/content/rare-events'

const context: NarrativeContext = {
  stage: 'year-2',
  eventIndex: 3,
  career: initialCareer(),
  flags: {},
  seenStorylets: [toStoryletId('y2.intro')],
  qualityHistory: [],
}

const event: RareEventDefinition = {
  id: 'rare.test.one',
  stage: 'year-2',
  hostTemplate: toChallengeId('y2.intercurso-plan'),
  band: 'UNCOMMON',
  treatment: 'narrative-only',
  requires: { kind: 'storylet-seen', storyletId: toStoryletId('y2.intro') },
  note: { title: 'Algo pasó', text: 'Algo que cambia lo que se cuenta.' },
  salienceRank: 10,
}

function select(
  overrides: Partial<Parameters<typeof selectRareEvent>[0]> = {},
): RareOccurrence | undefined {
  return selectRareEvent({
    seed: toRunSeed('rare-seed'),
    stage: 'year-2',
    eventIndex: 3,
    templateId: toChallengeId('y2.intercurso-plan'),
    events: [event],
    policy: {
      ...candidateRarePolicy,
      chancePerMille: { UNCOMMON: 1000, RARE: 1000, VERY_RARE: 1000 },
    },
    occurred: [],
    context,
    ...overrides,
  })
}

describe('eventos raros', () => {
  it('la calibración v1 es la del diseño y es configuración, no una constante', () => {
    expect(rarePolicyIssues(candidateRarePolicy)).toEqual([])
    expect(candidateRarePolicy.official).toBe(false)
    expect(candidateRarePolicy.chancePerMille).toEqual({
      UNCOMMON: 150,
      RARE: 75,
      VERY_RARE: 20,
    })
    expect(candidateRarePolicy.budget).toEqual({
      events: 2,
      scoring: 1,
      veryRare: 1,
    })
  })

  it('misma seed y mismo estado dan la misma presencia rara', () => {
    const first = select()
    const second = select()
    expect(first).toEqual(second)
    expect(first?.id).toBe('rare.test.one')
    // Y otra seed es otra pregunta: con probabilidad 1 sigue apareciendo, pero
    // la dirección es distinta.
    expect(select({ seed: toRunSeed('otra') })?.id).toBe('rare.test.one')
  })

  it('primero la elegibilidad y después el sorteo', () => {
    expect(
      select({ context: { ...context, seenStorylets: [] } }),
    ).toBeUndefined()
    // Sin la escena del año, ninguna probabilidad alcanza.
    expect(
      select({
        context: { ...context, seenStorylets: [] },
        policy: {
          ...candidateRarePolicy,
          chancePerMille: { UNCOMMON: 1000, RARE: 1000, VERY_RARE: 1000 },
        },
      }),
    ).toBeUndefined()
  })

  it('no aparece fuera de su etapa ni de su Template anfitriona', () => {
    expect(select({ stage: 'year-3' })).toBeUndefined()
    expect(
      select({ templateId: toChallengeId('y2.court-zones') }),
    ).toBeUndefined()
  })

  it('el presupuesto de la carrera manda sobre el sorteo', () => {
    const occurred: readonly RareOccurrence[] = [
      {
        id: 'rare.otro',
        stage: 'year-1',
        eventIndex: 1,
        band: 'UNCOMMON',
        treatment: 'narrative-only',
      },
      {
        id: 'rare.otro-2',
        stage: 'year-1',
        eventIndex: 2,
        band: 'UNCOMMON',
        treatment: 'narrative-only',
      },
    ]
    expect(select({ occurred })).toBeUndefined()
    expect(rareBudgetLeft(candidateRarePolicy, occurred).events).toBe(0)

    // Un modificador puntuable ya gastado cierra la puerta a otro.
    const scoring: readonly RareOccurrence[] = [
      {
        id: 'rare.otro',
        stage: 'year-1',
        eventIndex: 1,
        band: 'RARE',
        treatment: 'variant-modifier',
      },
    ]
    expect(rareBudgetLeft(candidateRarePolicy, scoring).scoring).toBe(0)
    expect(
      select({
        occurred: scoring,
        events: [{ ...event, treatment: 'variant-modifier' }],
      }),
    ).toBeUndefined()
    // …pero uno narrativo sigue pudiendo aparecer: el techo es por tratamiento.
    expect(select({ occurred: scoring })?.treatment).toBe('narrative-only')
  })

  it('el mismo evento no aparece dos veces en una carrera', () => {
    expect(
      select({
        occurred: [
          {
            id: 'rare.test.one',
            stage: 'year-2',
            eventIndex: 1,
            band: 'UNCOMMON',
            treatment: 'narrative-only',
          },
        ],
      }),
    ).toBeUndefined()
  })

  it('probabilidad cero no sortea nada', () => {
    expect(
      select({
        policy: {
          ...candidateRarePolicy,
          chancePerMille: { UNCOMMON: 0, RARE: 0, VERY_RARE: 0 },
        },
      }),
    ).toBeUndefined()
  })

  it('los eventos de la carrera son válidos y su elegibilidad no mira el desempeño', () => {
    expect(careerRareEvents.length).toBeGreaterThanOrEqual(4)
    for (const entry of careerRareEvents) {
      expect(rareEventIssues(entry), entry.id).toEqual([])
      // Ninguna condición lee calidades: un evento raro que apareciera más
      // seguido para quien viene ganando sería «win-more».
      expect(JSON.stringify(entry.requires)).not.toContain('recent-quality')
      expect(JSON.stringify(entry.requires)).not.toContain('career-at-least')
    }
    expect(
      careerRareEvents.filter((entry) => entry.treatment === 'variant-modifier')
        .length,
    ).toBeLessThanOrEqual(candidateRarePolicy.budget.events)
  })
})
