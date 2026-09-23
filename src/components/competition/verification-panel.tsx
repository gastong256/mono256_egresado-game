'use client'

import { Button, Callout } from '@/components/ui'
import type { VerifiedAttemptPayload } from '@/lib/competition'

/**
 * El resultado, después de que el servidor lo verificó.
 *
 * Tres estados y ninguno miente. Mientras se verifica no hay número; cuando se
 * verifica, el número es el que el servidor recomputó; cuando no se pudo
 * verificar, se dice eso y se ofrece reintentar, porque la causa más común no
 * es una trampa sino el Wi-Fi de la escuela.
 *
 * Un intento rechazado tampoco inventa un puntaje. Dice que no entró al
 * ranking, sin acusar a nadie: el mismo rechazo puede venir de una partida
 * manipulada y de una versión que cambió en el medio, y la pantalla del
 * jugador no es el lugar para adjudicar eso.
 */
export function VerificationPanel({
  phase,
  result,
  message,
  onRetry,
  onPlayAgain,
  onBackToRanking,
}: {
  readonly phase: 'idle' | 'verifying' | 'verified' | 'failed'
  readonly result?: VerifiedAttemptPayload
  readonly message?: string
  readonly onRetry: () => void
  readonly onPlayAgain: () => void
  readonly onBackToRanking: () => void
}) {
  if (phase === 'idle' || phase === 'verifying') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col gap-2"
        data-testid="verification-pending"
      >
        <p className="text-goal font-display text-ink">
          Verificando tu partida…
        </p>
        <p className="text-meta text-ink-secondary text-pretty">
          Cuando termine, vas a ver tu puntaje acá.
        </p>
      </div>
    )
  }

  if (phase === 'failed') {
    return (
      <div className="flex flex-col gap-3" data-testid="verification-failed">
        <Callout tone="accent" title="No pudimos verificar tu partida">
          {message ?? 'Probá de nuevo en unos segundos.'} Tu recorrido no se
          pierde: reintentá cuando tengas conexión.
        </Callout>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
          <Button variant="secondary" onClick={onBackToRanking}>
            Volver al ranking
          </Button>
        </div>
      </div>
    )
  }

  if (result === undefined || result.status !== 'VERIFIED') {
    return (
      <div className="flex flex-col gap-3" data-testid="verification-rejected">
        <Callout tone="accent" title="Esta partida no entra al ranking">
          No pudimos confirmar el resultado de esta partida, así que no suma al
          ranking. Podés jugar otra.
        </Callout>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onPlayAgain}>
            Jugar de nuevo
          </Button>
          <Button variant="secondary" onClick={onBackToRanking}>
            Volver al ranking
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3" data-testid="verification-verified">
      <div className="flex flex-col gap-1">
        <p className="text-caption font-display text-ink-secondary uppercase">
          Puntaje verificado
        </p>
        {/*
          `text-display` y no un tamaño suelto de Tailwind: el puntaje
          verificado es el título de esta pantalla, y el sistema de diseño tiene
          un rol para eso. Un tamaño arbitrario abriría una segunda escala
          tipográfica al lado de la que el proyecto ya fijó.
        */}
        <p
          className="text-display font-display text-ink tabular-nums"
          data-testid="verified-fair-score"
        >
          {(result.fairScore ?? 0).toLocaleString('es-AR')}
        </p>
        {result.prestigeScore !== undefined && result.prestigeScore > 0 ? (
          <p className="text-meta text-ink-secondary">
            Prestige: {result.prestigeScore}
          </p>
        ) : null}
      </div>

      <p className="text-meta text-ink text-pretty" data-testid="personal-best">
        {result.personalBest
          ? 'Es tu mejor partida hasta ahora. Es la que cuenta en el ranking.'
          : 'No superó tu mejor partida: en el ranking sigue contando la anterior.'}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onPlayAgain}>
          Jugar de nuevo
        </Button>
        <Button variant="secondary" onClick={onBackToRanking}>
          Volver al ranking
        </Button>
      </div>
    </div>
  )
}
