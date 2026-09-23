/**
 * 1.º · Antes del ensayo (`y1.rehearsal-schedule`) y su Repaso
 * (`y1.schedule-review`).
 *
 * La agenda es constructiva y más rica que el colectivo de 7.º: varias
 * actividades con duración, preparación en el lugar, ventanas, un traslado
 * entre la escuela y el salón, una actividad flexible y el ensayo como límite
 * fijo. El jugador elige el inicio de cada bloque; el evaluador trabaja en
 * minutos enteros y nunca ve una coordenada de pantalla.
 *
 * El Repaso aísla el paso que la agenda da por sabido: una cadena de dos
 * actividades y un traslado contra un límite fijo, que se lee mejor desde el
 * límite hacia atrás. Más corto, CORE, sin puntaje y sin Estilo.
 */
import { z } from 'zod'
import {
  authoredVariantIds,
  defineChallenge,
  err,
  ok,
  toChallengeId,
  toScenarioFamilyId,
  type EstiloAxis,
  type InteractionAnswer,
  type SchedulePlacement,
  type SolutionQuality,
} from '@/game'
import {
  at,
  candidateAxes,
  digit,
  generatedSource,
  grade1StylePolicy,
  outcome,
  parameters,
  spaceOf,
  styleGateIssues,
  tierWitnessIssues,
  type StyledPlan,
} from '../authoring'
import { grade7TimingCallback } from '../career-facts'
import { graded } from '../../grades'

const PLACE_LABEL = { school: 'Escuela', hall: 'Salón del club' } as const
type Place = keyof typeof PLACE_LABEL
const ACTIVITY_LABEL = {
  materials: 'Retirar materiales',
  banner: 'Pintar el cartel',
  sound: 'Probar el sonido',
  snack: 'Merienda con el grupo',
  pack: 'Guardar los materiales',
  warmup: 'Preparar el espacio',
} as const
type ActivityId = keyof typeof ACTIVITY_LABEL

const minute = z.number().int().min(0).max(1439).multipleOf(5)
const activityId = z.enum([
  'materials',
  'banner',
  'sound',
  'snack',
  'pack',
  'warmup',
])
const activitySchema = z.strictObject({
  id: activityId,
  duration: z.number().int().min(5).max(40).multipleOf(5),
  setup: z.number().int().min(0).max(15).multipleOf(5),
  place: z.enum(['school', 'hall']),
  earliest: minute,
  latestEnd: minute,
  optional: z.boolean(),
  /** A real dependency: this block needs that one finished before it starts. */
  after: activityId.optional(),
})
export const scheduleSchema = z
  .strictObject({
    kind: z.enum(['rehearsal', 'review']),
    shape: z.enum([
      'cluster',
      'early-hall',
      'setup-chain',
      'late-opening',
      'backward',
    ]),
    /** Free from this minute, at the school. */
    start: minute,
    /** The fixed limit: the rehearsal starts at the hall. */
    deadline: minute,
    travel: z.number().int().min(5).max(20).multipleOf(5),
    /** Margin the quality ladder asks for before the limit. */
    margin: z.number().int().min(5).max(20).multipleOf(5),
    activities: z.array(activitySchema).min(2).max(4),
  })
  .refine(
    (p) =>
      new Set(p.activities.map((activity) => activity.id)).size ===
      p.activities.length,
    'actividad repetida',
  )
  .refine(
    (p) =>
      p.activities.every(
        (activity) =>
          activity.earliest >= p.start &&
          activity.latestEnd <= p.deadline &&
          activity.earliest + activity.duration <= activity.latestEnd,
      ),
    'ventana fuera de la tarde',
  )
  .refine(
    (p) =>
      p.kind === 'review'
        ? p.activities.every((activity) => !activity.optional)
        : p.activities.filter((activity) => activity.optional).length === 1,
    'la agenda lleva exactamente una actividad flexible; el repaso, ninguna',
  )
  .refine(
    (p) =>
      p.activities.every(
        (activity) =>
          activity.after === undefined ||
          (activity.after !== activity.id &&
            p.activities.some(
              (prior) => prior.id === activity.after && !prior.optional,
            )),
      ),
    'una dependencia apunta a una actividad inexistente o flexible',
  )
export type ScheduleParams = z.infer<typeof scheduleSchema>
type Activity = ScheduleParams['activities'][number]

export function clockText(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

/** Starts the player may pick: every five minutes inside the window. */
export function startOptions(activity: Activity): readonly number[] {
  const last = activity.latestEnd - activity.duration
  return Array.from(
    { length: Math.max(0, Math.floor((last - activity.earliest) / 5) + 1) },
    (_, i) => activity.earliest + i * 5,
  )
}

const STARTS = [840, 870, 900] as const
const TRAVELS = [
  [10, 15],
  [5, 10],
] as const
const DURATIONS = [
  { materials: 10, banner: 15, sound: 10, snack: 10 },
  { materials: 15, banner: 20, sound: 15, snack: 10 },
] as const
const MARGINS = [5, 10, 15] as const
const REHEARSAL_SHAPES = [
  'cluster',
  'early-hall',
  'setup-chain',
  'late-opening',
] as const
const RADICES = [REHEARSAL_SHAPES.length, STARTS.length, 2, 2, 3, 2]
export const SCHEDULE_SPACE = spaceOf(RADICES)

interface Draft {
  readonly id: ActivityId
  readonly duration: number
  readonly setup: number
  readonly place: Place
  readonly earliest: number
  /** Latest end relative to the deadline, or absolute when set. */
  readonly latestEnd?: number
  readonly optional: boolean
  readonly after?: ActivityId
}

/** Arrival at the hall when a draft plan runs as early as its windows allow. */
function asap(start: number, travel: number, order: readonly Draft[]): number {
  let cursor = start
  let place: Place = 'school'
  for (const activity of order) {
    const ready =
      cursor + (activity.place === place ? 0 : travel) + activity.setup
    const begin = Math.max(ready, activity.earliest)
    cursor = begin + activity.duration
    place = activity.place
  }
  return cursor + (place === 'hall' ? 0 : travel)
}

/**
 * One rehearsal afternoon per candidate address.
 *
 * Each shape authors the places and windows that make its reasoning matter,
 * plus the order of a witness plan. The deadline is placed after that witness
 * with the requested margin and a little slack, so an optimal plan exists by
 * construction; the gates then prove the rest of the ladder exhaustively.
 */
export function generateSchedule(index: number): ScheduleParams {
  const axes = candidateAxes(index, RADICES, 77)
  const shape = at(REHEARSAL_SHAPES, digit(axes, 0))
  const start = at(STARTS, digit(axes, 1))
  // Longer trips where grouping by place is the point; shorter where the
  // windows and preparations are.
  const travel = at(at(TRAVELS, digit(axes, 0) % 2), digit(axes, 2))
  const durations = at(DURATIONS, digit(axes, 3))
  const margin = at(MARGINS, digit(axes, 4))
  const slack = 5 * digit(axes, 5)
  const d = (id: keyof typeof durations) => durations[id]

  let drafts: readonly Draft[]
  let witness: readonly ActivityId[]
  switch (shape) {
    case 'cluster':
      drafts = [
        {
          id: 'materials',
          duration: d('materials'),
          setup: 0,
          place: 'school',
          earliest: start,
          optional: false,
        },
        {
          id: 'sound',
          duration: d('sound'),
          setup: 5,
          place: 'hall',
          earliest: start + 20,
          optional: false,
        },
        {
          id: 'banner',
          duration: d('banner'),
          setup: 5,
          place: 'school',
          earliest: start,
          optional: false,
          after: 'materials',
        },
        {
          id: 'snack',
          duration: d('snack'),
          setup: 0,
          place: 'hall',
          earliest: start + 20,
          optional: true,
        },
      ]
      witness = ['materials', 'banner', 'sound', 'snack']
      break
    case 'early-hall':
      drafts = [
        {
          id: 'sound',
          duration: d('sound'),
          setup: 5,
          place: 'hall',
          earliest: start + travel,
          latestEnd: start + travel + 5 + d('sound') + 15,
          optional: false,
        },
        {
          id: 'materials',
          duration: d('materials'),
          setup: 0,
          place: 'school',
          earliest: start,
          optional: false,
        },
        {
          id: 'banner',
          duration: d('banner'),
          setup: 5,
          place: 'school',
          earliest: start,
          optional: false,
          after: 'materials',
        },
        {
          id: 'snack',
          duration: d('snack'),
          setup: 0,
          place: 'school',
          earliest: start,
          optional: true,
        },
      ]
      witness = ['sound', 'materials', 'banner', 'snack']
      break
    case 'setup-chain':
      drafts = [
        {
          id: 'materials',
          duration: d('materials'),
          setup: 0,
          place: 'school',
          earliest: start,
          optional: false,
        },
        {
          id: 'banner',
          duration: d('banner'),
          setup: 10,
          place: 'school',
          earliest: start,
          optional: false,
          after: 'materials',
        },
        {
          id: 'sound',
          duration: d('sound'),
          setup: 10,
          place: 'hall',
          earliest: start + 30,
          optional: false,
        },
        {
          id: 'snack',
          duration: d('snack'),
          setup: 0,
          place: 'school',
          earliest: start,
          optional: true,
        },
      ]
      witness = ['materials', 'banner', 'snack', 'sound']
      break
    case 'late-opening':
      drafts = [
        {
          id: 'sound',
          duration: d('sound'),
          setup: 5,
          place: 'hall',
          earliest: start + 60,
          optional: false,
        },
        {
          id: 'materials',
          duration: d('materials'),
          setup: 0,
          place: 'school',
          earliest: start,
          latestEnd: start + 45,
          optional: false,
        },
        {
          id: 'banner',
          duration: d('banner'),
          setup: 5,
          place: 'school',
          earliest: start,
          latestEnd: start + 60,
          optional: false,
          after: 'materials',
        },
        {
          id: 'snack',
          duration: d('snack'),
          setup: 0,
          place: 'school',
          earliest: start,
          optional: true,
        },
      ]
      witness = ['materials', 'banner', 'snack', 'sound']
      break
  }
  const order = witness.map(
    (id) => drafts.find((draft) => draft.id === id) ?? drafts[0]!,
  )
  const deadline = asap(start, travel, order) + margin + slack
  return scheduleSchema.parse({
    kind: 'rehearsal',
    shape,
    start,
    deadline,
    travel,
    margin,
    activities: drafts.map((draft) => ({
      id: draft.id,
      duration: draft.duration,
      setup: draft.setup,
      place: draft.place,
      earliest: draft.earliest,
      latestEnd: Math.min(draft.latestEnd ?? deadline, deadline),
      optional: draft.optional,
      ...(draft.after === undefined ? {} : { after: draft.after }),
    })),
  })
}

const REVIEW_PACK = [10, 15, 20] as const
const REVIEW_WARMUP = [10, 15] as const
const REVIEW_TRAVEL = [5, 10, 15] as const
const REVIEW_MARGIN = [10, 15] as const
const REVIEW_SLACK = [0, 5, 10] as const
const REVIEW_START = [900, 920] as const
const REVIEW_RADICES = [3, 2, 3, 2, 3, 2]
export const SCHEDULE_REVIEW_SPACE = spaceOf(REVIEW_RADICES)

/**
 * Two blocks, one trip, one fixed limit.
 *
 * The class ends at `start`; the space has to be ready at `deadline`. Windows
 * stay wide on purpose: late starts that no longer fit are offered, so the
 * last possible start has to be found from the limit backwards.
 */
export function generateScheduleReview(index: number): ScheduleParams {
  const axes = candidateAxes(index, REVIEW_RADICES, 115)
  const pack = at(REVIEW_PACK, digit(axes, 0))
  const warmup = at(REVIEW_WARMUP, digit(axes, 1))
  const travel = at(REVIEW_TRAVEL, digit(axes, 2))
  const margin = at(REVIEW_MARGIN, digit(axes, 3))
  const slack = at(REVIEW_SLACK, digit(axes, 4))
  const start = at(REVIEW_START, digit(axes, 5))
  const deadline = start + pack + travel + warmup + margin + slack
  return scheduleSchema.parse({
    kind: 'review',
    shape: 'backward',
    start,
    deadline,
    travel,
    margin,
    activities: [
      {
        id: 'pack',
        duration: pack,
        setup: 0,
        place: 'school',
        earliest: start,
        latestEnd: deadline,
        optional: false,
      },
      {
        id: 'warmup',
        duration: warmup,
        setup: 0,
        place: 'hall',
        earliest: start,
        latestEnd: deadline,
        optional: false,
        // The space is prepared with the packed materials: packing comes first.
        after: 'pack',
      },
    ],
  })
}

interface Checked {
  readonly violations: readonly string[]
  readonly complete: boolean
  readonly margin: number
  readonly trips: number
  readonly ordered: readonly {
    readonly activity: Activity
    readonly start: number
  }[]
}

/** The evaluator's chronological cursor. */
function check(
  p: ScheduleParams,
  placements: readonly SchedulePlacement[],
): Checked {
  const ordered = placements
    .map((placement) => ({
      activity: p.activities.find((entry) => entry.id === placement.activityId),
      start: placement.startMinute,
    }))
    .flatMap((entry) =>
      entry.activity === undefined
        ? []
        : [{ activity: entry.activity, start: entry.start }],
    )
    .sort(
      (a, b) =>
        a.start - b.start ||
        (a.activity.id < b.activity.id
          ? -1
          : a.activity.id > b.activity.id
            ? 1
            : 0),
    )
  const violations: string[] = []
  for (const activity of p.activities)
    if (
      !activity.optional &&
      !ordered.some((entry) => entry.activity.id === activity.id)
    )
      violations.push(`Falta ${ACTIVITY_LABEL[activity.id]}.`)

  let cursor = p.start
  let place: Place = 'school'
  let trips = 0
  for (const { activity, start } of ordered) {
    const moving = activity.place !== place
    if (moving) trips += 1
    const ready = cursor + (moving ? p.travel : 0) + activity.setup
    if (start < ready)
      violations.push(
        `${ACTIVITY_LABEL[activity.id]} a las ${clockText(start)}: antes hacen falta${moving ? ` ${String(p.travel)} min de viaje` : ''}${moving && activity.setup > 0 ? ' y' : ''}${activity.setup > 0 ? ` ${String(activity.setup)} min de preparación` : ''}${!moving && activity.setup === 0 ? ' que termine lo anterior' : ''}.`,
      )
    if (
      start < activity.earliest ||
      start + activity.duration > activity.latestEnd
    )
      violations.push(
        `${ACTIVITY_LABEL[activity.id]} queda fuera de su ventana (${clockText(activity.earliest)}–${clockText(activity.latestEnd)}).`,
      )
    const prior =
      activity.after === undefined
        ? undefined
        : ordered.find((entry) => entry.activity.id === activity.after)
    if (
      activity.after !== undefined &&
      prior !== undefined &&
      prior.start + prior.activity.duration > start
    )
      violations.push(
        `${ACTIVITY_LABEL[activity.id]} necesita «${ACTIVITY_LABEL[activity.after]}» terminado antes.`,
      )
    cursor = start + activity.duration
    place = activity.place
  }
  const finalTrip = place === 'hall' ? 0 : p.travel
  if (finalTrip > 0) trips += 1
  const arrival = cursor + finalTrip
  if (arrival > p.deadline)
    violations.push(
      `Llegás al salón a las ${clockText(arrival)} y el límite es a las ${clockText(p.deadline)}.`,
    )
  return {
    violations,
    complete: p.activities.every((activity) =>
      ordered.some((entry) => entry.activity.id === activity.id),
    ),
    margin: p.deadline - arrival,
    trips,
    ordered,
  }
}

function qualityFor(p: ScheduleParams, result: Checked): SolutionQuality {
  if (result.violations.length > 0) return 'invalid'
  if (p.kind === 'review')
    return result.margin >= p.margin
      ? 'optimal'
      : result.margin > 0
        ? 'efficient'
        : 'functional'
  if (!result.complete) return 'functional'
  return result.margin >= p.margin ? 'optimal' : 'efficient'
}

/**
 * Estilo of a valid agenda, read from where the flexible activity went and
 * never from the margin the quality ladder measures: obligations first (or
 * the flexible one left out), the flexible one fitted into a gap between
 * obligations, or the afternoon opened with it and the rest arranged around.
 */
function styleFor(
  ordered: readonly { readonly activity: Activity }[],
): EstiloAxis {
  const flexible = ordered.findIndex((entry) => entry.activity.optional)
  const mandatory = ordered.flatMap((entry, i) =>
    entry.activity.optional ? [] : [i],
  )
  const first = mandatory[0] ?? 0
  const last = mandatory.at(-1) ?? 0
  if (flexible < 0 || flexible > last) return 'aplicado'
  return flexible < first ? 'improvisador' : 'estratega'
}

export interface SchedulePlan extends StyledPlan {
  readonly placements: readonly SchedulePlacement[]
}

/**
 * Independent classifier for any placement set.
 *
 * Pairwise gaps between consecutive blocks instead of a cursor, and its own
 * ladder. Property tests compare it with the evaluator on arbitrary answers.
 */
export function scheduleOracle(
  p: ScheduleParams,
  placements: readonly SchedulePlacement[],
): SolutionQuality {
  const byId = new Map(p.activities.map((activity) => [activity.id, activity]))
  const blocks = placements
    .map((placement) => ({
      a: byId.get(placement.activityId as ActivityId),
      s: placement.startMinute,
    }))
    .filter(
      (block): block is { a: Activity; s: number } => block.a !== undefined,
    )
  if (
    p.activities.some(
      (a) => !a.optional && !blocks.some((b) => b.a.id === a.id),
    )
  )
    return 'invalid'
  const sorted = [...blocks].sort(
    (x, y) => x.s - y.s || (x.a.id < y.a.id ? -1 : 1),
  )
  const gap = (from: Place, to: Place) => (from === to ? 0 : p.travel)
  for (const block of sorted) {
    if (block.a.after === undefined) continue
    const needed = sorted.find((other) => other.a.id === block.a.after)
    if (needed !== undefined && needed.s + needed.a.duration > block.s)
      return 'invalid'
  }
  for (let i = 0; i < sorted.length; i++) {
    const block = sorted[i]!
    if (
      block.s < block.a.earliest ||
      block.s + block.a.duration > block.a.latestEnd
    )
      return 'invalid'
    const before = sorted[i - 1]
    const freeFrom =
      before === undefined ? p.start : before.s + before.a.duration
    const cameFrom: Place = before === undefined ? 'school' : before.a.place
    if (block.s - block.a.setup - freeFrom < gap(cameFrom, block.a.place))
      return 'invalid'
  }
  const last = sorted[sorted.length - 1]
  const done = last === undefined ? p.start : last.s + last.a.duration
  const left =
    p.deadline -
    done -
    gap(last === undefined ? 'school' : last.a.place, 'hall')
  if (left < 0) return 'invalid'
  if (p.kind === 'review')
    return left >= p.margin ? 'optimal' : left >= 5 ? 'efficient' : 'functional'
  if (sorted.length < p.activities.length) return 'functional'
  return left < p.margin ? 'efficient' : 'optimal'
}

/**
 * Every valid agenda, by depth-first search over the next block and its
 * start. Only valid plans are produced; `scheduleOracle` classifies the rest.
 */
export function schedulePlans(p: ScheduleParams): readonly SchedulePlan[] {
  const plans: SchedulePlan[] = []
  const visit = (
    placed: readonly SchedulePlacement[],
    cursor: number,
    place: Place,
  ): void => {
    const remaining = p.activities.filter(
      (activity) => !placed.some((entry) => entry.activityId === activity.id),
    )
    if (remaining.every((activity) => activity.optional)) {
      const result = check(p, placed)
      const quality = qualityFor(p, result)
      if (quality !== 'invalid')
        plans.push({
          placements: placed,
          quality,
          ...(p.kind === 'rehearsal'
            ? { style: styleFor(result.ordered) }
            : {}),
        })
    }
    for (const activity of remaining) {
      // Chronological search: a dependent block waits for its prerequisite.
      if (
        activity.after !== undefined &&
        !placed.some((entry) => entry.activityId === activity.after)
      )
        continue
      const ready =
        cursor + (activity.place === place ? 0 : p.travel) + activity.setup
      for (const start of startOptions(activity)) {
        if (start < ready) continue
        if (
          start +
            activity.duration +
            (activity.place === 'hall' ? 0 : p.travel) >
          p.deadline
        )
          break
        visit(
          [...placed, { activityId: activity.id, startMinute: start }],
          start + activity.duration,
          activity.place,
        )
      }
    }
  }
  visit([], p.start, 'school')
  return plans
}

export function scheduleGates(p: ScheduleParams): readonly string[] {
  const plans = schedulePlans(p)
  const issues = [...tierWitnessIssues(plans)]
  // The agenda promises different ways to organise the afternoon; the review
  // isolates one chain and promises none.
  if (p.kind === 'rehearsal') {
    if (plans.filter((plan) => plan.quality === 'optimal').length < 2)
      issues.push('una sola agenda óptima')
    issues.push(...styleGateIssues(plans))
  }

  // Intrinsic Math Gate: durations, preparations and the trip decide validity.
  const sequential = (ignoreTravel: boolean, ignoreSetup: boolean) => {
    let cursor = p.start
    let place: Place = 'school'
    return p.activities
      .filter((activity) => !activity.optional)
      .map((activity) => {
        const begin = Math.max(
          activity.earliest,
          cursor +
            (ignoreTravel || activity.place === place ? 0 : p.travel) +
            (ignoreSetup ? 0 : activity.setup),
        )
        cursor = begin + activity.duration
        place = activity.place
        return { activityId: activity.id, startMinute: begin }
      })
  }
  if (scheduleOracle(p, sequential(true, false)) !== 'invalid')
    issues.push('olvidar el viaje no cambia nada')
  if (
    p.activities.some((activity) => activity.setup > 0) &&
    scheduleOracle(p, sequential(false, true)) !== 'invalid'
  )
    issues.push('olvidar la preparación no cambia nada')
  const lastStart = Math.max(
    ...plans.flatMap((plan) =>
      plan.placements
        .filter((entry) => entry.activityId === p.activities[0]?.id)
        .map((entry) => entry.startMinute),
    ),
  )
  const offered = startOptions(p.activities[0]!).at(-1) ?? 0
  if (p.kind === 'review' && lastStart >= offered)
    issues.push(
      'todo inicio ofrecido sirve: no hace falta pensar desde el límite',
    )
  return issues
}

function verifySchedule(p: ScheduleParams): readonly string[] {
  return p.activities.every((activity) => startOptions(activity).length > 0)
    ? []
    : ['ventana sin inicios posibles']
}

export function evaluateSchedule(
  p: ScheduleParams,
  placements: readonly SchedulePlacement[],
) {
  if (
    placements.length > p.activities.length ||
    new Set(placements.map((entry) => entry.activityId)).size !==
      placements.length ||
    placements.some(
      (entry) =>
        !p.activities.some((activity) => activity.id === entry.activityId) ||
        !Number.isSafeInteger(entry.startMinute) ||
        entry.startMinute < 0 ||
        entry.startMinute >= 1440 ||
        entry.startMinute % 5 !== 0,
    )
  )
    return err({
      kind: 'invalid-answer' as const,
      detail: 'agenda fuera del contrato',
    })

  const result = check(p, placements)
  const quality = qualityFor(p, result)
  const review = p.kind === 'review'
  const axis =
    review || quality === 'invalid' ? undefined : styleFor(result.ordered)
  const first = p.activities[0]
  const second = p.activities[1]
  const backwards =
    review && first !== undefined && second !== undefined
      ? `Desde el límite: ${clockText(p.deadline)} − ${String(second.duration)} min − ${String(p.travel)} min de viaje − ${String(first.duration)} min = ${clockText(p.deadline - second.duration - p.travel - first.duration)}, lo más tarde para empezar.`
      : undefined

  return ok(
    outcome(
      quality,
      {
        outcomeKey: `schedule.${p.kind}.${quality}`,
        stamp: quality === 'invalid' ? 'No encaja' : 'Agenda armada',
        facts: [
          ...result.ordered.map(({ activity, start }) => ({
            label: `${ACTIVITY_LABEL[activity.id]} · ${PLACE_LABEL[activity.place]}`,
            value: `${clockText(start)}–${clockText(start + activity.duration)}`,
          })),
          { label: 'Viajes', value: String(result.trips) },
          {
            label: review ? 'Margen al terminar' : 'Margen antes del ensayo',
            value: `${String(Math.max(0, result.margin))} min`,
          },
        ],
        ...(quality === 'invalid'
          ? { violatedConstraint: result.violations.join(' ') }
          : {}),
        ...(backwards === undefined ? {} : { optimalComparison: backwards }),
        consequence:
          quality === 'invalid'
            ? 'Los tiempos no se encadenan: cada bloque necesita su duración y, antes, el viaje y la preparación si cambia de lugar.'
            : review
              ? quality === 'optimal'
                ? 'El espacio queda listo con margen. La cuenta desde el límite hacia atrás cierra.'
                : quality === 'efficient'
                  ? 'Llegás, con poco margen para un imprevisto.'
                  : 'Llegás justo, sin ningún minuto de margen.'
              : quality === 'functional'
                ? 'Lo obligatorio entra; la merienda con el grupo quedó afuera.'
                : quality === 'efficient'
                  ? `Todo entra, pero llegás al ensayo con ${String(result.margin)} min de margen y se pedían ${String(p.margin)}.`
                  : `Todo entra y llegás al ensayo con ${String(result.margin)} min de margen. Otras agendas también funcionan.`,
      },
      axis === undefined
        ? {}
        : { estilo: { axis, amount: grade1StylePolicy.evidence } },
      [
        {
          flag: review ? 'y1.schedule.review-outcome' : 'y1.schedule.outcome',
          value: quality,
        },
        ...(axis === undefined
          ? []
          : [{ flag: 'y1.schedule.strategy', value: axis }]),
      ],
    ),
  )
}

const scheduleVariants = generatedSource({
  id: 'y1.schedule.afternoons',
  version: '1',
  schema: scheduleSchema,
  size: SCHEDULE_SPACE,
  generate: generateSchedule,
  gates: scheduleGates,
})
const reviewVariants = generatedSource({
  id: 'y1.schedule-review.backward-chain',
  version: '1',
  schema: scheduleSchema,
  size: SCHEDULE_REVIEW_SPACE,
  generate: generateScheduleReview,
  gates: scheduleGates,
})

function scheduleTemplate(review: boolean) {
  const variants = review ? reviewVariants : scheduleVariants
  return defineChallenge<ScheduleParams, ScheduleParams>({
    id: toChallengeId(review ? 'y1.schedule-review' : 'y1.rehearsal-schedule'),
    family: toScenarioFamilyId('rehearsal-planning'),
    placement: review ? 'recovery' : 'checkpoint',
    variants: authoredVariantIds(variants.authored),
    variantSource: variants,
    interaction: 'schedule-builder',
    stages: ['year-1'],
    categories: ['time-and-rates'],
    baseDifficulty: review ? 2 : 3,
    cognitive: review
      ? {
          steps: 1,
          constraints: 2,
          selection: 0,
          optimization: 0,
          uncertainty: 0,
          construction: 1,
        }
      : {
          steps: 2,
          constraints: 3,
          selection: 0,
          optimization: 0,
          uncertainty: 0,
          construction: 1,
        },
    composition: {
      primaryReasoningFamily: 'TEMPORAL',
      interactionEngine: 'timeline-schedule',
      pacingClass: review ? 'QUICK' : 'MEDIUM',
      chronology: 40,
    },
    scoring: {
      math: 'discrete-quality',
      team: 'none',
      aura: 'none',
      rationale: review
        ? 'Repaso fuera del plan ordinario: su calidad describe la respuesta y no aporta evidencia competitiva.'
        : 'Math mide duraciones, preparación, viajes, ventanas y el margen escrito. Estilo describe la forma de la agenda y no aporta competencia.',
    },
    tools: ['notepad'],
    generate: ({ params }) => parameters(scheduleSchema, params),
    verify: verifySchedule,
    narrate: (p, context) => ({
      title: review ? 'Repaso: dos cosas y un viaje' : 'Antes del ensayo',
      setup: review
        ? `La clase termina a las ${clockText(p.start)} y a las ${clockText(p.deadline)} el curso entra al salón. Pensá desde ese límite hacia atrás.`
        : `${grade7TimingCallback(context.flags)}Hoy ensayan para el Día del Estudiante. Antes hay que retirar materiales, pintar el cartel y probar el sonido, y el grupo quiere merendar junto.`,
      goal: review
        ? `Guardá los materiales en la escuela y prepará el espacio en el salón; el viaje es de ${String(p.travel)} min. Mejor si te sobran ${String(p.margin)} min.`
        : `Estás libre desde las ${clockText(p.start)} en la escuela y el ensayo empieza a las ${clockText(p.deadline)} en el salón. Buscá llegar con ${String(p.margin)} min de margen. La merienda se puede mover o dejar afuera.`,
    }),
    present: (p) => ({
      kind: 'schedule-builder',
      span: { from: p.start, to: p.deadline },
      data: [
        {
          label: 'Escuela ↔ salón',
          value: String(p.travel),
          unit: 'min de viaje',
          constraint: true,
        },
        {
          label: review ? 'Límite' : 'Empieza el ensayo',
          value: clockText(p.deadline),
          constraint: true,
        },
      ],
      instructions:
        'Elegí la hora de inicio de cada actividad. Si dos seguidas están en lugares distintos, entre una y otra va el viaje; la preparación se hace en el lugar, antes de empezar.',
      activities: p.activities.map((activity) => ({
        id: activity.id,
        label: ACTIVITY_LABEL[activity.id],
        optional: activity.optional,
        location: PLACE_LABEL[activity.place],
        durationMinutes: activity.duration,
        setupMinutes: activity.setup,
        startMinutes: startOptions(activity),
        detail: `${PLACE_LABEL[activity.place]} · ${String(activity.duration)} min${activity.setup > 0 ? ` · ${String(activity.setup)} min de preparación` : ''} · entre ${clockText(activity.earliest)} y ${clockText(activity.latestEnd)}${activity.after === undefined ? '' : ` · después de «${ACTIVITY_LABEL[activity.after]}»`}${activity.optional ? ' · flexible' : ''}`,
      })),
    }),
    evaluate: (p, answer: InteractionAnswer) =>
      answer.kind === 'schedule-builder'
        ? evaluateSchedule(p, answer.placements)
        : err({ kind: 'invalid-answer', detail: 'se esperaba una agenda' }),
  })
}

/** Con nota por calidad (10/8/6/4). Ver `src/content/grades.ts`. */
export const rehearsalSchedule = graded(scheduleTemplate(false))
export const scheduleReview = scheduleTemplate(true)
