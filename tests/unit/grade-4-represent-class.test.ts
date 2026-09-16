import { describe, expect, it } from 'vitest'
import { bandOf, cognitiveLoad } from '@/game'
import {
  PROPOSALS,
  REPRESENT_SPACE,
  STANCES,
  auraPointsOf,
  blockedBy,
  classificationQuality,
  evaluateRepresent,
  fits,
  generateRepresent,
  representClass,
  representGates,
  representPlans,
  stanceRisk,
  type RepresentParams,
} from '@/content/grade-4/challenges/represent-class'

const WINDOW = 600
const approved: readonly RepresentParams[] = Array.from(
  { length: WINDOW },
  (_, index) => generateRepresent(index),
).filter((params) => representGates(params).length === 0)

const sample = approved[0]
if (sample === undefined) throw new Error('sin variante aprobada')

const truth = PROPOSALS.map((entry, index) => ({
  statementId: entry.id,
  labelId: fits(sample, index) ? 'entra' : 'no-entra',
}))

describe('4.º · representar al curso', () => {
  it('es la oportunidad especial del año y reemplaza, no agrega', () => {
    expect(approved.length).toBeGreaterThanOrEqual(24)
    expect(REPRESENT_SPACE).toBeGreaterThan(WINDOW)
    // «special» es un rol ordinario: ocupa uno de los dos beats del año y por
    // eso no puede sumar un beat extra ni techo de FairScore.
    expect(representClass.placement).toBe('special')
    expect(representClass.band).toBe('standard')
    expect(bandOf(representClass.cognitive)).toBe('standard')
    expect(cognitiveLoad(representClass.cognitive)).toBeLessThanOrEqual(7)
    expect(representClass.composition).toMatchObject({
      primaryReasoningFamily: 'LOGIC_CLASSIFICATION',
      interactionEngine: 'choice-compare',
      pacingClass: 'MEDIUM',
    })
    // Sin cluster: no compite con el evento escolar, lo reemplaza como beat.
    expect(representClass.composition?.eventCluster).toBeUndefined()
  })

  it('LOCKED: la acción matemática y la acción pública son evidencias distintas', () => {
    // La misma clasificación con tres posturas da tres Auras…
    const auras = STANCES.map((stance) => {
      const result = evaluateRepresent(sample, truth, stance.id)
      if (!result.ok) throw new Error('evaluación rechazada')
      return {
        stance: stance.id,
        quality: result.value.quality,
        aura: result.value.careerEffects.aura ?? 0,
      }
    })
    expect(new Set(auras.map((entry) => entry.quality)).size).toBe(1)
    expect(new Set(auras.map((entry) => entry.aura)).size).toBe(3)

    // …y la misma postura con clasificaciones distintas da el mismo Aura.
    const wrong = PROPOSALS.map((entry) => ({
      statementId: entry.id,
      labelId: 'no-entra',
    }))
    for (const stance of STANCES) {
      const good = evaluateRepresent(sample, truth, stance.id)
      const bad = evaluateRepresent(sample, wrong, stance.id)
      if (!good.ok || !bad.ok) throw new Error('evaluación rechazada')
      expect(bad.value.careerEffects.aura).toBe(good.value.careerEffects.aura)
      expect(bad.value.metrics.risk).toBe(good.value.metrics.risk)
      expect(bad.value.quality).not.toBe(good.value.quality)
    }
  })

  it('acertar la matemática nunca concede Aura por sí solo', () => {
    for (const params of approved.slice(0, 40)) {
      const exact = PROPOSALS.map((entry, index) => ({
        statementId: entry.id,
        labelId: fits(params, index) ? 'entra' : 'no-entra',
      }))
      const bad = params.stakes === 'todo-el-colegio' ? 'propia' : 'del-curso'
      const result = evaluateRepresent(params, exact, bad)
      if (!result.ok) throw new Error('evaluación rechazada')
      expect(result.value.quality).toBe('optimal')
      expect(result.value.careerEffects.aura).toBeLessThan(0)
    }
  })

  it('no otorga Prestige ni Equipo: aparecer vale cero', () => {
    expect(representClass.scoring?.team).toBe('none')
    for (const stance of STANCES) {
      const result = evaluateRepresent(sample, truth, stance.id)
      if (!result.ok) throw new Error('evaluación rechazada')
      expect(result.value.careerEffects.equipo).toBeUndefined()
      expect(result.value.careerEffects.estilo).toBeUndefined()
      expect(
        Object.keys(result.value.careerEffects).every((field) =>
          ['aura'].includes(field),
        ),
      ).toBe(true)
    }
  })

  it('llevar al consejo algo que no entra es el error, y dejar una afuera baja de nivel', () => {
    const impossible = PROPOSALS.findIndex((_, index) => !fits(sample, index))
    expect(impossible).toBeGreaterThan(-1)
    const overreach = truth.map((entry, index) =>
      index === impossible ? { ...entry, labelId: 'entra' } : entry,
    )
    expect(classificationQuality(sample, overreach)).toBe('invalid')

    const viable = PROPOSALS.findIndex((_, index) => fits(sample, index))
    const missed = truth.map((entry, index) =>
      index === viable ? { ...entry, labelId: 'no-entra' } : entry,
    )
    expect(classificationQuality(sample, missed)).toBe('efficient')
  })

  it('los tres límites deciden y el riesgo no depende de la clasificación', () => {
    for (const params of approved.slice(0, 40)) {
      const reasons = new Set(
        PROPOSALS.map((_, index) => blockedBy(params, index)).filter(
          (reason) => reason !== undefined,
        ),
      )
      expect(reasons.size).toBeGreaterThanOrEqual(2)
      for (const stance of STANCES) {
        const risks = new Set(
          representPlans(params)
            .filter((plan) => plan.stance === stance.id)
            .map((plan) => plan.risk),
        )
        expect(risks.size).toBe(1)
        expect([...risks][0]).toBe(stanceRisk(params, stance.id))
      }
      expect(new Set(STANCES.map((s) => auraPointsOf(params, s.id))).size).toBe(
        3,
      )
    }
  })

  it('rechaza una respuesta sin postura, con etiqueta inventada o con propuesta repetida', () => {
    expect(evaluateRepresent(sample, truth, undefined).ok).toBe(false)
    expect(evaluateRepresent(sample, truth, 'grito').ok).toBe(false)
    expect(
      evaluateRepresent(
        sample,
        truth.map((entry) => ({ ...entry, labelId: 'tal-vez' })),
        'consulta',
      ).ok,
    ).toBe(false)
    expect(
      evaluateRepresent(
        sample,
        [...truth, { statementId: 'torneo', labelId: 'entra' }],
        'consulta',
      ).ok,
    ).toBe(false)
  })
})
