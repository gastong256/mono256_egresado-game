/**
 * The transition function.
 *
 * `transition(state, command, dependencies)` is the only place run state
 * changes. It is pure: given the same state, command and dependencies it always
 * returns the same next state and the same events, and it performs no I/O, reads
 * no clock and draws no ambient randomness.
 *
 * Invalid commands are refused with a typed rejection rather than being ignored,
 * so a client cannot answer twice, answer a stale challenge, skip feedback or
 * resurrect a finished run.
 */

import { assertNever } from '../core/exhaustive'
import { EngineInvariantError } from '../core/invariant'
import { err, ok, type Result } from '../core/result'
import type { EngineRejection } from '../core/errors'
import {
  toChallengeInstanceId,
  type ChallengeId,
  type ChallengeInstanceId,
  type StoryletId,
  type VariantId,
} from '../core/branded'
import type { ApprovedVariantLookup } from '../challenges/variant-source'
import {
  composeRun,
  composedStage,
  plannedEventCount,
  type ComposedRunPlan,
  type ComposedStagePlan,
} from '../plan/composer'
import type { CompositionPolicy } from '../plan/composition-policy'
import type { CompetitiveScorePolicy } from '../scoring/competitive-policy'
import { describeCompositionFailure } from '../plan/composition-failure'
import { planFingerprint } from '../plan/plan-fingerprint'
import {
  selectVariantId,
  variantRefOf,
  type ChallengeInstanceRef,
  type MaterializedChallenge,
  type PublicChallengeView,
} from '../challenges/contracts'
import {
  createVariantRng,
  type ChallengeVariantRef,
} from '../challenges/content-model'
import type { ContentCatalog } from '../challenges/content-catalog'
import type { DifficultyLevel, SolutionQuality } from '../challenges/taxonomy'
import { initialDifficultyState } from '../difficulty/policy'
import {
  emptyProgression,
  obligationFor,
  owesRecovery,
  pendingForStage,
  previasOf,
  selectedObligation,
  withGraduation,
  withObligation,
  withRecovery,
  type RecoveryPolicy,
} from '../progression/recovery'
import {
  recoveryContentIssues,
  recoveryFrameFor,
  recoveryNotes,
  reviewTemplateFor,
  reviewsFor,
  type RecoveryContent,
} from './recovery-content'
import { applyEffects } from '../narrative/effects'
import type { NarrativeContext } from '../narrative/conditions'
import type { PrestigeOpportunity, PrestigePolicy } from '../scoring/prestige'
import {
  selectRareEvent,
  type RareEventDefinition,
} from '../narrative/rare-events'
import {
  emptySelectionState,
  recordSelection,
  selectStorylet,
} from '../narrative/selection'
import type { Storylet } from '../narrative/storylet'
import { emptyDimensions, type ProfileDimensions } from '../profiles/policy'
import type { StageConfig } from '../progression/stages'
import {
  applyCareerEffects,
  initialCareer,
  masteryGainsFor,
  type CareerChange,
} from '../progression/career'
import { createRng } from '../random/rng'
import {
  firstStage,
  nextStageConfig,
  stageConfig,
  type Ruleset,
} from '../ruleset/ruleset'
import type { GameCommand } from './commands'
import type { DomainEvent, TransitionResult } from './events'
import type {
  ActiveEvent,
  ResolvedEvent,
  RunDescriptor,
  RunState,
} from './state'

export interface EngineDependencies {
  readonly ruleset: Ruleset
  readonly catalog: ContentCatalog
  readonly storylets: readonly Storylet[]
  /**
   * The approved variants a run may draw from.
   *
   * When a content set supplies one, selection happens inside the validated
   * population and nowhere else: a candidate that failed validation can never
   * reach a player. When it is absent — the development fixtures, a content set
   * with no catalog yet — selection falls back to the template's curated list.
   */
  readonly approvedVariants?: ApprovedVariantLookup
  /**
   * How this content set composes a normal run.
   *
   * Present means runs are **composed**: `createRun` picks the year's beats
   * once, up front, and the runtime executes them. Absent keeps the older
   * behaviour, where a storylet draws from its pool as the year goes — which is
   * what the broad teacher demo is, and what a content set without a
   * composition policy still gets.
   */
  readonly composition?: CompositionPolicy
  /**
   * Los eventos raros que este content set puede contar.
   *
   * Ausente significa que la run no sortea rareza, que es lo que hacen los
   * fixtures de desarrollo. La calibración —probabilidades y presupuesto— vive
   * en el ruleset, no acá: esto es contenido.
   */
  readonly rareEvents?: readonly RareEventDefinition[]
  /**
   * Las oportunidades de Prestige que esta edición ofrece, con su política.
   *
   * Ausente significa que la edición no ofrece Prestige, que es distinto de
   * ofrecerlo y que dé cero: lo primero se reporta como «no hay», lo segundo
   * como un resultado.
   */
  readonly prestige?: {
    readonly policy: PrestigePolicy
    readonly opportunities: readonly PrestigeOpportunity[]
  }
  /**
   * How this run's performance becomes a competitive score.
   *
   * Scoring never touches gameplay: no outcome, career effect, branch or plan
   * depends on it. It is here so that a run declaring a `scoreVersion` can be
   * checked against the policy it claims, and so a replay can produce the same
   * score the run was played under.
   */
  readonly competitiveScore?: CompetitiveScorePolicy
  /**
   * The storylet that frames a remediation beat, and the content it may play.
   *
   * A remediation beat is not selected by the narrative layer — the year owes
   * it, so it is scheduled rather than drawn — but it still needs words around
   * it. The content set supplies both the frame and which of its templates may
   * serve as remediation, because deciding that is authoring, not engine work.
   */
  readonly recoveryContent?: RecoveryContent
}

/** Declared by a content set; see `recovery-content.ts`. */
export type { RecoveryContent } from './recovery-content'

/**
 * Substream address of the challenge generated at a given event.
 *
 * Where the run placed the beat plus which template it is. The variant is
 * addressed separately, by content identity alone, so the two concerns cannot
 * disturb each other.
 */
function challengeRngPath(
  ref: ChallengeInstanceRef,
): readonly (string | number)[] {
  return [
    'stage',
    ref.stageId,
    'event',
    ref.eventIndex,
    'challenge',
    ref.templateId,
    'difficulty',
    ref.difficulty,
  ]
}

/**
 * Recomputes the model behind a challenge reference.
 *
 * Generation is deterministic in the reference, so this can be called any number
 * of times — during play, on resume, or on the server during replay — and always
 * produces the same challenge.
 */
export function materializeChallenge(
  descriptor: RunDescriptor,
  ref: ChallengeInstanceRef,
  dependencies: EngineDependencies,
): Result<MaterializedChallenge, EngineRejection> {
  const template = dependencies.catalog.template(ref.templateId)

  if (template === undefined) {
    return err({ kind: 'unknown-challenge', challengeId: ref.templateId })
  }

  if (template.family !== ref.familyId) {
    return err({ kind: 'unknown-challenge', challengeId: ref.templateId })
  }

  if (!template.variantSource.accepts(ref.variantId)) {
    return err({ kind: 'unknown-challenge', challengeId: ref.templateId })
  }

  if (
    dependencies.approvedVariants !== undefined &&
    !dependencies.approvedVariants
      .variantsFor(template.id)
      .includes(ref.variantId)
  ) {
    return err({
      kind: 'invalid-content',
      issues: [`unapproved variant ${template.id}/${ref.variantId}`],
    })
  }

  return ok(
    template.materialize(ref, {
      rng: createRng(descriptor.seed, challengeRngPath(ref)),
      difficulty: ref.difficulty,
      variantId: ref.variantId,
      variantRng: createVariantRng(variantRefOf(ref)),
    }),
  )
}

/** Public view of whatever the run is currently showing. */
export function activeChallengeView(
  state: RunState,
  dependencies: EngineDependencies,
): Result<PublicChallengeView | undefined, EngineRejection> {
  const active = state.activeEvent

  if (active?.challenge === undefined) {
    return ok(undefined)
  }

  const materialized = materializeChallenge(
    state.descriptor,
    active.challenge,
    dependencies,
  )
  if (!materialized.ok) {
    return materialized
  }

  // A remediation beat says what it practises and what it only explains. The
  // split is derived from what the year still owes, so a resumed or replayed
  // run shows exactly the same notes without persisting a second history.
  const config = dependencies.recoveryContent
  let review: PublicChallengeView['review']
  if (active.recovery === true && config !== undefined) {
    const notes = recoveryNotes(
      config,
      pendingForStage(state.progression, state.stage),
      active.challenge.templateId,
    )
    if (!notes.ok) {
      return err({
        kind: 'invalid-content',
        issues: notes.error.map(
          (id) => `obligation ${id} would close without practice or debrief`,
        ),
      })
    }
    review = notes.value
  }
  return ok({
    ref: active.challenge,
    narrative: materialized.value.narrativeFor(state.flags),
    interaction: materialized.value.present(active.revealed),
    tools: materialized.value.tools,
    ...(review === undefined ? {} : { review }),
    // Lo que el evento raro agregó viaja con la vista, no con los parámetros:
    // el evaluador no sabe que existió.
    ...(active.rareNote === undefined ? {} : { rareNote: active.rareNote }),
  })
}

function narrativeContext(state: RunState): NarrativeContext {
  return {
    stage: state.stage,
    eventIndex: state.eventIndex,
    career: state.career,
    flags: state.flags,
    seenStorylets: state.seenStorylets,
    qualityHistory: state.qualityHistory,
  }
}

/**
 * One event per dimension that actually moved.
 *
 * Derived from the change report the career module produced rather than from a
 * diff of two states, so a grade that happens to equal the running average is
 * still reported as an academic event.
 */
function careerChangeEvents(change: CareerChange): readonly DomainEvent[] {
  const events: DomainEvent[] = []

  if (change.promedio !== undefined) {
    events.push({
      type: 'career.changed',
      dimension: 'promedio',
      from: change.promedio.from,
      to: change.promedio.to,
    })
  }
  if (change.equipo !== undefined) {
    events.push({
      type: 'career.changed',
      dimension: 'equipo',
      from: change.equipo.from,
      to: change.equipo.to,
    })
  }
  if (change.aura !== undefined) {
    events.push({
      type: 'aura.changed',
      delta: change.aura.delta,
      total: change.aura.total,
    })
  }
  if (change.estilo !== undefined) {
    events.push({ type: 'estilo.nudged', axis: change.estilo.axis })
  }

  return events
}

function requireStage(ruleset: Ruleset, state: RunState): StageConfig {
  const config = stageConfig(ruleset, state.stage)
  if (config === undefined) {
    throw new EngineInvariantError(
      `run is in stage ${state.stage}, which the ruleset does not define`,
    )
  }
  return config
}

/** Looks a template up, refusing to continue if the catalog lost it. */
function requireTemplate(
  dependencies: EngineDependencies,
  templateId: ChallengeId,
): { readonly variants: readonly VariantId[] } {
  const template = dependencies.catalog.template(templateId)
  if (template === undefined) {
    throw new EngineInvariantError(
      `challenge template ${templateId} vanished between filtering and selection`,
    )
  }
  return template
}

/**
 * Ordinary beats this stage has already played.
 *
 * Counted from the history rather than tracked in a field, because the history
 * is the record a replay rebuilds and a second counter could disagree with it.
 */
function beatsPlayedInStage(state: RunState): number {
  return state.history.filter(
    (entry) => entry.stage === state.stage && entry.challengeId !== undefined,
  ).length
}

/** The planned beat this event should present, if the run is composed and owes one. */
function plannedBeat(
  state: RunState,
): ComposedStagePlan['beats'][number] | undefined {
  if (state.plan === undefined) {
    return undefined
  }
  const stagePlan = composedStage(state.plan, state.stage)
  return stagePlan?.beats[beatsPlayedInStage(state)]
}

/**
 * How many events this stage plays.
 *
 * A composed stage runs for exactly as long as the content it was given: its
 * beats plus its narrative cards. Falling back to the ruleset's fixed count
 * would let a composed year keep asking for events after the plan ran out.
 */
function stageEventCount(state: RunState, stage: StageConfig): number {
  return plannedEventCount(state.plan, stage)
}

/**
 * The storylets that may open this event.
 *
 * Unfiltered for an uncomposed run. For a composed one the plan decides what
 * gets played, so a storylet that carries challenges is only eligible when it
 * can host the beat that is due — and once the year's beats are spent, only
 * narrative storylets remain. That is what keeps the composer authoritative
 * over content while the narrative layer stays authoritative over framing: the
 * story says where a beat happens, the plan says which beat it is.
 */
function hostingStorylets(
  state: RunState,
  dependencies: EngineDependencies,
): readonly Storylet[] {
  if (state.plan === undefined) {
    return dependencies.storylets
  }

  const beat = plannedBeat(state)
  const stagePlan = composedStage(state.plan, state.stage)
  const remainingBeats =
    (stagePlan?.beats.length ?? 0) - beatsPlayedInStage(state)
  const remainingEvents = (stagePlan?.eventCount ?? 0) - state.stageEventIndex

  return dependencies.storylets.filter((storylet) => {
    if (storylet.challengePool.length === 0) {
      // A narrative card only fits while the year has an event to spare. If
      // every remaining event is owed to a planned beat, framing has to wait —
      // otherwise a chatty content set could talk a year out of its decisions.
      return remainingEvents > remainingBeats
    }
    return (
      beat !== undefined &&
      storylet.challengePool.includes(beat.variant.templateId)
    )
  })
}

/** Records what an ordinary result owes the year, if anything. */
function applyObligation(
  state: RunState,
  dependencies: EngineDependencies,
  policy: RecoveryPolicy,
  source: ChallengeVariantRef,
  quality: SolutionQuality,
): RunState['progression'] {
  const config = dependencies.recoveryContent
  // A year may only owe what it can close. If the content set declares no
  // review for this template — the honest answer when the mistake has no
  // isolable step — the bad result stands and the year closes normally, which
  // is a consequence rather than a debt.
  if (
    config === undefined ||
    reviewsFor(config, source.templateId).length === 0
  ) {
    return state.progression
  }

  const obligation = obligationFor(
    policy,
    state.stage,
    state.eventIndex,
    source,
    quality,
  )
  return obligation === undefined
    ? state.progression
    : withObligation(state.progression, obligation)
}

/**
 * Which content a year plays to close what it owes.
 *
 * Derived from the obligation's own semantic identity on a fixed substream, not
 * drawn at runtime: the same run, the same mistake and the same policy must
 * reach the same remediation on a replay months later, and on a server that
 * never saw the first play.
 *
 * It prefers a variant the player has not already seen. Handing back the exact
 * question they just got wrong is not remediation, it is a retry.
 */
function recoveryContentFor(
  state: RunState,
  dependencies: EngineDependencies,
): Result<ChallengeVariantRef, EngineRejection> {
  const config = dependencies.recoveryContent
  const obligation = selectedObligation(state.progression, state.stage)

  if (config === undefined || obligation === undefined) {
    return err({
      kind: 'invalid-content',
      issues: [
        `stage ${state.stage} owes remediation and the content set offers none`,
      ],
    })
  }

  // What reviews *this* mistake, not what reviews this year. A player who got
  // the mural wrong is owed the mural's review or nothing at all; handing them
  // some other situation's review would be a non sequitur wearing remediation's
  // clothes.
  const template = reviewTemplateFor(
    config,
    dependencies.catalog,
    obligation.source.templateId,
    state.stage,
  )
  if (template === undefined) {
    return err({
      kind: 'invalid-content',
      issues: [
        `no recovery template reviews ${obligation.source.templateId} in ${state.stage}`,
      ],
    })
  }

  // Approved content only, exactly as ordinary beats. Remediation is played by
  // the same person under the same rules; it does not get a looser catalog.
  const pool =
    dependencies.approvedVariants === undefined
      ? template.variants
      : dependencies.approvedVariants.variantsFor(template.id)
  if (pool.length === 0)
    return err({
      kind: 'invalid-content',
      issues: [`no approved recovery variants for ${template.id}`],
    })
  const played = new Set(
    state.history.flatMap((entry) =>
      entry.challengeId === template.id && entry.instanceId !== undefined
        ? [entry.instanceId as string]
        : [],
    ),
  )
  const fresh = pool.filter(
    (variantId) => !played.has(`${state.stage}:recovery:${variantId}`),
  )
  const candidates = fresh.length > 0 ? fresh : pool

  const variantId = selectVariantId(
    createRng(state.descriptor.seed, [
      'recovery',
      state.stage,
      'obligation',
      obligation.id,
    ]),
    candidates,
  )

  return ok({
    familyId: template.family,
    templateId: template.id,
    variantId,
  })
}

/**
 * Opens the remediation beat a year owes.
 *
 * Not a storylet selection: the year owes this, so it is scheduled. The
 * narrative layer still supplies the words, because a beat that arrives without
 * a reason reads as a bug rather than as a consequence.
 */
function beginRecovery(
  state: RunState,
  dependencies: EngineDependencies,
): TransitionResult {
  const config = dependencies.recoveryContent
  const storylet =
    config === undefined
      ? undefined
      : dependencies.storylets.find(
          (candidate) => candidate.id === recoveryFrameFor(config, state.stage),
        )
  const content = recoveryContentFor(state, dependencies)

  if (config === undefined || storylet === undefined || !content.ok) {
    // A year that owes something and cannot close it would be a dead end, which
    // is the one outcome this whole design exists to make impossible. The run
    // ends loudly instead of silently graduating with a debt.
    const events: readonly DomainEvent[] = [
      { type: 'narrative.exhausted', stage: state.stage },
    ]
    return completeRun(state, dependencies, events)
  }

  const template = dependencies.catalog.template(content.value.templateId)
  if (template === undefined) {
    throw new EngineInvariantError(
      `recovery template ${content.value.templateId} vanished between selection and use`,
    )
  }

  const instanceId: ChallengeInstanceId = toChallengeInstanceId(
    `${state.stage}:recovery:${content.value.variantId}`,
  )
  const ref: ChallengeInstanceRef = {
    instanceId,
    familyId: content.value.familyId,
    templateId: content.value.templateId,
    variantId: content.value.variantId,
    stageId: state.stage,
    eventIndex: state.eventIndex,
    difficulty: state.difficulty.current,
  }

  const events: DomainEvent[] = [
    {
      type: 'storylet.selected',
      storyletId: storylet.id,
      stage: state.stage,
      eventIndex: state.eventIndex,
    },
    {
      type: 'challenge.generated',
      challengeId: ref.templateId,
      instanceId,
      difficulty: ref.difficulty,
    },
    { type: 'challenge.presented', instanceId },
  ]

  return {
    state: {
      ...state,
      // The frame counts as played, exactly like any other storylet: the run
      // invariants require every storylet in the history to appear as seen, and
      // a beat that skipped that bookkeeping would restore as a corrupt run.
      seenStorylets: state.seenStorylets.includes(storylet.id)
        ? state.seenStorylets
        : [...state.seenStorylets, storylet.id],
      selection: recordSelection(
        state.selection,
        storylet.id,
        state.eventIndex,
      ),
      phase: 'challenge',
      activeEvent: {
        storyletId: storylet.id,
        eyebrow: storylet.eyebrow,
        title: storylet.title,
        text: storylet.text,
        challenge: ref,
        revealed: [],
        toolsUsed: [],
        careerChange: {},
        recovery: true,
      },
    },
    events,
    effects: events.map((event) => ({ type: 'track' as const, event })),
  }
}

/**
 * Opens the next event.
 *
 * Selects a storylet, applies its effects, and — when the storylet carries a
 * challenge pool — presents the challenge. In a composed run the challenge is
 * the one the plan pinned; otherwise it is drawn from the storylet's pool.
 */
function beginEvent(
  state: RunState,
  dependencies: EngineDependencies,
): TransitionResult {
  const stage = requireStage(dependencies.ruleset, state)
  const events: DomainEvent[] = []

  const selectionRng = createRng(state.descriptor.seed, [
    'stage',
    state.stage,
    'event',
    state.eventIndex,
    'storylet',
  ])

  const outcome = selectStorylet(
    hostingStorylets(state, dependencies),
    narrativeContext(state),
    state.selection,
    dependencies.ruleset.narrative,
    selectionRng,
  )

  if (outcome.kind === 'empty-pool') {
    /*
     * A composed stage that owes no more beats is simply finished.
     *
     * Its plan said how many decisions the year contains; the narrative cards
     * around them are framing, and a year does not have to end on one. Ending
     * the whole run here — which is what an uncomposed run does, because for it
     * an empty pool really is content failing — would quietly shorten a career
     * every time a year ran out of optional storylets.
     *
     * A stage that still owes a beat is the other case entirely: the plan named
     * content the narrative cannot host, and that is a content defect. It ends
     * the run and says so, exactly as before.
     */
    if (state.plan !== undefined && plannedBeat(state) === undefined) {
      return advance(
        { ...state, stageEventIndex: stageEventCount(state, stage) - 1 },
        dependencies,
        events,
      )
    }

    // Content cannot serve this stage. The run ends cleanly rather than
    // looping, and the fact is reported so validation and simulation can see it.
    events.push({ type: 'narrative.exhausted', stage: state.stage })
    return completeRun({ ...state }, dependencies, events)
  }

  const storylet = outcome.storylet
  events.push({
    type: 'storylet.selected',
    storyletId: storylet.id,
    stage: state.stage,
    eventIndex: state.eventIndex,
  })

  const applied = applyEffects(
    { career: state.career, flags: state.flags },
    storylet.effects,
  )
  events.push(...careerChangeEvents(applied.change))
  for (const effect of storylet.effects) {
    if (effect.kind === 'flag-set') {
      events.push({ type: 'flag.set', flag: effect.flag, value: effect.value })
    }
    if (effect.kind === 'flag-clear') {
      events.push({ type: 'flag.cleared', flag: effect.flag })
    }
  }

  const seenStorylets: readonly StoryletId[] = state.seenStorylets.includes(
    storylet.id,
  )
    ? state.seenStorylets
    : [...state.seenStorylets, storylet.id]

  const baseEvent: ActiveEvent = {
    storyletId: storylet.id,
    eyebrow: storylet.eyebrow,
    title: storylet.title,
    text: storylet.text,
    challenge: undefined,
    revealed: [],
    toolsUsed: [],
    careerChange: applied.change,
  }

  const common = {
    ...state,
    career: applied.slice.career,
    flags: applied.slice.flags,
    selection: recordSelection(state.selection, storylet.id, state.eventIndex),
    seenStorylets,
  }

  if (storylet.challengePool.length === 0) {
    return {
      state: { ...common, phase: 'narrative', activeEvent: baseEvent },
      events,
      effects: events.map((event) => ({ type: 'track', event })),
    }
  }

  const planned = plannedBeat(state)

  let templateId: ChallengeId
  let variantId: VariantId

  if (planned !== undefined) {
    // Composed run: the content was decided before the run started and the
    // runtime's job is to execute it. Rolling here — even for a value the
    // composer would have produced anyway — would mean two places decide what a
    // run contains, and only one of them is the thing a server can verify.
    templateId = planned.variant.templateId
    variantId = planned.variant.variantId
  } else {
    // Pick from the pool on its own substream so adding a challenge to a pool
    // does not disturb storylet selection.
    const pickRng = createRng(state.descriptor.seed, [
      'stage',
      state.stage,
      'event',
      state.eventIndex,
      'challenge-pick',
    ])
    const eligible = storylet.challengePool.filter(
      (id) => dependencies.catalog.template(id) !== undefined,
    )

    if (eligible.length === 0) {
      throw new EngineInvariantError(
        `storylet ${storylet.id} references no registered challenge; content validation should have rejected it`,
      )
    }

    templateId = pickRng.pick(eligible)

    // The variant is chosen on its own substream, addressed by the template
    // rather than by the slot. Which case the player sees is a content decision,
    // and it must not shift because a storylet pool grew a neighbour.
    //
    // The pool it draws from is the approved catalog when the content set has
    // one. That is the whole point of validating a population: the run seed
    // decides *which* approved problem a player gets, never what that problem
    // contains, and never reaches an address that failed validation.
    const pool =
      dependencies.approvedVariants === undefined
        ? requireTemplate(dependencies, templateId).variants
        : dependencies.approvedVariants.variantsFor(templateId)
    if (pool.length === 0)
      throw new EngineInvariantError(
        `no approved variants for ${templateId}; content configuration changed during run`,
      )

    variantId = selectVariantId(
      createRng(state.descriptor.seed, [
        'stage',
        state.stage,
        'event',
        state.eventIndex,
        'variant-pick',
        templateId,
      ]),
      pool,
    )
  }

  const template = dependencies.catalog.template(templateId)
  if (template === undefined) {
    throw new EngineInvariantError(
      `challenge template ${templateId} is not registered in the content catalog`,
    )
  }

  /*
   * Rareza: elegibilidad primero, sorteo después, presupuesto al final.
   *
   * Pasa acá y no antes porque la elegibilidad mira cómo se viene jugando. Lo
   * que un evento raro puede hacer está acotado por construcción: contar algo
   * distinto, o cambiar **qué variante aprobada** de la misma Template se
   * juega. El beat, la plantilla, su ruta de Repaso y su techo competitivo se
   * quedan donde estaban.
   */
  const rarePolicy = dependencies.ruleset.rare
  const occurrence =
    dependencies.rareEvents === undefined || rarePolicy === undefined
      ? undefined
      : selectRareEvent({
          seed: state.descriptor.seed,
          stage: state.stage,
          eventIndex: state.eventIndex,
          templateId,
          events: dependencies.rareEvents,
          policy: rarePolicy,
          occurred: state.rare,
          // El contexto es el de **este** beat: los efectos del storylet que lo
          // abre ya se aplicaron, así que una condición sobre una bandera que
          // la escena acaba de poner se lee como corresponde.
          context: narrativeContext(common as RunState),
        })
  const rareDefinition =
    occurrence === undefined
      ? undefined
      : dependencies.rareEvents?.find((entry) => entry.id === occurrence.id)
  if (occurrence?.treatment === 'variant-modifier') {
    const pool = (
      dependencies.approvedVariants === undefined
        ? template.variants
        : dependencies.approvedVariants.variantsFor(templateId)
    ).filter((candidate) => candidate !== variantId)
    if (pool.length > 0)
      variantId = selectVariantId(
        createRng(state.descriptor.seed, [
          'rare-events',
          state.stage,
          state.eventIndex,
          occurrence.id,
          'variant',
        ]),
        pool,
      )
  }

  const difficulty: DifficultyLevel =
    state.descriptor.difficulty === 'fixed'
      ? stage.targetDifficulty
      : state.difficulty.current

  const instanceId: ChallengeInstanceId = toChallengeInstanceId(
    `${state.stage}:${String(state.eventIndex)}:${templateId}`,
  )
  const ref: ChallengeInstanceRef = {
    instanceId,
    familyId: template.family,
    templateId,
    variantId,
    stageId: state.stage,
    eventIndex: state.eventIndex,
    difficulty,
  }

  events.push({
    type: 'challenge.generated',
    challengeId: templateId,
    instanceId,
    difficulty,
  })
  events.push({ type: 'challenge.presented', instanceId })

  return {
    state: {
      ...common,
      phase: 'challenge',
      ...(occurrence === undefined
        ? {}
        : { rare: [...state.rare, occurrence] }),
      activeEvent: {
        ...baseEvent,
        challenge: ref,
        ...(rareDefinition === undefined
          ? {}
          : {
              rareNote: {
                id: rareDefinition.id,
                title: rareDefinition.note.title,
                text: rareDefinition.note.text,
              },
            }),
      },
    },
    events,
    effects: events.map((event) => ({ type: 'track', event })),
  }
}

/** Aggregates the hidden reasoning dimensions used by the profile policy. */
function computeDimensions(state: RunState): ProfileDimensions {
  const resolved = state.history.filter(
    (entry) => entry.metrics !== undefined && entry.quality !== undefined,
  )

  if (resolved.length === 0) {
    return emptyDimensions()
  }

  const average = (pick: (entry: ResolvedEvent) => number): number =>
    resolved.reduce((total, entry) => total + pick(entry), 0) / resolved.length

  const efficiency = average((entry) => entry.metrics?.efficiency ?? 0)
  const precision = average((entry) => entry.metrics?.precision ?? 0)
  const risk = average((entry) => entry.metrics?.risk ?? 0)
  const informationUse = average((entry) => entry.metrics?.informationUse ?? 0)

  // Stability measures how consistent quality was: the mean absolute deviation
  // of precision, inverted so steady play scores high.
  const deviation = average((entry) =>
    Math.abs((entry.metrics?.precision ?? 0) - precision),
  )

  return {
    efficiency,
    precision,
    risk,
    informationUse,
    // Two hidden dimensions read the career instead of the answer log.
    // `collaboration` is Equipo normalised; a run that never met a collaborative
    // event has no evidence either way, so it sits at the neutral midpoint
    // rather than at zero — `null` is not a low score.
    collaboration: (state.career.equipo ?? 50) / 100,
    // `initiative` is how much of Estilo is *not* by-the-book: both planning
    // ahead and improvising are ways of acting on your own account, and the
    // difference between them is already carried by `risk` and `efficiency`.
    initiative:
      (state.career.estilo.estratega + state.career.estilo.improvisador) / 100,
    stability: Math.max(0, 1 - deviation * 2),
  }
}

function completeRun(
  state: RunState,
  dependencies: EngineDependencies,
  priorEvents: readonly DomainEvent[],
): TransitionResult {
  const profile = dependencies.ruleset.profile.classify(
    computeDimensions(state),
    state.career,
  )

  /*
   * Graduation, decided by progression and not by «everything happened».
   *
   * A run graduates when it played its final year out owing nothing. Every
   * valid completed run does — that is the product rule Teacher Gate 1
   * accepted, and the transition is what makes it true rather than hoped for.
   * A run that ended early because content could not serve it does not
   * graduate, and saying so is how that defect stays visible.
   */
  const progression = withGraduation(state.progression)

  const completed: RunState = {
    ...state,
    progression,
    phase: 'completed',
    status: 'completed',
    activeEvent: undefined,
    pendingFeedback: undefined,
    completion: {
      graduated: progression.graduated,
      previas: previasOf(progression),
      recoveries: progression.history.length,
      totalScore: state.scorePreview,
      profile,
      career: state.career,
      eventsPlayed: state.history.length,
    },
  }

  const events: DomainEvent[] = [
    ...priorEvents,
    { type: 'stage.completed', stage: state.stage },
    {
      type: 'run.completed',
      totalScore: completed.scorePreview,
      profile: profile.profileId,
    },
  ]

  return {
    state: completed,
    events,
    effects: [
      ...events.map((event) => ({ type: 'track' as const, event })),
      { type: 'persist-snapshot', reason: 'run-completed' },
    ],
  }
}

/**
 * Moves past a resolved event.
 *
 * Advances within the stage, rolls over to the next stage when the stage's
 * event budget is spent, and completes the run after the final stage.
 */
function advance(
  state: RunState,
  dependencies: EngineDependencies,
  priorEvents: readonly DomainEvent[],
): TransitionResult {
  const stage = requireStage(dependencies.ruleset, state)
  const events = [...priorEvents]

  const nextStageEventIndex = state.stageEventIndex + 1

  if (nextStageEventIndex < stageEventCount(state, stage)) {
    const opened = beginEvent(
      {
        ...state,
        eventIndex: state.eventIndex + 1,
        stageEventIndex: nextStageEventIndex,
        activeEvent: undefined,
        pendingFeedback: undefined,
      },
      dependencies,
    )
    return {
      state: opened.state,
      events: [...events, ...opened.events],
      effects: [
        ...events.map((event) => ({ type: 'track' as const, event })),
        ...opened.effects,
      ],
    }
  }

  /*
   * A year cannot end owing something.
   *
   * The remediation beat is scheduled here, after the ordinary beats and before
   * the year closes, and it lives outside the one-to-two ordinary budget: it is
   * conditional content, so counting it against the budget would let a mistake
   * cost the player one of the decisions the year was composed to give them.
   */
  const recoveryPolicy = dependencies.ruleset.recovery
  if (
    recoveryPolicy !== undefined &&
    owesRecovery(state.progression, state.stage)
  ) {
    const opened = beginRecovery(
      {
        ...state,
        eventIndex: state.eventIndex + 1,
        stageEventIndex: nextStageEventIndex,
        activeEvent: undefined,
        pendingFeedback: undefined,
      },
      dependencies,
    )
    return {
      state: opened.state,
      events: [...events, ...opened.events],
      effects: [
        ...events.map((event) => ({ type: 'track' as const, event })),
        ...opened.effects,
      ],
    }
  }

  events.push({ type: 'stage.completed', stage: state.stage })
  const following = nextStageConfig(dependencies.ruleset, state.stage)

  if (following === undefined) {
    return completeRun(state, dependencies, events)
  }

  const difficulty = dependencies.ruleset.difficulty.initialFor(
    following,
    state.difficulty,
  )

  events.push({ type: 'stage.started', stage: following.id })

  const opened = beginEvent(
    {
      ...state,
      stage: following.id,
      eventIndex: state.eventIndex + 1,
      stageEventIndex: 0,
      difficulty: { current: difficulty, recent: [] },
      activeEvent: undefined,
      pendingFeedback: undefined,
    },
    dependencies,
  )

  return {
    state: opened.state,
    events: [...events, ...opened.events],
    effects: [
      ...events.map((event) => ({ type: 'track' as const, event })),
      ...opened.effects,
    ],
  }
}

/** Creates a run and opens its first event. */
export function createRun(
  descriptor: RunDescriptor,
  dependencies: EngineDependencies,
): Result<TransitionResult, EngineRejection> {
  const stage = firstStage(dependencies.ruleset)

  if (stage === undefined) {
    return err({
      kind: 'invalid-ruleset',
      detail: 'the ruleset defines no stages',
    })
  }

  if (descriptor.rulesetVersion !== dependencies.ruleset.version) {
    return err({
      kind: 'unsupported-version',
      field: 'rulesetVersion',
      expected: dependencies.ruleset.version,
      received: descriptor.rulesetVersion,
    })
  }
  if (descriptor.contentVersion !== dependencies.ruleset.contentVersion) {
    return err({
      kind: 'unsupported-version',
      field: 'contentVersion',
      expected: dependencies.ruleset.contentVersion,
      received: descriptor.contentVersion,
    })
  }
  // A run that names an approved catalog has to be replayed against that
  // catalog: a different approved set would select different variants from the
  // same seed, which is exactly the silent drift the version exists to stop.
  const catalogVersion = dependencies.approvedVariants?.catalogVersion
  if ((descriptor.variantCatalogVersion ?? null) !== (catalogVersion ?? null)) {
    return err({
      kind: 'unsupported-version',
      field: 'variantCatalogVersion',
      expected: catalogVersion ?? '(no approved catalog)',
      received: descriptor.variantCatalogVersion ?? '(no approved catalog)',
    })
  }

  // A run that names a score policy has to be scored by that policy. Replaying
  // it under another one would answer a different question with the same
  // identity, which is the drift every version field here exists to stop.
  const scoreVersion = dependencies.competitiveScore?.version
  if ((descriptor.scoreVersion ?? null) !== (scoreVersion ?? null)) {
    return err({
      kind: 'unsupported-version',
      field: 'scoreVersion',
      expected: scoreVersion ?? '(no competitive policy)',
      received: descriptor.scoreVersion ?? '(no competitive policy)',
    })
  }

  // Fail before a run starts, including the broad, uncomposed authoring demo.
  // A configured approved catalog is never permission to fall back to curated data.
  if (dependencies.approvedVariants !== undefined) {
    const ordinary = new Set(
      dependencies.storylets
        .filter((storylet) =>
          storylet.stages.some((id) =>
            dependencies.ruleset.stages.some((entry) => entry.id === id),
          ),
        )
        .flatMap((storylet) => storylet.challengePool),
    )
    const missing = [...ordinary].filter(
      (id) => dependencies.approvedVariants?.variantsFor(id).length === 0,
    )
    if (missing.length > 0)
      return err({
        kind: 'invalid-content',
        issues: missing.map((id) => `no approved ordinary variants for ${id}`),
      })
  }

  // The same rule for what a year may owe: every declared route closes with
  // approved review content, framed, and with a note for what it does not
  // practise. Checked here so a gap fails before the first beat, not mid-year.
  if (
    dependencies.ruleset.recovery !== undefined &&
    dependencies.recoveryContent !== undefined
  ) {
    const issues = recoveryContentIssues({
      recoveryContent: dependencies.recoveryContent,
      catalog: dependencies.catalog,
      storylets: dependencies.storylets,
      stages: dependencies.ruleset.stages.map((config) => config.id),
      ...(dependencies.approvedVariants === undefined
        ? {}
        : { approvedVariants: dependencies.approvedVariants }),
    })
    if (issues.length > 0) {
      return err({ kind: 'invalid-content', issues })
    }
  }

  /*
   * Compose the run, once, before anything is played.
   *
   * This is the whole point of the stage: the content of a run is decided here
   * and nowhere else. If the content set declares no composition policy the run
   * stays uncomposed and resolves content as it goes — which is what the broad
   * teacher demo is, and what every content set was before composition existed.
   */
  let plan: ComposedRunPlan | undefined
  if (dependencies.composition !== undefined) {
    const composed = composeRun({
      seed: descriptor.seed,
      stages: dependencies.ruleset.stages.map((config) => config.id),
      catalog: dependencies.catalog,
      ...(dependencies.approvedVariants === undefined
        ? {}
        : { approvedVariants: dependencies.approvedVariants }),
      policy: dependencies.composition,
    })

    if (!composed.ok) {
      return err({
        kind: 'invalid-content',
        issues: [describeCompositionFailure(composed.error)],
      })
    }
    plan = composed.value

    // A descriptor that names a plan is making a claim about which game this
    // run is. Recomposing and comparing is what turns a moved calibration into
    // a refusal instead of a different year played under the same identity.
    const fingerprint = planFingerprint(plan)
    if (
      descriptor.planFingerprint !== undefined &&
      descriptor.planFingerprint !== fingerprint
    ) {
      return err({
        kind: 'unsupported-version',
        field: 'planFingerprint',
        expected: fingerprint,
        received: descriptor.planFingerprint,
      })
    }
  } else if (descriptor.planFingerprint !== undefined) {
    return err({
      kind: 'unsupported-version',
      field: 'planFingerprint',
      expected: '(no composition policy)',
      received: descriptor.planFingerprint,
    })
  }

  const seeded: RunState = {
    ...(plan === undefined ? {} : { plan }),
    rare: [],
    progression: emptyProgression(),
    descriptor,
    phase: 'narrative',
    status: 'active',
    stage: stage.id,
    eventIndex: 0,
    stageEventIndex: 0,
    career: initialCareer(),
    flags: {},
    difficulty: initialDifficultyState(
      dependencies.ruleset.difficulty.initialFor(stage, undefined),
    ),
    selection: emptySelectionState(),
    seenStorylets: [],
    qualityHistory: [],
    activeEvent: undefined,
    pendingFeedback: undefined,
    history: [],
    scorePreview: 0,
    optimalStreak: 0,
    completion: undefined,
  }

  const opened = beginEvent(seeded, dependencies)
  const events: DomainEvent[] = [
    { type: 'run.started', runId: descriptor.runId },
    { type: 'stage.started', stage: stage.id },
    ...opened.events,
  ]

  return ok({
    state: opened.state,
    events,
    effects: events.map((event) => ({ type: 'track', event })),
  })
}

function rejectTransition(
  state: RunState,
  command: GameCommand,
): Result<TransitionResult, EngineRejection> {
  return err({
    kind: 'invalid-transition',
    phase: state.phase,
    command: command.type,
  })
}

function handleAnswer(
  state: RunState,
  command: Extract<GameCommand, { type: 'ANSWER' }>,
  dependencies: EngineDependencies,
): Result<TransitionResult, EngineRejection> {
  const active = state.activeEvent

  if (state.phase !== 'challenge' || active?.challenge === undefined) {
    return rejectTransition(state, command)
  }

  if (active.challenge.instanceId !== command.instanceId) {
    return err({
      kind: 'stale-challenge-answer',
      expected: active.challenge.instanceId,
      received: command.instanceId,
    })
  }

  const materialized = materializeChallenge(
    state.descriptor,
    active.challenge,
    dependencies,
  )
  if (!materialized.ok) {
    return materialized
  }

  const evaluation = materialized.value.evaluate(
    command.answer,
    active.revealed,
  )
  if (!evaluation.ok) {
    return evaluation
  }

  const result = evaluation.value
  const score = dependencies.ruleset.scoring.scoreEvent({
    quality: result.quality,
    difficulty: active.challenge.difficulty,
    metrics: result.metrics,
    optimalStreak: state.optimalStreak,
  })

  // Mastery is the engine's job, not content's: it comes from the challenge's
  // declared categories and the quality reached, so every family contributes on
  // the same scale. It is hidden and never rendered.
  const definition = dependencies.catalog.template(active.challenge.templateId)
  const applied = applyCareerEffects(state.career, {
    ...result.careerEffects,
    mastery: [
      ...(result.careerEffects.mastery ?? []),
      ...masteryGainsFor(result.quality, definition?.categories ?? []),
    ],
  })
  const flags = result.flagEffects.reduce(
    (current, effect) => ({ ...current, [effect.flag]: effect.value }),
    state.flags,
  )

  const events: DomainEvent[] = [
    { type: 'challenge.answered', instanceId: command.instanceId },
    {
      type: 'challenge.evaluated',
      instanceId: command.instanceId,
      quality: result.quality,
    },
    {
      type: 'feedback.created',
      instanceId: command.instanceId,
      outcomeKey: result.feedback.outcomeKey,
    },
    {
      type: 'score.awarded',
      instanceId: command.instanceId,
      points: score.totalPoints,
    },
    ...careerChangeEvents(applied.change),
    ...result.flagEffects.map((effect) => ({
      type: 'flag.set' as const,
      flag: effect.flag,
      value: effect.value,
    })),
  ]

  const qualityHistory = [...state.qualityHistory, result.quality]
  const difficultyBefore = state.difficulty.current
  const stage = requireStage(dependencies.ruleset, state)
  const difficulty =
    state.descriptor.difficulty === 'adaptive'
      ? dependencies.ruleset.difficulty.next(
          {
            current: state.difficulty.current,
            recent: [...state.difficulty.recent, result.quality],
          },
          stage,
        )
      : state.difficulty

  if (difficulty.current !== difficultyBefore) {
    events.push({
      type: 'difficulty.changed',
      from: difficultyBefore,
      to: difficulty.current,
    })
  }

  const resolved: ResolvedEvent = {
    sequence: state.history.length,
    stage: state.stage,
    eventIndex: state.eventIndex,
    storyletId: active.storyletId,
    challengeId: active.challenge.templateId,
    instanceId: active.challenge.instanceId,
    difficulty: active.challenge.difficulty,
    quality: result.quality,
    metrics: result.metrics,
    points: score.totalPoints,
    revealedCount: active.revealed.length,
    ...(active.recovery === true ? { recovery: true } : {}),
  }

  /*
   * What this result committed the year to.
   *
   * Only an ordinary beat can leave something to close. A remediation beat
   * closes what the year owed — however it went — and cannot owe anything
   * itself, which is why remediation cannot recurse: the recursion has nowhere
   * to be written down.
   */
  const recoveryPolicy = dependencies.ruleset.recovery
  const progression =
    recoveryPolicy === undefined
      ? state.progression
      : active.recovery === true
        ? withRecovery(
            state.progression,
            state.stage,
            variantRefOf(active.challenge),
            result.quality,
            recoveryPolicy,
          )
        : applyObligation(
            state,
            dependencies,
            recoveryPolicy,
            variantRefOf(active.challenge),
            result.quality,
          )

  if (progression !== state.progression && active.recovery === true) {
    events.push({ type: 'recovery.resolved', stage: state.stage })
  } else if (progression !== state.progression) {
    events.push({ type: 'recovery.required', stage: state.stage })
  }

  return ok({
    state: {
      ...state,
      progression,
      phase: 'feedback',
      career: applied.career,
      flags,
      qualityHistory,
      difficulty,
      history: [...state.history, resolved],
      scorePreview: state.scorePreview + score.totalPoints,
      optimalStreak: result.quality === 'optimal' ? state.optimalStreak + 1 : 0,
      pendingFeedback: {
        instanceId: command.instanceId,
        quality: result.quality,
        feedback: result.feedback,
        score,
        careerChange: applied.change,
      },
    },
    events,
    effects: [
      ...events.map((event) => ({ type: 'track' as const, event })),
      { type: 'persist-snapshot', reason: 'event-resolved' },
    ],
  })
}

/**
 * Applies one command.
 *
 * Pure in `state`, `command` and `dependencies`: no clock, no ambient RNG, no
 * I/O. Every rejection is a value, so a caller can distinguish "not allowed" from
 * "something is broken".
 */
export function transition(
  state: RunState,
  command: GameCommand,
  dependencies: EngineDependencies,
): Result<TransitionResult, EngineRejection> {
  if (state.status !== 'active') {
    return err({ kind: 'run-already-completed' })
  }

  switch (command.type) {
    case 'ANSWER':
      return handleAnswer(state, command, dependencies)

    case 'REQUEST_INFO': {
      const active = state.activeEvent
      if (state.phase !== 'challenge' || active?.challenge === undefined) {
        return rejectTransition(state, command)
      }
      if (active.challenge.instanceId !== command.instanceId) {
        return err({
          kind: 'stale-challenge-answer',
          expected: active.challenge.instanceId,
          received: command.instanceId,
        })
      }

      const materialized = materializeChallenge(
        state.descriptor,
        active.challenge,
        dependencies,
      )
      if (!materialized.ok) {
        return materialized
      }
      if (
        !materialized.value.requestable.some(
          (entry) => entry.key === command.key,
        )
      ) {
        return err({ kind: 'unknown-information-key', key: command.key })
      }
      if (active.revealed.includes(command.key)) {
        // Revealing twice is a no-op rather than an error: the datum is already
        // on screen and the client may simply have retried.
        return ok({ state, events: [], effects: [] })
      }

      const events: readonly DomainEvent[] = [
        {
          type: 'information.requested',
          instanceId: command.instanceId,
          key: command.key,
        },
      ]

      return ok({
        state: {
          ...state,
          activeEvent: {
            ...active,
            revealed: [...active.revealed, command.key],
          },
        },
        events,
        effects: events.map((event) => ({ type: 'track', event })),
      })
    }

    case 'USE_TOOL': {
      const active = state.activeEvent
      if (state.phase !== 'challenge' || active?.challenge === undefined) {
        return rejectTransition(state, command)
      }
      if (active.challenge.instanceId !== command.instanceId) {
        return err({
          kind: 'stale-challenge-answer',
          expected: active.challenge.instanceId,
          received: command.instanceId,
        })
      }

      const materialized = materializeChallenge(
        state.descriptor,
        active.challenge,
        dependencies,
      )
      if (!materialized.ok) {
        return materialized
      }
      if (!materialized.value.tools.includes(command.tool)) {
        return err({ kind: 'tool-not-available', tool: command.tool })
      }

      const events: readonly DomainEvent[] = [
        {
          type: 'tool.used',
          instanceId: command.instanceId,
          tool: command.tool,
        },
      ]
      const toolsUsed = active.toolsUsed.includes(command.tool)
        ? active.toolsUsed
        : [...active.toolsUsed, command.tool]

      return ok({
        state: { ...state, activeEvent: { ...active, toolsUsed } },
        events,
        effects: events.map((event) => ({ type: 'track', event })),
      })
    }

    case 'CONTINUE': {
      if (
        (state.phase === 'feedback' || state.phase === 'narrative') &&
        dependencies.ruleset.recovery !== undefined &&
        state.stageEventIndex + 1 >=
          stageEventCount(state, requireStage(dependencies.ruleset, state)) &&
        owesRecovery(state.progression, state.stage)
      ) {
        // Refuse at the edge of the beat, before the year moves: approved
        // content, a frame and a note for every obligation it closes. A gap
        // here is a content defect, and the run stays where it was instead of
        // closing a year with a concept nobody practised or explained.
        const content = recoveryContentFor(state, dependencies)
        if (!content.ok) return content
        const config = dependencies.recoveryContent
        if (config === undefined) {
          return err({
            kind: 'invalid-content',
            issues: [`${state.stage} owes a review and declares no content`],
          })
        }
        const frame = recoveryFrameFor(config, state.stage)
        if (
          !dependencies.storylets.some(
            (storylet) =>
              storylet.id === frame && storylet.stages.includes(state.stage),
          )
        ) {
          return err({
            kind: 'invalid-content',
            issues: [`missing recovery frame for ${state.stage}`],
          })
        }
        const notes = recoveryNotes(
          config,
          pendingForStage(state.progression, state.stage),
          content.value.templateId,
        )
        if (!notes.ok) {
          return err({
            kind: 'invalid-content',
            issues: notes.error.map(
              (id) =>
                `obligation ${id} would close without practice or debrief`,
            ),
          })
        }
      }
      if (state.phase === 'feedback') {
        return ok(advance(state, dependencies, []))
      }

      if (state.phase === 'narrative') {
        const active = state.activeEvent
        if (active === undefined) {
          return rejectTransition(state, command)
        }
        const resolved: ResolvedEvent = {
          sequence: state.history.length,
          stage: state.stage,
          eventIndex: state.eventIndex,
          storyletId: active.storyletId,
          challengeId: undefined,
          instanceId: undefined,
          difficulty: state.difficulty.current,
          quality: undefined,
          metrics: undefined,
          points: 0,
          revealedCount: 0,
        }
        return ok(
          advance(
            { ...state, history: [...state.history, resolved] },
            dependencies,
            [],
          ),
        )
      }

      return rejectTransition(state, command)
    }

    case 'ABANDON': {
      const events: readonly DomainEvent[] = [{ type: 'run.abandoned' }]
      return ok({
        state: {
          ...state,
          phase: 'completed',
          status: 'abandoned',
          activeEvent: undefined,
          pendingFeedback: undefined,
        },
        events,
        effects: [
          ...events.map((event) => ({ type: 'track' as const, event })),
          { type: 'persist-snapshot', reason: 'run-completed' },
        ],
      })
    }

    default:
      return assertNever(command)
  }
}
