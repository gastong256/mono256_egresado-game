'use client'

/**
 * El cierre de la carrera.
 *
 * Responde cinco preguntas en este orden, sin que haya que buscarlas:
 * ¿terminé? (Egresaste), ¿cómo me fue? (puntaje, puesto si es competencia),
 * ¿qué tipo de partida hice? (estilo y números), ¿qué logré? (hitos y
 * recorrido) y ¿qué hago ahora? (acciones). La graduación va primero y más
 * grande porque es lo único que toda run consigue; el puntaje va segundo
 * porque es lo que distingue una run de otra.
 *
 * Todo lo que muestra sale del estado final y de lo que el servidor devolvió.
 * No puntúa, no decide y no guarda nada.
 */

import type { ReactNode } from 'react'

import { Button } from '@/components/ui'
import type { CareerEpilogue, CareerMemory, Milestone, RunState } from '@/game'
import { isEstiloEstablished } from '@/game'
import type {
  PublicCompetitionState,
  VerifiedAttemptPayload,
} from '@/lib/competition'

import { ActionSlot, GameSheet, SceneColumn } from '../game-shell'
import { Milestone as MilestoneFrame } from '../milestone'
import { personalizedName } from '../progression-copy'
import { SceneMedia } from '../scene-media'
import { MILESTONE_ARTWORK } from '../milestone-artwork'
import { AchievementCabinet } from './achievement-cabinet'
import { CareerProfile } from './career-profile'
import { CareerRecap } from './career-recap'
import {
  careerNumbersOf,
  deriveAchievements,
  deriveCareerRecap,
  performanceBand,
  performanceFeedback,
  playStyleOf,
  type PlacementSnapshot,
} from './ending-model'
import { CompetitionResult, PracticeResult } from './ending-result'

export interface EndingInput {
  readonly state: RunState
  readonly epilogue: CareerEpilogue
  readonly milestones: readonly Milestone[]
  readonly memories: readonly CareerMemory[]
}

/** El resultado del modo, en el estado en que esté. */
export type EndingResult =
  | { readonly kind: 'competition'; readonly phase: 'verifying' }
  | {
      readonly kind: 'competition'
      readonly phase: 'failed'
      readonly message: string
      readonly onRetry: () => void
    }
  | {
      readonly kind: 'competition'
      readonly phase: 'verified'
      readonly result: VerifiedAttemptPayload
      readonly competition: PublicCompetitionState
      readonly before?: PlacementSnapshot
    }
  | { readonly kind: 'practice'; readonly phase: 'verifying' }
  | {
      readonly kind: 'practice'
      readonly phase: 'failed'
      readonly message: string
      readonly onRetry: () => void
    }
  | {
      readonly kind: 'practice'
      readonly phase: 'done'
      readonly fairScore: number
    }
  /** Un recorrido de desarrollo: sin puntaje del servidor. */
  | { readonly kind: 'none' }

/** El puntaje verificado, cuando ya existe. Es el único que se lee. */
function knownScore(result: EndingResult): number | undefined {
  if (result.kind === 'competition' && result.phase === 'verified')
    return result.result.status === 'VERIFIED'
      ? result.result.fairScore
      : undefined
  if (result.kind === 'practice' && result.phase === 'done')
    return result.fairScore
  return undefined
}

export function CareerEnding({
  ending,
  result,
  nickname,
  onPlayAgain,
  onBackToRanking,
  playAgainDisabled = false,
}: {
  readonly ending: EndingInput
  readonly result: EndingResult
  /** El alias público, si el modo lo tiene: «Egresaste, Sofi.» */
  readonly nickname?: string
  readonly onPlayAgain: () => void
  readonly onBackToRanking?: () => void
  readonly playAgainDisabled?: boolean
}) {
  const { state, epilogue } = ending
  const named = personalizedName(nickname)
  const score = knownScore(result)
  const band = score === undefined ? undefined : performanceBand(score)
  const style = playStyleOf(state)
  const numbers = careerNumbersOf(state)
  const achievements = deriveAchievements(
    state,
    ending.milestones,
    ending.memories,
  )
  const years = deriveCareerRecap(state, ending.memories)
  const headline = epilogue.profile[0]

  return (
    <GameSheet>
      <SceneColumn>
        {/* 1 · EGRESASTE, siempre y primero. */}
        <MilestoneFrame
          eyebrow="Fin de la secundaria"
          numeral="Egresado"
          headingLevel={1}
        >
          <p
            className="font-display text-ink text-eyebrow tracking-[0.18em] [overflow-wrap:anywhere] uppercase"
            data-testid="graduated"
          >
            {epilogue.graduated
              ? named === undefined
                ? 'Egresaste'
                : `Egresaste, ${named}.`
              : 'Terminaste el recorrido'}
          </p>
          {headline === undefined ? null : (
            <p
              className="text-body-lg text-ink text-pretty"
              data-testid="epilogue-profile"
            >
              {headline}
            </p>
          )}
        </MilestoneFrame>

        <SceneMedia
          src={MILESTONE_ARTWORK.graduation}
          className="mx-auto max-w-[192px]"
          sizes="192px"
        />

        {/* 2 · El resultado del modo: puntaje, franja y puesto. */}
        {result.kind === 'competition' ? (
          <CompetitionResult result={result} />
        ) : result.kind === 'practice' ? (
          <PracticeResult result={result} />
        ) : null}

        {/* 3 · Estilo y números. */}
        <CareerProfile
          style={style}
          numbers={numbers}
          estilo={state.career.estilo}
          estiloEstablished={isEstiloEstablished(state.career)}
        />

        {/* 4 · Hitos reales, si los hubo. 5 · El recorrido, año por año. */}
        <AchievementCabinet achievements={achievements} />
        <CareerRecap years={years} />

        {/* 6 · Cierre y acciones. */}
        <EndingActions
          result={result}
          closing={
            band === undefined ? undefined : performanceFeedback(band).closing
          }
          onPlayAgain={onPlayAgain}
          {...(onBackToRanking === undefined ? {} : { onBackToRanking })}
          playAgainDisabled={playAgainDisabled}
        />
      </SceneColumn>
    </GameSheet>
  )
}

/**
 * Qué se puede hacer ahora.
 *
 * Un solo primario, y siempre uno que el estado permite: en competencia,
 * jugar de nuevo sólo mientras la edición sigue abierta; en práctica,
 * practicar de nuevo; mientras el servidor verifica, nada que pueda perder la
 * partida. La línea de cierre sólo existe cuando hay un puntaje del que
 * hablar.
 */
function EndingActions({
  result,
  closing,
  onPlayAgain,
  onBackToRanking,
  playAgainDisabled,
}: {
  readonly result: EndingResult
  readonly closing: string | undefined
  readonly onPlayAgain: () => void
  readonly onBackToRanking?: () => void
  readonly playAgainDisabled: boolean
}) {
  let primary: ReactNode = null
  let secondary: ReactNode = null
  let note: ReactNode = null

  if (result.kind === 'competition') {
    if (result.phase === 'verifying') {
      note = (
        <p className="text-caption text-ink-secondary text-center text-pretty">
          Cuando termine la verificación vas a poder volver al ranking.
        </p>
      )
    } else {
      const open =
        result.phase === 'verified' &&
        result.competition.competition.status === 'open'
      const ranking =
        onBackToRanking === undefined ? null : (
          <Button
            variant={open ? 'secondary' : 'primary'}
            onClick={onBackToRanking}
            data-testid="back-to-ranking"
          >
            Volver al ranking
          </Button>
        )
      if (open) {
        primary = (
          <Button
            onClick={onPlayAgain}
            disabled={playAgainDisabled}
            data-testid="play-again"
          >
            Jugar de nuevo
          </Button>
        )
        secondary = ranking
      } else {
        primary = ranking
        if (result.phase === 'verified')
          note = (
            <p className="text-caption text-ink-secondary text-center text-pretty">
              La competencia ya no admite partidas nuevas. El ranking queda
              publicado.
            </p>
          )
      }
    }
  } else if (result.kind === 'practice') {
    if (result.phase !== 'verifying')
      primary = (
        <Button
          onClick={onPlayAgain}
          disabled={playAgainDisabled}
          data-testid="play-again"
        >
          Practicar de nuevo
        </Button>
      )
    note = (
      <p className="text-caption text-ink-secondary text-center text-pretty">
        Esto es una partida de práctica: el resultado es tuyo y no entra en
        ningún ranking.
      </p>
    )
  } else {
    // Un recorrido de desarrollo no tiene puntaje del servidor, pero sigue
    // siendo una partida de práctica: se lo dice igual.
    primary = (
      <Button onClick={onPlayAgain} data-testid="play-again">
        Jugar de nuevo
      </Button>
    )
    note = (
      <p className="text-caption text-ink-secondary text-center text-pretty">
        Esto es una partida de práctica: el resultado es tuyo y no entra en
        ningún ranking.
      </p>
    )
  }

  return (
    <ActionSlot>
      {closing === undefined ? null : (
        <p
          className="text-body text-ink border-ink border-t-2 pt-3 text-pretty"
          data-testid="performance-closing"
        >
          {closing}
        </p>
      )}
      {primary}
      {secondary}
      {note}
    </ActionSlot>
  )
}
