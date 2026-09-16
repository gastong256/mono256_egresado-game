/**
 * Prestige.
 *
 * Segundo criterio competitivo, nunca el primero: `FairScore` sigue siendo
 * `0–10.000` y Prestige es `0–100` aparte. No se suman.
 *
 * Toda la fuerza de este módulo está en lo que **no** deja hacer. Una
 * oportunidad de Prestige declara de qué evidencia sale y por qué esa evidencia
 * no la pagó ya Math, Equipo o Aura; dos oportunidades no pueden cobrar la
 * misma evidencia; y aparecer en un evento raro no otorga nada por sí solo.
 *
 * El techo **ofrecido** es la suma de lo que la edición autoró, y se reporta
 * explícito. Si una edición no ofrece oportunidades de un track, no se inventan
 * puntos ni se normaliza para llegar a 100: el techo es el que es, y es el
 * mismo para todos.
 */
import type { RunState } from '../runs/state'

export const PRESTIGE_TRACKS = ['career-arc', 'special', 'rare'] as const
export type PrestigeTrack = (typeof PRESTIGE_TRACKS)[number]

/** Techo estructural del modelo. No es una promesa de que se pueda alcanzar. */
export const PRESTIGE_MAX = 100

export interface PrestigePolicy {
  readonly id: string
  readonly version: string
  /** False hasta que un Teacher Gate apruebe la calibración. */
  readonly official: boolean
  readonly caps: Readonly<Record<PrestigeTrack, number>>
}

/**
 * Una oportunidad de Prestige autorada.
 *
 * `evidence` es la identidad de lo que la habilita: dos oportunidades con la
 * misma evidencia no pueden pagar las dos. `independence` es la razón escrita
 * de por qué esa evidencia no la cobró ya otra dimensión; existe para que
 * revisarla sea leerla, no reconstruirla.
 */
export interface PrestigeOpportunity {
  readonly id: string
  readonly track: PrestigeTrack
  readonly points: number
  readonly evidence: string
  readonly independence: string
  readonly earned: (state: RunState) => boolean
}

export interface PrestigeAward {
  readonly id: string
  readonly track: PrestigeTrack
  readonly points: number
}

export interface PrestigeBreakdown {
  readonly policyId: string
  readonly policyVersion: string
  readonly total: number
  readonly byTrack: Readonly<Record<PrestigeTrack, number>>
  /** Lo que la edición **ofrece**, autorado; no lo que el modelo admite. */
  readonly offered: Readonly<Record<PrestigeTrack, number>>
  readonly awards: readonly PrestigeAward[]
}

/** La política v1: los tres tracks del diseño de producto. */
export const candidatePrestigePolicy: PrestigePolicy = {
  id: 'prestige-dev-1',
  version: '1.0.0-candidate',
  official: false,
  caps: { 'career-arc': 40, special: 40, rare: 20 },
}

export function prestigePolicyIssues(
  policy: PrestigePolicy,
): readonly string[] {
  const issues: string[] = []
  if (policy.id.trim() === '' || policy.version.trim() === '')
    issues.push('prestige policy needs identity and version')
  const caps = PRESTIGE_TRACKS.map((track) => policy.caps[track])
  if (caps.some((cap) => !Number.isSafeInteger(cap) || cap < 0))
    issues.push('invalid prestige cap')
  if (caps.reduce((total, cap) => total + cap, 0) !== PRESTIGE_MAX)
    issues.push('the track caps have to add up to the structural maximum')
  return issues
}

/**
 * Lo que una lista de oportunidades tiene de malo, si tiene algo.
 *
 * Se comprueba donde las oportunidades entran al motor y no donde se autoran:
 * una evidencia repetida o un track pasado de techo son defectos de contenido
 * que tienen que fallar fuerte, no redondearse.
 */
export function prestigeOpportunityIssues(
  opportunities: readonly PrestigeOpportunity[],
  policy: PrestigePolicy,
): readonly string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  const evidence = new Set<string>()
  for (const opportunity of opportunities) {
    if (ids.has(opportunity.id))
      issues.push(`duplicate prestige opportunity: ${opportunity.id}`)
    ids.add(opportunity.id)
    if (evidence.has(opportunity.evidence))
      issues.push(
        `two opportunities claim the same evidence: ${opportunity.evidence}`,
      )
    evidence.add(opportunity.evidence)
    if (opportunity.independence.trim() === '')
      issues.push(
        `${opportunity.id} does not say why its evidence is independent`,
      )
    if (!Number.isSafeInteger(opportunity.points) || opportunity.points <= 0)
      issues.push(`invalid points for ${opportunity.id}`)
  }
  for (const track of PRESTIGE_TRACKS) {
    const offered = opportunities
      .filter((opportunity) => opportunity.track === track)
      .reduce((total, opportunity) => total + opportunity.points, 0)
    if (offered > policy.caps[track])
      issues.push(`track ${track} offers more than its cap`)
  }
  return issues
}

/**
 * El Prestige de una carrera terminada.
 *
 * Puro y determinista: mismas oportunidades, misma política y mismo estado dan
 * el mismo desglose, que es lo que permite que un servidor lo recompute en vez
 * de creerle al cliente. Nunca toca FairScore ni el egreso.
 */
export function scorePrestige(
  state: RunState,
  opportunities: readonly PrestigeOpportunity[],
  policy: PrestigePolicy = candidatePrestigePolicy,
): PrestigeBreakdown {
  const byTrack: Record<PrestigeTrack, number> = {
    'career-arc': 0,
    special: 0,
    rare: 0,
  }
  const offered: Record<PrestigeTrack, number> = {
    'career-arc': 0,
    special: 0,
    rare: 0,
  }
  const awards: PrestigeAward[] = []
  const paid = new Set<string>()

  // Orden canónico por id: dos oportunidades que compartieran evidencia no
  // podrían depender de en qué orden las autoraron.
  for (const opportunity of [...opportunities].sort((left, right) =>
    left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
  )) {
    offered[opportunity.track] += opportunity.points
    if (paid.has(opportunity.evidence)) continue
    if (!opportunity.earned(state)) continue
    const room = policy.caps[opportunity.track] - byTrack[opportunity.track]
    if (room <= 0) continue
    const points = Math.min(opportunity.points, room)
    byTrack[opportunity.track] += points
    paid.add(opportunity.evidence)
    awards.push({
      id: opportunity.id,
      track: opportunity.track,
      points,
    })
  }

  return {
    policyId: policy.id,
    policyVersion: policy.version,
    total: PRESTIGE_TRACKS.reduce((total, track) => total + byTrack[track], 0),
    byTrack,
    offered: {
      'career-arc': Math.min(offered['career-arc'], policy.caps['career-arc']),
      special: Math.min(offered.special, policy.caps.special),
      rare: Math.min(offered.rare, policy.caps.rare),
    },
    awards,
  }
}
