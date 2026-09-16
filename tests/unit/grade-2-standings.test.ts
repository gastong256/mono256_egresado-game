import { describe, expect, it } from 'vitest'
import { candidateFairScorePolicy, scoreRun, scoredEventsOf } from '@/game'
import {
  CLAIM_TEAMS,
  STANDINGS_SPACE,
  STANDING_LABELS,
  STANCES,
  bounds,
  evaluateStandings,
  generateStandings,
  standingClaims,
  standingsClaim,
  standingsGates,
  standingsPlans,
  stanceRisk,
  type StandingsParams,
} from '@/content/grade-2/challenges/standings-claim'

const approved: readonly StandingsParams[] = Array.from(
  { length: STANDINGS_SPACE },
  (_, index) => generateStandings(index),
).filter((params) => standingsGates(params).length === 0)

const perfect = (p: StandingsParams) =>
  standingClaims(p).map((claim) => ({
    statementId: claim.id,
    labelId: claim.truth,
  }))
const muddled = (p: StandingsParams) =>
  standingClaims(p).map((claim) => ({
    statementId: claim.id,
    labelId: claim.truth === 'posible' ? 'imposible' : 'posible',
  }))

describe('2.º · la tabla del Intercurso', () => {
  it('aprueba un catálogo suficiente en las tres formas y pertenece al cluster', () => {
    expect(approved.length).toBeGreaterThanOrEqual(12)
    expect(new Set(approved.map((p) => p.shape))).toEqual(
      new Set(['settled', 'open', 'eliminated']),
    )
    expect(standingsClaim.composition?.eventCluster).toBe('intercurso')
    expect(standingsClaim.composition?.primaryReasoningFamily).toBe(
      'LOGIC_CLASSIFICATION',
    )
    expect(standingsClaim.placement).toBe('checkpoint')
  })

  it.each(approved.slice(0, 12).map((p, i) => [i, p] as const))(
    '%s: el oráculo independiente coincide con el evaluador en clasificación y postura',
    (_, p) => {
      for (const plan of standingsPlans(p)) {
        const result = evaluateStandings(p, plan.entries, plan.stance)
        expect(result.ok && result.value.quality).toBe(plan.quality)
        expect(result.ok && result.value.metrics.risk).toBe(plan.risk)
      }
    },
  )

  it('LOCKED · la postura no cambia la calidad matemática y la clasificación no concede Aura', () => {
    for (const p of approved) {
      const entries = perfect(p)
      const qualities = STANCES.map((stance) => {
        const result = evaluateStandings(p, entries, stance.id)
        if (!result.ok) throw new Error('rechazo inesperado')
        return result.value.quality
      })
      // Misma matemática con tres posturas distintas: una sola calidad.
      expect(new Set(qualities).size).toBe(1)

      // Misma postura con matemática distinta: la Aura no se mueve.
      for (const stance of STANCES) {
        const good = evaluateStandings(p, entries, stance.id)
        const bad = evaluateStandings(p, muddled(p), stance.id)
        if (!good.ok || !bad.ok) throw new Error('rechazo inesperado')
        expect(good.value.careerEffects.aura).toBe(bad.value.careerEffects.aura)
        expect(good.value.metrics.risk).toBe(bad.value.metrics.risk)
      }
    }
  })

  it('cantar el campeonato sin tenerlo expone al curso; publicar la tabla nunca', () => {
    for (const p of approved) {
      const champion = standingClaims(p).some((c) => c.truth === 'seguro')
      expect(stanceRisk(p, 'campeones')).toBe(champion ? 0 : 1)
      // Publicar la tabla es la postura justa cuando no hay campeón —y ahí no
      // expone nada—; con el campeonato asegurado, decirlo a medias sí deja
      // algo sobre la mesa.
      expect(stanceRisk(p, 'tabla')).toBe(champion ? 0.2 : 0)
      const result = evaluateStandings(p, perfect(p), 'campeones')
      if (!result.ok) throw new Error('rechazo inesperado')
      expect(result.value.careerEffects.aura).toBe(champion ? 300 : -300)
    }
  })

  it('afirmar como asegurado algo que no lo está es el error grave', () => {
    for (const p of approved) {
      const claims = standingClaims(p)
      const notSure = claims.find((claim) => claim.truth !== 'seguro')
      if (notSure === undefined) continue
      const entries = claims.map((claim) => ({
        statementId: claim.id,
        labelId: claim.id === notSure.id ? 'seguro' : claim.truth,
      }))
      const result = evaluateStandings(p, entries, 'tabla')
      expect(result.ok && result.value.quality).toBe('invalid')
      expect(evaluateStandings(p, perfect(p), 'tabla').ok).toBe(true)
    }
  })

  it('los límites enteros deciden: mínimo asegurado contra máximo alcanzable', () => {
    for (const p of approved) {
      const limits = bounds(p)
      limits.forEach((limit, index) => {
        expect(limit.min).toBe(p.points[index] ?? 0)
        expect(limit.max).toBe(
          (p.points[index] ?? 0) + (p.remaining[index] ?? 0) * p.perWin,
        )
      })
      for (const claim of standingClaims(p))
        expect(STANDING_LABELS.map((l) => l.id)).toContain(claim.truth)
    }
    expect(CLAIM_TEAMS).toHaveLength(4)
  })

  it('el Repaso no aplica y la clasificación sin postura no es respuesta', () => {
    const p = approved[0]!
    expect(evaluateStandings(p, perfect(p), undefined).ok).toBe(false)
    expect(evaluateStandings(p, perfect(p), 'inventada').ok).toBe(false)
    expect(evaluateStandings(p, [], 'tabla').ok).toBe(false)
    expect(standingsClaim.scoring.team).toBe('none')
    expect(standingsClaim.scoring.aura).not.toBe('none')
  })

  it('Aura entra a FairScore por su propio canal, sin tocar el de Math', () => {
    const p = approved[0]!
    const honest = evaluateStandings(p, perfect(p), 'tabla')
    const reckless = evaluateStandings(p, perfect(p), 'campeones')
    if (!honest.ok || !reckless.ok) throw new Error('rechazo inesperado')
    // Misma calidad matemática, distinta evidencia pública.
    expect(honest.value.quality).toBe(reckless.value.quality)
    const champion = standingClaims(p).some((c) => c.truth === 'seguro')
    if (!champion)
      expect(honest.value.metrics.risk).toBeLessThan(
        reckless.value.metrics.risk,
      )
    expect(typeof scoreRun).toBe('function')
    expect(typeof scoredEventsOf).toBe('function')
    expect(candidateFairScorePolicy.id).toBeDefined()
  })
})
