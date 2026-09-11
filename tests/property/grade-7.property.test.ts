import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  activeChallengeView,
  createRun,
  isOk,
  transition,
  type GameCommand,
  type RunDescriptor,
} from '@/game'
import { materializeEveryVariant } from '@/game/testing'
import {
  createGrade7Dependencies,
  createGrade7RunDescriptor,
  grade7Challenges,
  grade7StoryletIds,
} from '@/content/grade-7'
import {
  createSeedValue,
  normalizeNickname,
  validateNickname,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
} from '@/components/game/session'

/**
 * Invariantes del contenido de 7.º grado.
 *
 * No comprueban que una respuesta concreta esté bien —eso lo hacen los tests de
 * contenido— sino que ninguna seed pueda producir una situación injugable.
 */

const dependencies = createGrade7Dependencies()

const arbSeed = fc
  .string({ minLength: 1, maxLength: 16, unit: 'grapheme-ascii' })
  .map((value) => value.replace(/[^a-z0-9-]/gu, 'x'))
  .filter((value) => value.length > 0)

function descriptorFor(seed: string): RunDescriptor {
  return createGrade7RunDescriptor(seed)
}

describe('toda seed produce un año jugable', () => {
  it('genera instancias que cumplen sus propias invariantes', () => {
    fc.assert(
      fc.property(
        arbSeed,
        fc.nat({ max: grade7Challenges.length - 1 }),
        (seed, index) => {
          const definition = grade7Challenges[index]
          if (definition === undefined) return

          // Cada variante autorada tiene que cumplir sus invariantes, no sólo
          // la que un seed cualquiera elija.
          for (const instance of materializeEveryVariant(definition, seed)) {
            expect(instance.verify()).toEqual([])
          }
        },
      ),
    )
  })

  it('siempre ofrece al menos una salida que llega a horario', () => {
    fc.assert(
      fc.property(arbSeed, (seed) => {
        const definition = grade7Challenges.find(
          (candidate) => candidate.id === 'g7.bus-timing',
        )
        if (definition === undefined) return

        for (const instance of materializeEveryVariant(definition, seed)) {
          const view = instance.present([])
          if (view.kind !== 'timeline') return

          // Alguna opción tiene que resolver el problema, y alguna tiene que
          // fallar: si no, la decisión no existiría.
          const qualities = view.options.map((option) => {
            const result = instance.evaluate(
              { kind: 'timeline', optionId: option.id },
              [],
            )
            return result.ok ? result.value.quality : 'invalid'
          })

          expect(qualities).toContain('optimal')
          expect(qualities.some((quality) => quality === 'invalid')).toBe(true)
        }
      }),
    )
  })

  it('siempre ofrece un envase de pintura que alcanza y uno que no', () => {
    fc.assert(
      fc.property(arbSeed, (seed) => {
        const definition = grade7Challenges.find(
          (candidate) => candidate.id === 'g7.mural-paint',
        )
        if (definition === undefined) return

        for (const instance of materializeEveryVariant(definition, seed)) {
          const view = instance.present([])
          if (view.kind !== 'decision-card') return

          const qualities = view.options.map((option) => {
            const result = instance.evaluate(
              { kind: 'decision-card', optionId: option.id },
              [],
            )
            return result.ok ? result.value.quality : 'invalid'
          })

          expect(qualities).toContain('optimal')
          expect(qualities).toContain('invalid')
        }
      }),
    )
  })

  it('completa el año entero eligiendo siempre la primera opción', () => {
    fc.assert(
      fc.property(arbSeed, (seed) => {
        const created = createRun(descriptorFor(seed), dependencies)
        if (!created.ok) throw new Error('no se pudo crear la run')

        let state = created.value.state

        for (let step = 0; step < 40 && state.status === 'active'; step += 1) {
          let command: GameCommand = { type: 'CONTINUE' }

          if (state.phase === 'challenge') {
            const view = activeChallengeView(state, dependencies)
            if (!view.ok || view.value === undefined) {
              throw new Error('sin vista activa')
            }
            const interaction = view.value.interaction
            const answer =
              interaction.kind === 'number-grid'
                ? {
                    kind: 'number-grid' as const,
                    // Marca la grilla entera: es la respuesta estructuralmente
                    // válida más extrema, y el año tiene que terminar igual.
                    rounds: interaction.rounds.map((round) => ({
                      roundId: round.id,
                      numbers: [...round.numbers],
                    })),
                  }
                : interaction.kind === 'assignment-board'
                  ? {
                      kind: 'assignment-board' as const,
                      assignments: interaction.tasks.flatMap((task, index) => {
                        const agent = interaction.agents[index]
                        return agent === undefined
                          ? []
                          : [{ agentId: agent.id, taskId: task.id }]
                      }),
                    }
                  : interaction.kind === 'budget-builder' ||
                      interaction.kind === 'quantity-builder'
                    ? {
                        kind: interaction.kind,
                        lines: interaction.items.map((item) => ({
                          itemId: item.id,
                          quantity: 2,
                        })),
                      }
                    : interaction.kind === 'schedule-builder' ||
                        interaction.kind === 'spatial-layout'
                      ? { kind: interaction.kind, placements: [] }
                      : interaction.kind === 'numeric-input'
                        ? {
                            kind: 'numeric-input' as const,
                            value: interaction.min,
                          }
                        : {
                            kind: interaction.kind,
                            optionId: interaction.options[0]?.id ?? '',
                          }

            command = {
              type: 'ANSWER',
              instanceId: view.value.ref.instanceId,
              answer: answer as never,
            }
          }

          const result = transition(state, command, dependencies)
          if (!result.ok) throw new Error(`rechazado: ${result.error.kind}`)
          state = result.value.state
        }

        // Ninguna seed puede dejar el año sin terminar.
        expect(state.status).toBe('completed')
        expect(
          state.history.filter((entry) => entry.recovery !== true),
        ).toHaveLength(8)
        expect(state.seenStorylets).toContain(grade7StoryletIds.fairStand)
      }),
      { numRuns: 40 },
    )
  })
})

describe('el nickname', () => {
  it('acepta lo que un jugador escribiría de verdad', () => {
    for (const name of ['Sofi', 'Juan Cruz', 'Ana-María', 'Ñoño', 'Zoe 7']) {
      expect(validateNickname(name)).toBeUndefined()
    }
  })

  it('rechaza lo vacío, lo corto, lo largo y los caracteres de control', () => {
    expect(validateNickname('')).toBe('vacio')
    expect(validateNickname('   ')).toBe('vacio')
    expect(validateNickname('a')).toBe('muy-corto')
    expect(validateNickname('x'.repeat(NICKNAME_MAX_LENGTH + 1))).toBe(
      'muy-largo',
    )
    // Un caracter de control no se ve y no aporta nada: se rechaza.
    expect(validateNickname('So\u0000fi')).toBe('caracteres-invalidos')
    expect(validateNickname('So\u0001fi')).toBe('caracteres-invalidos')
  })

  it('normaliza el espacio en blanco en lugar de rechazarlo', () => {
    // Un tab pegado desde otro lado no deberia frustrar al jugador: se
    // convierte en un espacio comun y el nombre sigue siendo valido.
    expect(normalizeNickname('So\tfi')).toBe('So fi')
    expect(validateNickname('So\tfi')).toBeUndefined()
    expect(validateNickname('  Sofi  ')).toBeUndefined()
  })

  it('normaliza espacios sin cambiar el nombre', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), (raw) => {
        const value = normalizeNickname(raw)
        expect(value).toBe(value.trim())
        expect(value).not.toMatch(/\s{2}/u)
      }),
    )
  })

  it('un nombre válido sigue siendo válido después de normalizarlo', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 24, unit: 'grapheme-ascii' })
          .map((value) => value.replace(/[^A-Za-z0-9 -]/gu, 'a')),
        (raw) => {
          if (validateNickname(raw) !== undefined) return
          expect(validateNickname(normalizeNickname(raw))).toBeUndefined()
          expect(normalizeNickname(raw).length).toBeGreaterThanOrEqual(
            NICKNAME_MIN_LENGTH,
          )
        },
      ),
    )
  })
})

describe('el seed de una run nueva', () => {
  it('sale del charset que el motor acepta y no se repite', () => {
    const seeds = new Set<string>()

    for (let index = 0; index < 200; index += 1) {
      const seed = createSeedValue()
      expect(seed).toMatch(/^[a-z0-9]{10}$/u)
      seeds.add(seed)
    }

    // La entropía vive fuera del motor; si se repitiera, dos jugadores
    // distintos verían exactamente la misma partida.
    expect(seeds.size).toBeGreaterThan(190)
  })

  it('produce una run válida para cualquier seed generada', () => {
    for (let index = 0; index < 20; index += 1) {
      const created = createRun(descriptorFor(createSeedValue()), dependencies)
      expect(isOk(created)).toBe(true)
    }
  })
})
