import type { RunState } from '@/game'

/** Named, replay-derived hooks. No duplicate state and no claim that a rare occurred. */
export const grade1NarrativeHooks = {
  id: 'grade-1-narrative-hooks',
  version: '1',
  powerOutage: {
    id: 'rare.y1.power-outage',
    rarity: 'UNCOMMON',
    trigger: 'CONDITIONAL',
    participation: 'NARRATIVE_ONLY',
    appearancePrestige: 0,
    implemented: false,
  },
} as const

/** Context permits future orchestration; it is not a draw, occurrence or reward. */
export function grade1PowerOutageContext(
  state: Pick<RunState, 'flags'>,
): boolean {
  return (
    state.flags['y1.project.context-established'] === true &&
    ['optimal', 'efficient', 'functional'].includes(
      String(state.flags['y1.project.outcome']),
    )
  )
}

/** Stable callback semantics: the bus is recalled only if the run actually played it. */
export function grade7TimingCallback(flags: RunState['flags']): string {
  if (flags['g7.llegoTarde'] === true || flags['g7.calculoCorto'] === true)
    return 'El viaje de séptimo te dejó una pista: una demora también ocupa tiempo. '
  if (flags['g7.llegoJusto'] === true || flags['g7.calculoJusto'] === true)
    return 'En séptimo llegaste justo; esta agenda permite pensar también en el margen. '
  if (flags['g7.llegoComodo'] === true || flags['g7.calculoSeguro'] === true)
    return 'El margen que reservaste en séptimo vuelve a servir, ahora entre varias actividades. '
  return ''
}
