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

import { RotateCcw } from 'lucide-react'

import { Button, Surface } from '@/components/ui'
import type { RunState, SolutionQuality, Storylet } from '@/game'

import { DataMetric } from './data-metric'
import { Milestone } from './milestone'
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
      <Milestone
        eyebrow={`${nickname} · año terminado`}
        title={`Tu ${stageLabel(state.stage)}`}
      >
        <span id="resultado-titulo">
          {closingLine(optimal, resolved, challenges.length)}
        </span>
      </Milestone>

      <div className="grid grid-cols-2 gap-2">
        <DataMetric
          label="Situaciones resueltas"
          value={`${String(resolved)} de ${String(challenges.length)}`}
          prominent
        />
        <DataMetric
          label="Puntaje del año"
          value={String(state.completion?.totalScore ?? 0)}
          prominent
        />
        <DataMetric label="Decisiones redondas" value={String(optimal)} />
        <DataMetric label="Decisiones eficientes" value={String(efficient)} />
      </div>

      <section aria-labelledby="momentos" className="flex flex-col gap-2">
        <h3 id="momentos" className="text-heading">
          Cómo te fue
        </h3>
        <ul className="flex list-none flex-col p-0">
          {challenges.map((entry) => (
            <li
              key={entry.sequence}
              className="border-line flex items-baseline justify-between gap-3 border-b py-2 last:border-b-0"
            >
              <span className="text-body-sm text-foreground">
                {titleOf(entry.storyletId)}
              </span>
              <span className="text-body-sm text-foreground-muted font-semibold">
                {entry.quality === undefined
                  ? '—'
                  : QUALITY_LABEL[entry.quality]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Surface tone="muted" padding="default">
        <p className="text-body-sm text-foreground text-pretty">
          {coordinated
            ? 'Terminaste el año coordinando el proyecto del curso.'
            : 'Terminaste el año con una parte concreta del proyecto a tu cargo.'}
        </p>
      </Surface>

      <div className="flex flex-col gap-3">
        <Button size="lg" block onClick={onPlayAgain} data-testid="play-again">
          <RotateCcw aria-hidden className="size-5" />
          Jugar de nuevo
        </Button>
        <p className="text-caption text-foreground-muted text-center text-pretty">
          Por ahora Egresado llega hasta acá. Los años siguientes están en
          construcción.
        </p>
      </div>
    </section>
  )
}
