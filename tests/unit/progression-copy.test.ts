import { describe, expect, it } from 'vitest'

import {
  activeChallengeView,
  createRun,
  transition,
  type GameCommand,
  type RunState,
  type SolutionQuality,
} from '@/game'
import {
  createFullCareerDependencies,
  createFullCareerRunDescriptor,
} from '@/content/full-career'
import {
  completesYear,
  continueIntent,
  continueLabel,
  yearMilestoneCopy,
  type ContinueIntent,
} from '@/components/game/progression-copy'
import { stageNumeral } from '@/components/game/stage-label'
import { grade5Answer } from '../helpers/grade-5-play'

/**
 * La intención del botón se compara contra lo que el motor hace de verdad.
 *
 * Para cada pantalla de una carrera real se calcula la intención, se aplica el
 * `CONTINUE` y se mira qué pasó: si la etapa cambió, si se abrió un Repaso, si
 * la run terminó. Una predicción que no coincida con el motor es un botón que
 * miente, y eso es lo que este test existe para impedir.
 */
function playCareer(
  seed: string,
  quality: (templateId: string) => SolutionQuality,
): readonly { before: RunState; after: RunState; intent: ContinueIntent }[] {
  const dependencies = createFullCareerDependencies()
  const built = createFullCareerRunDescriptor(seed)
  if (!built.ok) throw new Error('descriptor failed')
  const created = createRun(built.value, dependencies)
  if (!created.ok) throw new Error('create failed')

  let state = created.value.state
  const steps: { before: RunState; after: RunState; intent: ContinueIntent }[] =
    []

  for (let step = 0; step < 240 && state.status === 'active'; step += 1) {
    let command: GameCommand = { type: 'CONTINUE' }
    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, dependencies)
      if (!view.ok || view.value === undefined) throw new Error('no view')
      let answer
      try {
        answer = grade5Answer(
          view.value,
          dependencies,
          quality(view.value.ref.templateId),
          built.value,
        )
      } catch {
        answer = grade5Answer(view.value, dependencies, 'optimal', built.value)
      }
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer,
      }
    }
    const before = state
    const intent = continueIntent(before, dependencies.ruleset)
    const next = transition(state, command, dependencies)
    if (!next.ok) throw new Error(JSON.stringify(next.error))
    state = next.value.state
    if (command.type === 'CONTINUE')
      steps.push({ before, after: state, intent })
  }
  if (state.status !== 'completed') throw new Error('career did not finish')
  return steps
}

const routed = new Set(
  Object.entries(createFullCareerDependencies().recoveryContent?.reviews ?? {})
    .filter(([, reviews]) => reviews.length > 0)
    .map(([templateId]) => templateId),
)

describe('la intención de seguir', () => {
  for (const [seed, quality] of [
    ['copy-intent-optimal', () => 'optimal' as const],
    [
      'copy-intent-repaso',
      (id: string) => (routed.has(id) ? 'invalid' : 'optimal'),
    ],
  ] as const) {
    it(`coincide con lo que el motor hace en cada pantalla (${seed})`, () => {
      const steps = playCareer(seed, quality)
      expect(steps.length).toBeGreaterThan(10)

      for (const { before, after, intent } of steps) {
        const changedStage = after.stage !== before.stage
        const finished = after.status === 'completed'
        const openedReview =
          !changedStage && !finished && after.activeEvent?.recovery === true

        switch (intent.kind) {
          case 'next-year':
            expect(changedStage).toBe(true)
            expect(after.stage).toBe(intent.next)
            expect(intent.completed).toBe(before.stage)
            break
          case 'finish':
            expect(finished).toBe(true)
            expect(intent.completed).toBe('year-5')
            break
          case 'review':
            expect(openedReview).toBe(true)
            expect(intent.stage).toBe(before.stage)
            break
          case 'start-year':
            expect(before.phase).toBe('narrative')
            expect(before.stageEventIndex).toBe(0)
            expect(changedStage || finished || openedReview).toBe(false)
            break
          case 'next-event':
            expect(changedStage || finished || openedReview).toBe(false)
            break
        }
      }
    })
  }

  it('cada año abre con «Empezar» y cierra una sola vez', () => {
    const steps = playCareer('copy-intent-optimal', () => 'optimal')
    const starts = steps.filter((step) => step.intent.kind === 'start-year')
    const closes = steps.filter((step) => completesYear(step.intent))
    expect(
      starts.map(
        (step) => step.intent.kind === 'start-year' && step.intent.stage,
      ),
    ).toEqual(['grade-7', 'year-1', 'year-2', 'year-3', 'year-4', 'year-5'])
    expect(closes).toHaveLength(6)
    expect(closes.at(-1)?.intent.kind).toBe('finish')
  })

  it('una carrera con Repasos entra al Repaso y después pasa de año', () => {
    const steps = playCareer('copy-intent-repaso', (id) =>
      routed.has(id) ? 'invalid' : 'optimal',
    )
    const reviews = steps.filter((step) => step.intent.kind === 'review')
    expect(reviews.length).toBeGreaterThan(0)
    for (const review of reviews) {
      // El Repaso nunca es el último paso: después de cerrarlo el año sigue a
      // la etapa siguiente o al egreso, y ese paso lleva el hito.
      const index = steps.indexOf(review)
      const exit = steps
        .slice(index + 1)
        .find((step) => step.before.stage === review.before.stage)
      expect(exit).toBeDefined()
      expect(completesYear(exit!.intent)).toBe(true)
      if (exit !== undefined && completesYear(exit.intent)) {
        expect(yearMilestoneCopy(exit.before, exit.intent).line).toContain(
          'lo cerraste igual',
        )
      }
    }
  })
})

describe('las palabras del botón', () => {
  it('nombran la consecuencia cuando importa y siguen siendo «Seguir» cuando no', () => {
    expect(continueLabel({ kind: 'next-event' })).toBe('Seguir')
    expect(continueLabel({ kind: 'start-year', stage: 'grade-7' })).toBe(
      'Empezar 7.º',
    )
    expect(continueLabel({ kind: 'review', stage: 'year-1' })).toBe(
      'Ir al Repaso',
    )
    expect(
      continueLabel({
        kind: 'next-year',
        completed: 'grade-7',
        next: 'year-1',
      }),
    ).toBe('Pasar a 1.º')
    expect(
      continueLabel({ kind: 'next-year', completed: 'year-4', next: 'year-5' }),
    ).toBe('Pasar a 5.º')
    expect(continueLabel({ kind: 'finish', completed: 'year-5' })).toBe(
      'Ver mi egreso',
    )
    // Un ruleset de desarrollo que termina antes no promete un egreso.
    expect(continueLabel({ kind: 'finish', completed: 'grade-7' })).toBe(
      'Cerrar 7.º',
    )
  })

  it('el numeral es el del año, sin la palabra', () => {
    expect(stageNumeral('grade-7')).toBe('7.º')
    expect(stageNumeral('year-3')).toBe('3.º')
    expect(stageNumeral('graduation')).toBe('Egreso')
  })
})

describe('el hito de cierre de año', () => {
  it('es determinista y distingue el último año', () => {
    const steps = playCareer('copy-intent-optimal', () => 'optimal')
    const closes = steps.filter((step) => completesYear(step.intent))
    const copies = closes.map((step) =>
      completesYear(step.intent)
        ? yearMilestoneCopy(step.before, step.intent)
        : undefined,
    )
    expect(copies.map((copy) => copy?.numeral)).toEqual([
      '7.º',
      '1.º',
      '2.º',
      '3.º',
      '4.º',
      '5.º',
    ])
    expect(copies.slice(0, 5).every((copy) => copy?.final === false)).toBe(true)
    expect(copies.at(-1)?.final).toBe(true)
    expect(copies.at(-1)?.eyebrow).toBe('Fin de la secundaria')
    // Todo óptimo: la línea lo dice, sin un puntaje ni una dimensión nueva.
    for (const copy of copies) expect(copy?.line).toContain('Todo salió')
    // Misma carrera, mismas palabras.
    const again = playCareer('copy-intent-optimal', () => 'optimal')
      .filter((step) => completesYear(step.intent))
      .map((step) =>
        completesYear(step.intent)
          ? yearMilestoneCopy(step.before, step.intent).line
          : '',
      )
    expect(again).toEqual(copies.map((copy) => copy?.line))
  })
})
