import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  bandOf,
  canonicalize,
  cognitiveLoad,
  parseCommand,
  toVariantId,
} from '@/game'
import { materializeVariant } from '@/game/testing'
import {
  evaluateMobileData,
  generateMobileData,
  mobileData,
  mobileDataSchema,
  mobileGates,
  mobilePlans,
  MOBILE_DATA_SPACE,
  MUSIC_MAX,
  VIDEO_MAX,
  type MobileDataParams,
} from '@/content/grade-1/challenges/mobile-data'
import { approvedParams } from '../helpers/grade-1-approved'

const approved = approvedParams(mobileData, (value) =>
  mobileDataSchema.parse(value),
)
const plan = (school: number, music: number, video: number) => [
  { itemId: 'school', quantity: school },
  { itemId: 'music', quantity: music },
  { itemId: 'video', quantity: video },
]
const qualityOf = (p: MobileDataParams, lines: ReturnType<typeof plan>) => {
  const result = evaluateMobileData(p, lines)
  if (!result.ok) throw new Error(result.error.kind)
  return result.value
}

describe('1.º · datos móviles', () => {
  it('aprueba al menos 12 materializaciones de tres formas semánticas, todas con gates limpios', () => {
    expect(approved.length).toBeGreaterThanOrEqual(12)
    expect(new Set(approved.map(({ params }) => params.shape))).toEqual(
      new Set(['either-or', 'rest-total', 'keep-reserve']),
    )
    expect(
      new Set(approved.map(({ params }) => params.music)).size,
    ).toBeGreaterThan(1)
    expect(
      new Set(approved.map(({ params }) => params.days)).size,
    ).toBeGreaterThan(1)
    for (const { params } of approved) expect(mobileGates(params)).toEqual([])
    expect(MOBILE_DATA_SPACE).toBe(288)
  })

  it('clasifica CORE con los rasgos reales, sin optimización', () => {
    expect(cognitiveLoad(mobileData.cognitive)).toBe(4)
    expect(mobileData.band).toBe(bandOf(mobileData.cognitive))
    expect(mobileData.band).toBe('core')
    expect(mobileData.cognitive.optimization).toBe(0)
    expect(bandOf({ ...mobileData.cognitive, constraints: 3 })).toBe('standard')
    expect(mobileData.composition).toMatchObject({
      interactionEngine: 'allocate-constrain',
      pacingClass: 'QUICK',
    })
  })

  it.each(
    approved.map(({ variantId, params }) => [variantId, params] as const),
  )(
    '%s: el oráculo independiente coincide con el evaluador en todo plan acotado',
    (_, p) => {
      const plans = mobilePlans(p)
      const optimal = plans.filter((entry) => entry.quality === 'optimal')
      expect(optimal.length).toBeGreaterThanOrEqual(2)
      expect(new Set(optimal.map((entry) => entry.style)).size).toBeGreaterThan(
        1,
      )
      for (const entry of plans) {
        const evaluated = qualityOf(p, [...entry.lines])
        expect(evaluated.quality).toBe(entry.quality)
        const strategy = evaluated.flagEffects.find((flag) =>
          flag.flag.endsWith('strategy'),
        )
        expect(strategy?.value).toBe(entry.style)
      }
    },
  )

  it('Intrinsic Math Gate: el señuelo de cada forma no alcanza el pedido', () => {
    for (const { params: p } of approved) {
      const free = p.capacity - p.days * p.school
      if (p.shape === 'either-or') {
        const decoy =
          p.videos * p.video > free
            ? plan(p.days, 0, p.videos)
            : plan(p.days, p.songs, 0)
        expect(qualityOf(p, decoy).quality).toBe('invalid')
      } else if (p.shape === 'rest-total') {
        expect(qualityOf(p, plan(p.days, 0, p.sessions)).quality).toBe(
          'invalid',
        )
        expect(qualityOf(p, plan(p.days, p.sessions, 0)).quality).toBe(
          'optimal',
        )
      } else {
        expect(qualityOf(p, plan(p.days, 0, 1)).quality).toBe('optimal')
        expect(qualityOf(p, plan(p.days, 0, 2)).quality).not.toBe('optimal')
      }
    }
  })

  it('elegir todo, omitir un día o no descansar nunca es óptimo; INVALID no etiqueta estilo', () => {
    for (const { params: p } of approved) {
      const everything = qualityOf(p, plan(p.days, MUSIC_MAX, VIDEO_MAX))
      expect(everything.quality).toBe('invalid')
      expect(everything.careerEffects).toEqual({})
      expect(
        everything.flagEffects.some((flag) => flag.flag.endsWith('strategy')),
      ).toBe(false)
      expect(qualityOf(p, plan(p.days - 1, 0, 0)).quality).toBe('invalid')
      expect(qualityOf(p, plan(p.days, 0, 0)).quality).toBe('functional')
    }
  })

  it('antes de confirmar no suma nada; después, el ledger muestra la cuenta real', () => {
    const { variantId, params: p } = approved[0]!
    const instance = materializeVariant(mobileData, {
      variantId: toVariantId(variantId),
      seed: 'mobile-view',
    })
    const presentation = instance.present([])
    expect(presentation.kind).toBe('quantity-builder')
    if (presentation.kind !== 'quantity-builder') return
    // A resource plan never gets the positions view, which is what a running
    // total would look like.
    expect(presentation.positions).toBeUndefined()
    expect(
      presentation.data.find((datum) => datum.label === 'Datos disponibles'),
    ).toMatchObject({ constraint: true })
    const result = qualityOf(p, plan(p.days, 1, 1))
    expect(result.feedback.facts.map((fact) => fact.label)).toContain('Total')
    expect(result.feedback.facts[0]?.value).toContain('×')
    expect(mobileData.scoring.team).toBe('none')
    expect(mobileData.scoring.aura).toBe('none')
  })

  it('rechaza IDs inventados, repetidos, fracciones y cantidades fuera del contrato', () => {
    const p = approved[0]!.params
    for (const lines of [
      [{ itemId: 'fake', quantity: 1 }],
      [
        { itemId: 'music', quantity: 1 },
        { itemId: 'music', quantity: 1 },
      ],
      [{ itemId: 'music', quantity: 0.5 }],
      [{ itemId: 'music', quantity: -1 }],
      [{ itemId: 'video', quantity: VIDEO_MAX + 1 }],
      [{ itemId: 'school', quantity: p.days + 1 }],
    ])
      expect(evaluateMobileData(p, lines).ok).toBe(false)
    expect(
      parseCommand({
        type: 'ANSWER',
        instanceId: 'test',
        answer: { kind: 'quantity-builder', lines: [], score: 10000 },
      }).ok,
    ).toBe(false)
    expect(
      mobileDataSchema.safeParse({ ...generateMobileData(0), weights: [1, 2] })
        .success,
    ).toBe(false)
  })

  it('el generador es una función pura de la dirección y su vista canónica es idempotente', () => {
    for (let index = 0; index < MOBILE_DATA_SPACE; index += 17) {
      const first = generateMobileData(index)
      expect(generateMobileData(index)).toEqual(first)
      expect(canonicalize(mobileDataSchema.parse(first))).toBe(
        canonicalize(first),
      )
    }
  })

  it('propiedad: para cualquier respuesta acotada, validez y pedido coinciden con aritmética entera', () => {
    const oracles = approved.map(({ params }) => ({
      params,
      byKey: new Map(
        mobilePlans(params).map((entry) => [
          `${String(entry.lines[1]?.quantity)}/${String(entry.lines[2]?.quantity)}`,
          entry.quality,
        ]),
      ),
    }))
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: oracles.length - 1 }),
        fc.integer({ min: 0, max: 7 }),
        fc.integer({ min: 0, max: MUSIC_MAX }),
        fc.integer({ min: 0, max: VIDEO_MAX }),
        (index, school, music, video) => {
          const { params: p, byKey } = oracles[index]!
          const days = Math.min(school, p.days)
          const lines = plan(days, music, video)
          const expected =
            days < p.days
              ? 'invalid'
              : byKey.get(`${String(music)}/${String(video)}`)
          expect(qualityOf(p, lines).quality).toBe(expected)
          expect(evaluateMobileData(p, [...lines].reverse())).toEqual(
            evaluateMobileData(p, lines),
          )
          expect(
            parseCommand(
              JSON.parse(
                canonicalize({
                  type: 'ANSWER',
                  instanceId: 'test',
                  answer: { kind: 'quantity-builder', lines },
                }),
              ),
            ).ok,
          ).toBe(true)
        },
      ),
      { numRuns: 800 },
    )
  })
})
