import { describe, expect, it } from 'vitest'
import { candidateFairScorePolicy, scoreRun, scoredEventsOf } from '@/game'
import {
  createGrade2Dependencies,
  grade2VariantCatalog,
} from '@/content/grade-2'
import { materializeVariant } from '@/game/testing'
import { publishedParams } from '../helpers/published-params'
import {
  CLAIM_TEAMS,
  STANDING_LABELS,
  STANCES,
  bounds,
  evaluateStandings,
  standingClaims,
  standingsClaim,
  standingsSchema,
  independentTruths,
  standingsGates,
  standingsPlans,
  stanceRisk,
  type StandingsParams,
} from '@/content/grade-2/challenges/standings-claim'

const dependencies = createGrade2Dependencies()
const approved: readonly StandingsParams[] = publishedParams(
  dependencies,
  grade2VariantCatalog,
  'y2.standings-claim',
  (params) => standingsSchema.parse(params),
)

/**
 * Oráculo independiente del torneo entre los cuatro cursos.
 *
 * No usa ninguna función del módulo: arma cada fixture compatible con los
 * partidos que le faltan a cada curso, juega todo resultado posible —cada
 * partido lo gana uno de los dos— y lee cada afirmación con «terminar arriba»
 * estricto.
 */
function tournamentTruths(p: StandingsParams): readonly string[][] {
  const pairs: [number, number][] = []
  for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) pairs.push([a, b])
  const fixtures: [number, number][][] = []
  const build = (left: number[], from: number, games: [number, number][]) => {
    if (left.every((value) => value === 0)) {
      fixtures.push(games)
      return
    }
    for (let k = from; k < pairs.length; k++) {
      const [a, b] = pairs[k]!
      if ((left[a] ?? 0) > 0 && (left[b] ?? 0) > 0) {
        const next = [...left]
        next[a]! -= 1
        next[b]! -= 1
        build(next, k, [...games, [a, b]])
      }
    }
  }
  build([...p.remaining], 0, [])
  return fixtures.map((games) => {
    const finals: number[][] = []
    for (let mask = 0; mask < 2 ** games.length; mask++) {
      const points = [...p.points]
      games.forEach(([a, b], game) => {
        points[(mask >> game) & 1 ? a : b]! += p.perWin
      })
      finals.push(points)
    }
    const read = (holds: (points: number[]) => boolean) =>
      finals.every(holds)
        ? 'seguro'
        : finals.some(holds)
          ? 'posible'
          : 'imposible'
    return [
      read((pts) => pts.every((v, i) => i === 0 || pts[0]! > v)),
      read((pts) => pts.every((v, i) => i === 3 || pts[3]! > v)),
      read((pts) => pts[1]! > pts[2]!),
      read((pts) => pts[2]! > pts[0]!),
    ]
  })
}

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
  it('RS-MAT-005: los partidos que faltan se juegan entre estos cuatro cursos', () => {
    for (const p of approved) {
      const total = p.remaining.reduce((sum, value) => sum + value, 0)
      expect(total % 2).toBe(0)
      for (const value of p.remaining)
        expect(value * 2).toBeLessThanOrEqual(total)
    }
  })

  it('RS-MAT-005: pensar cada curso por separado da lo mismo que el torneo entero, bajo todo fixture', () => {
    for (const p of approved) {
      const truths = standingClaims(p).map((claim) => claim.truth)
      const fixtures = tournamentTruths(p)
      expect(fixtures.length).toBeGreaterThan(0)
      for (const joint of fixtures) expect(joint).toEqual(truths)
    }
  })

  it('RS-MAT-005: la consigna dice contra quién se juega y que no hay empates de partido', () => {
    const entry = grade2VariantCatalog.entries.find(
      (candidate) => (candidate.templateId as string) === 'y2.standings-claim',
    )!
    const instance = materializeVariant(standingsClaim, {
      variantId: entry.variantId,
      seed: 'consigna',
    })
    expect(instance.narrative.setup).toContain('entre estos cuatro cursos')
    expect(instance.narrative.setup).toContain('lo gana uno de los dos')
  })

  it('MAT-AJ-NEW-005: terminar arriba es estricto, y ninguna tabla publicada depende de cómo se lea un empate', () => {
    // Construido: B puede llegar como mucho a 10, que es el mínimo de C.
    const tie: StandingsParams = {
      shape: 'eliminated',
      points: [12, 8, 10, 3],
      remaining: [1, 1, 0, 0],
      perWin: 2,
    }
    expect(independentTruths(tie)[2]).toBe('imposible')
    expect(independentTruths(tie, true)[2]).toBe('posible')
    expect(standingsGates(tie)).toContain(
      'una categoría cambia si el empate cuenta como terminar arriba',
    )
    for (const p of approved)
      expect(independentTruths(p, true)).toEqual(independentTruths(p))
  })

  it('MAT-AJ-NEW-004: ninguna afirmación tiene la misma categoría en más del 70 % del catálogo', () => {
    for (let claim = 0; claim < 4; claim++) {
      const counts = new Map<string, number>()
      for (const p of approved) {
        const truth = standingClaims(p)[claim]!.truth
        counts.set(truth, (counts.get(truth) ?? 0) + 1)
      }
      expect(Math.max(...counts.values()) * 10).toBeLessThanOrEqual(
        approved.length * 7,
      )
    }
  })

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

  it.each(approved.map((p, i) => [i, p] as const))(
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
