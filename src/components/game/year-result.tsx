'use client'

/**
 * Resumen del año.
 *
 * Es el cierre del año que se jugó, no una tarjeta de egreso: el perfil
 * definitivo pertenece a la carrera completa y no se inventa acá.
 *
 * Todo lo que muestra sale del estado que devolvió el motor. La pantalla
 * formatea; no calcula nada.
 */

import type { RunState, SolutionQuality, Storylet } from '@/game'

import { stageLabel } from './stage-label'

const QUALITY_LABEL: Readonly<Record<SolutionQuality, string>> = {
  invalid: 'no salió',
  functional: 'resuelto',
  efficient: 'eficiente',
  optimal: 'redondo',
}

/** Frases de cierre según cómo fue el año. Se elige por conteo, no por azar. */
function closingLine(optimal: number, resolved: number, total: number): string {
  if (optimal >= total - 1) {
    return 'Casi todo salió como lo pensaste. El curso te va a buscar el año que viene.'
  }
  if (resolved === total) {
    return 'Resolviste todo lo que se te puso adelante, algunas cosas con más margen que otras.'
  }
  if (resolved >= Math.ceil(total / 2)) {
    return 'Un año con idas y vueltas: algunas decisiones salieron bien y otras costaron.'
  }
  return 'Séptimo se hizo cuesta arriba, pero llegaste al final y el stand abrió igual.'
}

export function YearResult({
  state,
  nickname,
  storylets,
  onPlayAgain,
}: {
  readonly state: RunState
  readonly nickname: string
  /** Se usa para nombrar cada momento del año sin exponer identificadores. */
  readonly storylets: readonly Storylet[]
  readonly onPlayAgain: () => void
}) {
  const titleOf = (storyletId: string): string =>
    storylets.find((storylet) => storylet.id === storyletId)?.title ??
    'Un momento del año'

  const challenges = state.history.filter(
    (entry) => entry.challengeId !== undefined,
  )
  const resolved = challenges.filter(
    (entry) => entry.quality !== undefined && entry.quality !== 'invalid',
  ).length
  const optimal = challenges.filter(
    (entry) => entry.quality === 'optimal',
  ).length
  const efficient = challenges.filter(
    (entry) => entry.quality === 'efficient',
  ).length

  const coordinated = state.flags['g7.coordina'] === true

  return (
    <section
      aria-labelledby="resultado-titulo"
      className="flex flex-col gap-6"
      data-testid="year-result"
    >
      <header className="flex flex-col gap-1">
        <p className="text-sm tracking-wide text-slate-600 uppercase dark:text-slate-400">
          {nickname}
        </p>
        <h2 id="resultado-titulo" className="text-3xl font-semibold">
          Tu {stageLabel(state.stage)}
        </h2>
        <p className="text-pretty text-slate-700 dark:text-slate-300">
          {closingLine(optimal, resolved, challenges.length)}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3">
        {(
          [
            [
              'Situaciones resueltas',
              `${String(resolved)} de ${String(challenges.length)}`,
            ],
            ['Decisiones redondas', String(optimal)],
            ['Decisiones eficientes', String(efficient)],
            ['Puntaje del año', String(state.completion?.totalScore ?? 0)],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-300 p-3 dark:border-slate-600"
          >
            <dt className="text-xs text-slate-600 dark:text-slate-400">
              {label}
            </dt>
            <dd className="text-xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="momentos" className="flex flex-col gap-2">
        <h3 id="momentos" className="text-lg font-semibold">
          Cómo te fue
        </h3>
        <ul className="flex list-none flex-col gap-1 p-0">
          {challenges.map((entry) => (
            <li
              key={entry.sequence}
              className="flex items-baseline justify-between gap-3 border-b border-slate-200 py-1 text-sm dark:border-slate-700"
            >
              <span>{titleOf(entry.storyletId)}</span>
              <span className="font-medium">
                {entry.quality === undefined
                  ? '—'
                  : QUALITY_LABEL[entry.quality]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="rounded-xl border border-slate-300 p-3 text-sm text-pretty dark:border-slate-600">
        {coordinated
          ? 'Terminaste el año coordinando el proyecto del curso.'
          : 'Terminaste el año con una parte concreta del proyecto a tu cargo.'}
      </p>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onPlayAgain}
          data-testid="play-again"
          className="min-h-12 rounded-xl bg-slate-900 px-5 text-base font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:focus-visible:outline-slate-100"
        >
          Jugar de nuevo
        </button>
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Por ahora Egresado llega hasta acá. Los años siguientes están en
          construcción.
        </p>
      </div>
    </section>
  )
}
