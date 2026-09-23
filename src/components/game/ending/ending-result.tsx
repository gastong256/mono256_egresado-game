'use client'

import { Button, Callout } from '@/components/ui'
import { cn } from '@/lib/ui/cn'

import {
  deriveCompetitivePlacement,
  performanceBand,
  performanceFeedback,
  placementCopy,
  type PlacementSnapshot,
} from './ending-model'
import type { EndingResult } from './career-ending'
import type {
  PublicCompetitionState,
  VerifiedAttemptPayload,
} from '@/lib/competition'

/**
 * El resultado, en el modo que corresponda.
 *
 * Tres reglas y ninguna miente: mientras se verifica no hay número; el número
 * es el que el servidor devolvió; el puesto es el que el servidor publicó, y
 * cada afirmación por encima del puesto —podio, 1.º, nuevo 1.º, récord, mejor
 * puntaje personal— sale de una comparación con evidencia, o no aparece.
 */

function ScoreFigure({
  label,
  value,
  testId,
}: {
  readonly label: string
  readonly value: number
  readonly testId: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-display text-ink-label text-eyebrow tracking-[0.15em] uppercase">
        {label}
      </p>
      <p
        data-numeric
        className="text-milestone font-display text-ink"
        data-testid={testId}
      >
        {value.toLocaleString('es-AR')}
      </p>
    </div>
  )
}

function Headline({ fairScore }: { readonly fairScore: number }) {
  const band = performanceBand(fairScore)
  return (
    <p
      className="text-title font-display text-ink text-pretty"
      data-testid="performance-headline"
      data-band={band}
    >
      {performanceFeedback(band).headline}
    </p>
  )
}

/** El puesto y lo que la evidencia permite decir de él. */
export function Placement({
  result,
  competition,
  before,
}: {
  readonly result: VerifiedAttemptPayload
  readonly competition: PublicCompetitionState
  readonly before?: PlacementSnapshot
}) {
  const placement = deriveCompetitivePlacement(result, competition, before)
  const copy = placementCopy(placement)
  return (
    <div
      className="border-rule flex flex-col gap-2 border-t pt-3"
      data-testid="placement"
      data-rank={placement.rank}
      data-podium={placement.podium ? 'true' : undefined}
      data-record={placement.record ? 'true' : undefined}
      data-new-first={placement.newFirst ? 'true' : undefined}
    >
      {placement.rank === undefined ? null : (
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <p className="font-display text-ink-label text-eyebrow tracking-[0.15em] uppercase">
              Tu puesto actual
            </p>
            <p
              data-numeric
              className="text-display font-display text-ink"
              data-testid="own-rank-figure"
            >
              {placement.rank.toLocaleString('es-AR')}
              <span className="text-label text-ink-secondary ml-2 uppercase">
                de {placement.totalRanked.toLocaleString('es-AR')}
              </span>
            </p>
          </div>
        </div>
      )}
      {copy.claim === undefined ? null : (
        <p
          className={cn(
            'text-goal font-display',
            placement.podium ? 'text-green' : 'text-ink',
          )}
          data-testid="placement-claim"
        >
          {copy.claim}
        </p>
      )}
      {copy.rankLine === undefined ? null : (
        <p className="text-meta text-ink-secondary text-pretty">
          {copy.rankLine}
        </p>
      )}
      <p className="text-meta text-ink text-pretty" data-testid="personal-best">
        {copy.personalBest}
      </p>
    </div>
  )
}

export function CompetitionResult({
  result,
}: {
  readonly result: Extract<EndingResult, { kind: 'competition' }>
}) {
  if (result.phase === 'verifying') {
    return (
      <section
        aria-labelledby="ending-result-title"
        role="status"
        aria-live="polite"
        className="border-ink flex flex-col gap-2 border-t-2 pt-3"
        data-testid="verification-pending"
      >
        <h2
          id="ending-result-title"
          className="text-goal font-display text-ink"
        >
          Verificando tu partida…
        </h2>
        <p className="text-meta text-ink-secondary text-pretty">
          Cuando termine, vas a ver tu puntaje y tu puesto acá.
        </p>
      </section>
    )
  }

  if (result.phase === 'failed') {
    return (
      <section
        aria-labelledby="ending-result-title"
        className="border-ink flex flex-col gap-3 border-t-2 pt-3"
        data-testid="verification-failed"
      >
        <h2 id="ending-result-title" className="sr-only">
          Resultado
        </h2>
        <Callout tone="accent" title="No pudimos verificar tu partida">
          {result.message} Tu recorrido no se pierde: reintentá cuando tengas
          conexión.
        </Callout>
        <Button onClick={result.onRetry}>Reintentar</Button>
      </section>
    )
  }

  const { result: payload, competition, before } = result
  if (payload.status !== 'VERIFIED' || payload.fairScore === undefined) {
    return (
      <section
        aria-labelledby="ending-result-title"
        className="border-ink flex flex-col gap-3 border-t-2 pt-3"
        data-testid="verification-rejected"
      >
        <h2 id="ending-result-title" className="sr-only">
          Resultado
        </h2>
        <Callout tone="accent" title="Esta partida no entra al ranking">
          No pudimos confirmar el resultado de esta partida, así que no suma al
          ranking. Podés jugar otra.
        </Callout>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="ending-result-title"
      className="border-ink flex flex-col gap-3 border-t-2 pt-3"
      data-testid="verification-verified"
    >
      <h2 id="ending-result-title" className="sr-only">
        Resultado
      </h2>
      <ScoreFigure
        label="Puntaje verificado"
        value={payload.fairScore}
        testId="verified-fair-score"
      />
      {payload.prestigeScore !== undefined && payload.prestigeScore > 0 ? (
        <p className="text-meta text-ink-secondary">
          Prestige: {payload.prestigeScore}
        </p>
      ) : null}
      <Headline fairScore={payload.fairScore} />
      <Placement
        result={payload}
        competition={competition}
        {...(before === undefined ? {} : { before })}
      />
    </section>
  )
}

export function PracticeResult({
  result,
}: {
  readonly result: Extract<EndingResult, { kind: 'practice' }>
}) {
  return (
    <section
      aria-labelledby="practice-score-heading"
      className="border-ink flex flex-col gap-3 border-t-2 pt-3"
      data-testid="practice-result"
    >
      <h2
        id="practice-score-heading"
        className="font-display text-ink-label text-eyebrow tracking-[0.15em] uppercase"
      >
        Puntaje de práctica
      </h2>
      {result.phase === 'done' ? (
        <>
          <p
            data-numeric
            className="text-milestone font-display text-ink"
            data-testid="practice-score"
          >
            {result.fairScore.toLocaleString('es-AR')}
          </p>
          <Headline fairScore={result.fairScore} />
        </>
      ) : result.phase === 'failed' ? (
        <>
          <Callout title="El puntaje todavía no está calculado">
            {result.message}
          </Callout>
          <Button variant="secondary" onClick={result.onRetry}>
            Reintentar cálculo
          </Button>
        </>
      ) : (
        <p role="status" className="text-body text-ink-secondary">
          Calculando tu puntaje de práctica…
        </p>
      )}
      <p className="text-meta text-ink-secondary text-pretty">
        Este puntaje es de práctica y no modifica el ranking.
      </p>
    </section>
  )
}
