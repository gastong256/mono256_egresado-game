/**
 * Auditoría de ritmo de la carrera completa.
 *
 *     pnpm game:pacing                 tabla de formas de run
 *     pnpm game:pacing -- --beats      además, el detalle beat por beat
 *     pnpm game:pacing -- --seeds=40   cuántas semillas por forma
 *
 * Mide lo que la pantalla imprime en carreras deterministas y lo convierte en
 * segundos con las constantes declaradas en `tests/helpers/pacing-model.ts`.
 * Es un proxy de ingeniería contra el objetivo de producto —una run estándar
 * de 4 a 7 minutos— y **no** sustituye la validación con jugadores reales, que
 * sigue diferida a su gate humano.
 */
import {
  activeChallengeView,
  createRun,
  transition,
  type GameCommand,
  type SolutionQuality,
} from '@/game'
import {
  createFullCareerDependencies,
  createFullCareerRunDescriptor,
} from '@/content/full-career'
import { grade5Answer } from '../../tests/helpers/grade-5-play'
import {
  beatSeconds,
  DEFAULT_ASSUMPTIONS,
  effortClassOf,
  narrativeWords,
  presentationWords,
  summarize,
  words,
  type BeatCost,
  type PacingAssumptions,
  type RunPacing,
} from '../../tests/helpers/pacing-model'

const dependencies = createFullCareerDependencies()

/** Cómo juega cada forma de run. El índice es el beat, no la Template. */
type Policy = (index: number) => SolutionQuality

const SHAPES: readonly {
  readonly name: string
  readonly seed: string
  readonly policy: Policy
}[] = [
  { name: 'rápida y limpia', seed: 'pace-clean', policy: () => 'optimal' },
  {
    name: 'típica mixta',
    seed: 'pace-mixed',
    policy: (index) =>
      index % 3 === 0
        ? 'functional'
        : index % 3 === 1
          ? 'efficient'
          : 'optimal',
  },
  {
    name: 'con recuperaciones',
    seed: 'pace-recovery',
    policy: (index) => (index % 2 === 0 ? 'invalid' : 'efficient'),
  },
  { name: 'toda eficiente', seed: 'pace-efficient', policy: () => 'efficient' },
  {
    name: 'toda funcional',
    seed: 'pace-functional',
    policy: () => 'functional',
  },
]

function measure(seed: string, policy: Policy): RunPacing {
  const built = createFullCareerRunDescriptor(seed)
  if (!built.ok) throw new Error(`compose: ${JSON.stringify(built.error)}`)
  const created = createRun(built.value, dependencies)
  if (!created.ok) throw new Error(`create: ${JSON.stringify(created.error)}`)

  let state = created.value.state
  const beats: BeatCost[] = []
  let narrativeScreens = 0
  let index = 0

  for (let step = 0; step < 240 && state.status === 'active'; step++) {
    let command: GameCommand = { type: 'CONTINUE' }

    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, dependencies)
      if (!view.ok || view.value === undefined) throw new Error('sin vista')
      const seen = view.value
      const wanted = policy(index)
      index += 1
      let answer
      try {
        answer = grade5Answer(seen, dependencies, wanted, built.value)
      } catch {
        // Una Template sin ese nivel en su oráculo se juega óptima: la forma de
        // run mide ritmo, no cobertura de niveles.
        answer = grade5Answer(seen, dependencies, 'optimal', built.value)
      }
      command = { type: 'ANSWER', instanceId: seen.ref.instanceId, answer }

      const applied = transition(state, command, dependencies)
      if (!applied.ok)
        throw new Error(`transition: ${JSON.stringify(applied.error)}`)

      // El panel de resultado sale de `pendingFeedback`, que es exactamente lo
      // que la pantalla muestra y lo que una reanudación restaura.
      const pending = applied.value.state.pendingFeedback
      const feedbackProse =
        pending === undefined
          ? 0
          : words(pending.feedback.consequence) +
            words(pending.feedback.optimalComparison) +
            words(pending.feedback.violatedConstraint)
      const feedbackStructured =
        pending === undefined
          ? 0
          : words(pending.feedback.stamp) +
            pending.feedback.facts.reduce(
              (total, fact) => total + words(fact.label) + words(fact.value),
              0,
            )

      const screen = presentationWords(seen.interaction)
      const partial = {
        templateId: String(seen.ref.templateId),
        effort: effortClassOf(seen.interaction.kind),
        prose: narrativeWords(seen) + screen.prose + feedbackProse,
        structured: screen.structured + feedbackStructured,
        recovery: seen.review !== undefined,
      }
      beats.push({ ...partial, seconds: beatSeconds(partial, assumptions) })
      state = applied.value.state
      continue
    }

    narrativeScreens += 1
    const next = transition(state, command, dependencies)
    if (!next.ok) throw new Error(`transition: ${JSON.stringify(next.error)}`)
    state = next.value.state
  }

  if (state.status !== 'completed') throw new Error('la run no terminó')
  if (state.completion?.graduated !== true) throw new Error('no egresó')
  return summarize(beats, narrativeScreens, assumptions)
}

/**
 * El objetivo UX de la carrera completa.
 *
 * `docs/01-game-design/full-career-content-matrix.md`: mediana 8–10 minutos y
 * p75 ≤ 12, «todavía sin validación empírica». El 4–7 de `product-vision.md` es
 * el objetivo anterior, de cuando una run era un año suelto y no los seis.
 */
const TARGET_LOW = 8
const TARGET_HIGH = 10
const TARGET_P75 = 12

const seeds = Number(
  process.argv.find((arg) => arg.startsWith('--seeds='))?.slice(8) ?? '25',
)
const showBeats = process.argv.includes('--beats')
/**
 * `--wpm=N` cambia el ritmo de lectura supuesto, y el de consulta con él.
 *
 * Sirve para ver de qué depende la estimación: la constante de lectura no está
 * calibrada contra nadie, así que poder moverla es parte de leer el resultado
 * con honestidad.
 */
const wpm = Number(
  process.argv.find((arg) => arg.startsWith('--wpm='))?.slice(6) ??
    String(DEFAULT_ASSUMPTIONS.wordsPerMinute),
)
const assumptions: PacingAssumptions = {
  ...DEFAULT_ASSUMPTIONS,
  wordsPerMinute: wpm,
  scannedWordsPerMinute:
    (wpm * DEFAULT_ASSUMPTIONS.scannedWordsPerMinute) /
    DEFAULT_ASSUMPTIONS.wordsPerMinute,
}

process.stdout.write('Ritmo de la carrera completa · proxy de ingeniería\n')
process.stdout.write(
  `  objetivo UX de la carrera: mediana ${String(TARGET_LOW)}–${String(TARGET_HIGH)} min y p75 ≤ ${String(TARGET_P75)} min (full-career-content-matrix)\n`,
)
process.stdout.write(
  '  esto NO es evidencia con jugadores reales; esa validación sigue diferida\n',
)
process.stdout.write(
  `  supuestos: ${String(wpm)} palabras/min de prosa · ${assumptions.scannedWordsPerMinute.toFixed(0)} de consulta\n\n`,
)
process.stdout.write(
  '| Forma | Semillas | Pantallas | Palabras | Recup. | Mezcla de interacción | Mediana | p75 | Rango | Estado |\n',
)
process.stdout.write('|---|---|---|---|---|---|---|---|---|---|\n')

let worst = 0
for (const shape of SHAPES) {
  const runs: RunPacing[] = []
  for (let index = 0; index < seeds; index++)
    runs.push(measure(`${shape.seed}-${String(index)}`, shape.policy))

  const minutes = runs.map((run) => run.minutes).sort((a, b) => a - b)
  const median = minutes[Math.floor(minutes.length / 2)] ?? 0
  const p75 =
    minutes[
      Math.min(minutes.length - 1, Math.ceil(minutes.length * 0.75) - 1)
    ] ?? 0
  const low = minutes[0] ?? 0
  const high = minutes.at(-1) ?? 0
  worst = Math.max(worst, high)
  const mix = Object.entries(runs[0]?.byEffort ?? {})
    .filter(([, count]) => count > 0)
    .map(([effort, count]) => `${effort.toLowerCase()} ${String(count)}`)
    .join(' · ')
  const average = (pick: (run: RunPacing) => number) =>
    (runs.reduce((total, run) => total + pick(run), 0) / runs.length).toFixed(1)
  const status =
    median >= TARGET_LOW && median <= TARGET_HIGH && p75 <= TARGET_P75
      ? 'en banda'
      : median < TARGET_LOW
        ? 'corta'
        : 'larga'
  process.stdout.write(
    `| ${shape.name} | ${String(seeds)} | ${average((run) => run.screens)} | ${average((run) => run.words)} | ${average((run) => run.recoveries)} | ${mix} | **${median.toFixed(2)}** | ${p75.toFixed(2)} | ${low.toFixed(2)}–${high.toFixed(2)} | ${status} |\n`,
  )

  if (showBeats && runs[0] !== undefined) {
    process.stdout.write('\n')
    for (const beat of runs[0].beats)
      process.stdout.write(
        `    ${beat.templateId.padEnd(34)} ${beat.effort.padEnd(20)} ${String(beat.prose).padStart(4)} prosa ${String(beat.structured).padStart(4)} consulta  ${beat.seconds.toFixed(1).padStart(6)} s${beat.recovery ? '  (recuperación)' : ''}\n`,
      )
    process.stdout.write('\n')
  }
}

process.stdout.write(
  `\nPeor caso observado: ${worst.toFixed(2)} min sobre ${String(SHAPES.length * seeds)} carreras.\n`,
)
