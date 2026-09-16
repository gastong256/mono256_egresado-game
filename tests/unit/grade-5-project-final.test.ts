import { describe, expect, it } from 'vitest'
import { bandOf, cognitiveLoad } from '@/game'
import {
  CREW,
  FINAL_SPACE,
  STANCES,
  TASKS,
  auraPointsOf,
  courseProjectFinal,
  evaluateFinal,
  finalGates,
  finalPlans,
  generateFinal,
  readFinal,
  stanceRisk,
  type FinalParams,
} from '@/content/grade-5/challenges/course-project-final'

const WINDOW = 400
const approved: readonly FinalParams[] = Array.from(
  { length: WINDOW },
  (_, index) => generateFinal(index),
).filter((params) => finalGates(params).length === 0)

const sample = approved[0]
if (sample === undefined) throw new Error('sin variante aprobada')
const plans = finalPlans(sample)
const optimal = plans.find((plan) => plan.quality === 'optimal')
if (optimal === undefined) throw new Error('sin plan óptimo')

describe('5.º · Proyecto del Curso: la muestra final', () => {
  it('aprueba un catálogo suficiente y es el DEEP del arco Proyecto', () => {
    expect(approved.length).toBeGreaterThanOrEqual(24)
    expect(FINAL_SPACE).toBeGreaterThan(WINDOW)
    expect(courseProjectFinal.band).toBe('standard')
    expect(bandOf(courseProjectFinal.cognitive)).toBe('standard')
    expect(cognitiveLoad(courseProjectFinal.cognitive)).toBeLessThanOrEqual(7)
    expect(courseProjectFinal.composition).toMatchObject({
      primaryReasoningFamily: 'ALLOCATION',
      interactionEngine: 'allocate-constrain',
      pacingClass: 'DEEP',
      recurringArc: 'PROJECT',
    })
  })

  it('LOCKED: la contingencia aprieta, el plan de antes ya no cierra', () => {
    for (const params of approved.slice(0, 40)) {
      const untouched = TASKS.map((task) => ({
        statementId: task.id,
        labelId: 'mantener',
      }))
      expect(readFinal(params, untouched).quality).toBe('invalid')
    }
  })

  it('LOCKED: Math, Equipo y Aura son tres evidencias distintas', () => {
    // La misma reconstrucción con tres posturas: misma calidad, mismo Equipo,
    // tres Auras.
    const results = STANCES.map((stance) => {
      const result = evaluateFinal(sample, optimal.entries, stance.id)
      if (!result.ok) throw new Error('evaluación rechazada')
      return {
        quality: result.value.quality,
        equipo: result.value.careerEffects.equipo,
        aura: result.value.careerEffects.aura,
        efficiency: result.value.metrics.efficiency,
      }
    })
    expect(new Set(results.map((entry) => entry.quality)).size).toBe(1)
    expect(new Set(results.map((entry) => entry.equipo)).size).toBe(1)
    expect(new Set(results.map((entry) => entry.aura)).size).toBe(3)

    // Y la misma postura con reconstrucciones distintas: mismo Aura.
    const other = plans.find(
      (plan) => plan.quality !== 'optimal' && plan.quality !== 'invalid',
    )
    if (other === undefined) throw new Error('sin plan intermedio')
    for (const stance of STANCES) {
      const good = evaluateFinal(sample, optimal.entries, stance.id)
      const worse = evaluateFinal(sample, other.entries, stance.id)
      if (!good.ok || !worse.ok) throw new Error('evaluación rechazada')
      expect(worse.value.careerEffects.aura).toBe(good.value.careerEffects.aura)
      expect(worse.value.metrics.risk).toBe(good.value.metrics.risk)
    }
  })

  it('Equipo se lee entre planes que ya cierran y no cambia la calidad', () => {
    for (const params of approved.slice(0, 20)) {
      const all = finalPlans(params)
      const best = all.filter((plan) => plan.quality === 'optimal')
      expect(new Set(best.map((plan) => plan.team)).size).toBeGreaterThan(1)
      for (const plan of all)
        if (plan.quality === 'invalid') expect(plan.team).toBe(0)
    }
  })

  it('Estilo describe cómo se rehízo el plan y no anuncia el resultado', () => {
    const byStyle = new Map<string, Set<string>>()
    for (const plan of plans) {
      if (plan.quality === 'invalid') {
        expect(plan.style).toBeUndefined()
        continue
      }
      const tiers = byStyle.get(plan.style ?? '') ?? new Set<string>()
      tiers.add(plan.quality)
      byStyle.set(plan.style ?? '', tiers)
    }
    for (const tiers of byStyle.values()) expect(tiers.size).toBeGreaterThan(1)
    expect(
      [...byStyle.values()].filter((tiers) => tiers.has('optimal')).length,
    ).toBeGreaterThanOrEqual(2)
  })

  it('la postura se mide contra a quién le cambia el día, no contra el plan', () => {
    for (const params of approved.slice(0, 40))
      for (const stance of STANCES) {
        const risk = stanceRisk(params, stance.id)
        expect(risk).toBeGreaterThanOrEqual(0)
        expect(risk).toBeLessThanOrEqual(1)
        // Avisar rinde cuando el cambio se nota afuera; resolverlo en silencio,
        // cuando no. Ninguna de las dos depende de la reconstrucción.
        if (stance.id === 'avisar')
          expect(auraPointsOf(params, stance.id) > 0).toBe(params.visible)
        if (stance.id === 'resolver')
          expect(auraPointsOf(params, stance.id) > 0).toBe(!params.visible)
      }
  })

  it('el evaluador rechaza un plan sin postura, con etiqueta inventada o incompleto', () => {
    expect(evaluateFinal(sample, optimal.entries, undefined).ok).toBe(false)
    expect(evaluateFinal(sample, optimal.entries, 'callarse').ok).toBe(false)
    expect(
      evaluateFinal(
        sample,
        optimal.entries.map((entry) => ({ ...entry, labelId: 'delegar' })),
        'avisar',
      ).ok,
    ).toBe(false)
    expect(CREW.length).toBe(4)
  })
})
