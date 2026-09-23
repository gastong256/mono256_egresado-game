'use client'

/**
 * Cierre de la carrera.
 *
 * El orden de presentación es el que fija el sistema narrativo y no se
 * reordena: EGRESASTE primero —ningún desempeño lo sustituye por un fracaso—,
 * después el perfil autorado, el recorrido, el registro, los hitos y recién al
 * final el resultado del modo. La pantalla formatea lo que el motor ya calculó;
 * no puntúa, no decide y no inventa una dimensión que la carrera no estableció.
 *
 * Reusa la gramática de cierre de año: el `Milestone` existe justamente para
 * servir «7.º» hoy y «Egresado» al final, sin cambiar de forma.
 */

import type { CareerEpilogue as CareerEpilogueData } from '@/game'
import { Button, RecordRow } from '@/components/ui'

import { AuraBlock } from './aura-display'
import { EstiloLegend, EstiloTriangle } from './estilo-triangle'
import { formatEquipo, formatPromedio, NOT_ESTABLISHED } from './format'
import { ActionSlot, GameSheet, SceneColumn } from './game-shell'
import { ArchetypeStamp, Milestone } from './milestone'
import { stageLabel } from './stage-label'

export function CareerEpilogueView({
  epilogue,
  onPlayAgain,
}: {
  readonly epilogue: CareerEpilogueData
  readonly onPlayAgain: () => void
}) {
  const { career } = epilogue

  return (
    <GameSheet>
      <SceneColumn>
        <Milestone eyebrow="Fin de la secundaria" numeral="Egresado">
          {/* 1 · EGRESASTE, siempre. */}
          <p
            className="font-display text-ink text-eyebrow tracking-[0.18em] uppercase"
            data-testid="graduated"
          >
            {epilogue.graduated ? 'Egresaste' : 'Terminaste el recorrido'}
          </p>

          {/* 2 · Perfil narrativo breve, autorado, sin jerarquía moral. */}
          <div className="flex flex-col gap-1.5" data-testid="epilogue-profile">
            {epilogue.profile.map((line) => (
              <p key={line} className="text-body text-ink text-pretty">
                {line}
              </p>
            ))}
          </div>

          {/* 3 · TU RECORRIDO. */}
          <div
            className="border-rule-soft flex flex-col gap-2.5 border-t pt-3"
            data-testid="epilogue-memories"
          >
            <span className="font-display text-ink-label text-eyebrow tracking-[0.15em] uppercase">
              Tu recorrido
            </span>
            {epilogue.memories.map((memory) => (
              <div key={memory.id} className="flex flex-col gap-0.5">
                <span className="text-caption text-ink-secondary">
                  {stageLabel(memory.stage)} · {memory.title}
                </span>
                <p className="text-body text-ink text-pretty">{memory.text}</p>
              </div>
            ))}
          </div>

          {/* 4 · El registro. Una dimensión no establecida no se dibuja como cero. */}
          <div className="flex flex-col" data-testid="epilogue-record">
            <RecordRow
              label="Promedio"
              value={
                career.promedio === null
                  ? NOT_ESTABLISHED
                  : formatPromedio(career.promedio)
              }
            />
            <RecordRow
              label="Equipo"
              value={
                career.equipo === null
                  ? NOT_ESTABLISHED
                  : formatEquipo(career.equipo)
              }
              last={career.aura === null}
            />
          </div>
          {career.aura === null ? null : <AuraBlock value={career.aura} />}

          {career.estiloEstablished ? (
            <div className="flex items-center gap-3.5 pt-0.5">
              <div className="w-[88px] shrink-0">
                <EstiloTriangle estilo={career.estilo} />
              </div>
              <EstiloLegend estilo={career.estilo} className="flex-1" />
            </div>
          ) : null}

          {/* 5 · Hitos: badges de display. El Prestige se nombra aparte, y sólo
              si la edición ofreció alguna oportunidad. */}
          {epilogue.milestones.length === 0 ? null : (
            <div
              className="border-rule-soft flex flex-col gap-2 border-t pt-3"
              data-testid="epilogue-milestones"
            >
              <span className="font-display text-ink-label text-eyebrow tracking-[0.15em] uppercase">
                Hitos
              </span>
              {epilogue.milestones.map((milestone) => (
                <div key={milestone.id} className="flex flex-col gap-0.5">
                  <span className="text-body text-ink">{milestone.label}</span>
                  <span className="text-caption text-ink-secondary text-pretty">
                    {milestone.detail}
                  </span>
                </div>
              ))}
            </div>
          )}
          {epilogue.prestige === undefined ? null : (
            <RecordRow
              label="Prestige"
              value={String(epilogue.prestige)}
              last
            />
          )}

          <ArchetypeStamp archetype="Egresado" stampLine="DIC · 5.º" />
        </Milestone>

        {/* 6 · El cierre del modo. En práctica no hay puesto: el cierre es personal. */}
        <ActionSlot>
          <Button onClick={onPlayAgain} data-testid="play-again">
            Jugar de nuevo
          </Button>
          <p className="text-caption text-ink-secondary text-center text-pretty">
            {epilogue.mode === 'practice'
              ? 'Esto es una partida de práctica: el resultado es tuyo y no entra en ningún ranking.'
              : 'Tu puntaje verificado aparece más abajo. En el ranking cuenta tu mejor partida.'}
          </p>
        </ActionSlot>
      </SceneColumn>
    </GameSheet>
  )
}
