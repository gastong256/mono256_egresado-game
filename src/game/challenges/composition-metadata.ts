/** Product axes, distinct from narrative families, mathematical topics and UI modes. */
export const PRIMARY_REASONING_FAMILIES = [
  'TEMPORAL',
  'ALLOCATION',
  'DATA_UNCERTAINTY',
  'ECONOMIC_PROPORTIONAL',
  'SPATIAL',
  'LOGIC_CLASSIFICATION',
  'SYSTEMS_OPTIMIZATION',
] as const
export type PrimaryReasoningFamily = (typeof PRIMARY_REASONING_FAMILIES)[number]
export const INTERACTION_ENGINES = [
  'choice-compare',
  'allocate-constrain',
  'timeline-schedule',
  'spatial-graph',
  'grid-select-classify',
] as const
export type InteractionEngine = (typeof INTERACTION_ENGINES)[number]
export const PACING_CLASSES = ['QUICK', 'MEDIUM', 'DEEP'] as const
export type PacingClass = (typeof PACING_CLASSES)[number]

export interface CompositionMetadata {
  readonly primaryReasoningFamily: PrimaryReasoningFamily
  readonly interactionEngine: InteractionEngine
  readonly pacingClass: PacingClass
  /** Authored order within a stage; distinct from anchor/secondary importance. */
  readonly chronology?: number
  /** Same clustered event may contribute at most one ordinary beat. */
  readonly eventCluster?: string
  /** A recurring narrative arc is not an event cluster. */
  readonly recurringArc?: 'PROJECT'
}

export function compositionMetadataIssues(
  m: CompositionMetadata,
): readonly string[] {
  const issues: string[] = []
  if (!PRIMARY_REASONING_FAMILIES.includes(m.primaryReasoningFamily))
    issues.push('unknown primary reasoning family')
  if (!INTERACTION_ENGINES.includes(m.interactionEngine))
    issues.push('unknown interaction engine')
  if (!PACING_CLASSES.includes(m.pacingClass))
    issues.push('unknown pacing class')
  if (
    m.chronology !== undefined &&
    (!Number.isSafeInteger(m.chronology) ||
      m.chronology < 0 ||
      m.chronology > 10_000)
  )
    issues.push('invalid chronology')
  if (
    m.eventCluster !== undefined &&
    !/^[a-z0-9][a-z0-9.-]{0,63}$/u.test(m.eventCluster)
  )
    issues.push('invalid event cluster')
  if (m.recurringArc !== undefined && m.recurringArc !== 'PROJECT')
    issues.push('unknown recurring arc')
  return issues
}
