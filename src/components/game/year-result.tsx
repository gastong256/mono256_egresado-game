'use client'

/**
 * Cierre del año.
 *
 * Es el cierre del año que se jugó, no una tarjeta de egreso: el perfil
 * definitivo pertenece a la carrera completa y no se inventa acá. Por eso dice
 * «vas camino a» y no «sos» — un veredicto cerrado sobre alguien de doce años
 * sería exactamente el lenguaje clínico que el GDD prohíbe.
 *
 * Es el único momento del juego donde el modelo del jugador se muestra completo
 * y expandido. Durante el desafío la tira es de 46 px porque el desafío es lo
 * importante; acá el año terminó y la carrera pasa a ser lo que se lee.
 *
 * Todo sale del estado que devolvió el motor. La pantalla formatea; no calcula.
 */

import {
  isEstiloEstablished,
  promedio,
  type RunState,
  type SolutionQuality,
} from '@/game'
import { Button, RecordRow } from '@/components/ui'

import { AuraBlock } from './aura-display'
import { CareerStrip } from './career-strip'
import { EstiloLegend, EstiloTriangle } from './estilo-triangle'
import { formatEquipo, formatPromedio, NOT_ESTABLISHED } from './format'
import { ActionSlot, GameSheet, SceneColumn, StageHeader } from './game-shell'
import { ArchetypeStamp, MemorablePanel, Milestone } from './milestone'
import { profileLabel } from './profile-label'
import { stageLabel } from './stage-label'

/**
 * Lo más memorable del año.
 *
 * Se elige por conteo, no por azar: dos runs con el mismo recorrido cierran con
 * la misma frase, que es lo que hace que el cierre se sienta un resumen y no una
 * galleta de la fortuna.
 *
 * La línea habla de cómo se resolvió el año y no del acto del 25 de Mayo, que es
 * el único evento memorable de 7.º: repetir en el cierre el momento que el
 * jugador ya vio con su propio bloque de Aura sería contarle dos veces la misma
 * escena. El acto se lee en la cifra de Aura, no en esta frase.
 */
function memorableLine(qualities: readonly SolutionQuality[]): string {
  const optimal = qualities.filter((quality) => quality === 'optimal').length
  const failed = qualities.filter((quality) => quality === 'invalid').length

  if (optimal >= qualities.length - 1 && qualities.length > 0) {
    return 'Casi todo salió como lo pensaste. El curso te va a buscar el año que viene.'
  }
  if (failed === 0) {
    return 'Resolviste todo lo que se te puso adelante, algunas cosas con más margen que otras.'
  }
  if (failed === 1) {
    return 'Un año con idas y vueltas: casi todo salió, y una se fue de las manos.'
  }
  return 'Séptimo se hizo cuesta arriba, pero llegaste al final y el stand abrió igual.'
}

export function YearResult({
  state,
  onPlayAgain,
}: {
  readonly state: RunState
  readonly onPlayAgain: () => void
}) {
  const { career, completion } = state
  const average = promedio(career)
  const challenges = state.history.filter(
    (entry) => entry.challengeId !== undefined,
  )
  const qualities = challenges.flatMap((entry) =>
    entry.quality === undefined ? [] : [entry.quality],
  )

  return (
    <GameSheet>
      <StageHeader
        stage={stageLabel(state.stage)}
        resolved={state.history.length}
        total={state.history.length}
      />

      {/* La tira sigue arriba: el cierre no cambia de mundo, sólo sube el
          volumen. Abajo el modelo se repite expandido, que es la única pantalla
          donde eso vale la pena. */}
      <CareerStrip career={career} />

      <SceneColumn>
        <Milestone eyebrow="Cierre de etapa" numeral={stageNumeral(state)}>
          <div className="flex flex-col" data-testid="year-record">
            <RecordRow
              label="Promedio"
              value={
                average === null ? NOT_ESTABLISHED : formatPromedio(average)
              }
            />
            <RecordRow
              label="Equipo"
              value={
                career.equipo === null
                  ? NOT_ESTABLISHED
                  : formatEquipo(career.equipo)
              }
            />
            <RecordRow
              label="Eventos"
              value={String(completion?.eventsPlayed ?? state.history.length)}
              last
            />
          </div>

          {/* El bloque negro aparece sólo si Aura existe. Un `+0` sobre negro
              sería un anuncio de que no pasó nada. */}
          {career.aura === null ? null : <AuraBlock value={career.aura} />}

          {isEstiloEstablished(career) ? (
            <div className="flex items-center gap-3.5 pt-0.5">
              <div className="w-[88px] shrink-0">
                <EstiloTriangle estilo={career.estilo} />
              </div>
              <EstiloLegend estilo={career.estilo} className="flex-1" />
            </div>
          ) : null}

          <MemorablePanel>{memorableLine(qualities)}</MemorablePanel>

          {completion === undefined ? null : (
            <ArchetypeStamp
              archetype={profileLabel(completion.profile.profileId)}
              stampLine={`DIC · ${stageNumeral(state)}`}
            />
          )}
        </Milestone>

        <ActionSlot>
          <Button onClick={onPlayAgain} data-testid="play-again">
            Jugar de nuevo
          </Button>
          <p className="text-caption text-ink-secondary text-center text-pretty">
            Por ahora Egresado llega hasta acá. Los años siguientes están en
            construcción.
          </p>
        </ActionSlot>
      </SceneColumn>
    </GameSheet>
  )
}

/** El numeral del año, sin la palabra: «7.º», no «7.º grado». */
function stageNumeral(state: RunState): string {
  const [numeral] = stageLabel(state.stage).split(' ')
  return numeral ?? stageLabel(state.stage)
}
