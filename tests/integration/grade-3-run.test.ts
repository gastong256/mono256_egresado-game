import { describe, expect, it } from 'vitest'
import {
  candidateFairScorePolicy,
  isOk,
  replayRun,
  scoreRun,
  scoredEventsOf,
  restoreSnapshot,
  serializeActionLog,
  serializeSnapshot,
} from '@/game'
import { validateSubmittedRun } from '@/server/game/validate-run'
import { actionLogSchema } from '@/game/runs/action-log'
import { simulateRun } from '@/game/testing'
import {
  createGrade3Dependencies,
  createGrade3RunDescriptor,
  grade3ApprovedVariants,
  grade3Challenges,
} from '@/content/grade-3'
import { playGrade3 } from '../helpers/grade-3-play'

const demo = createGrade3Dependencies(true)
const partial = createGrade3Dependencies()

function descriptor(seed: string, demoMode: boolean) {
  const built = createGrade3RunDescriptor(seed, demoMode)
  if (!built.ok) throw new Error(JSON.stringify(built.error))
  return built.value
}

describe('3.º · el año corre de punta a punta', () => {
  it('cada Template del año tiene variantes aprobadas en el catálogo', () => {
    for (const template of grade3Challenges) {
      const approved = grade3ApprovedVariants.variantsFor(template.id)
      expect(approved.length, template.id).toBeGreaterThanOrEqual(8)
    }
  })

  it.each(['g3-alpha', 'g3-beta', 'g3-gamma'])(
    'demo %s: juega los cuatro años, egresa y replaya idéntico',
    (seed) => {
      const built = descriptor(seed, true)
      const outcome = simulateRun(built, demo)
      expect(outcome.ok).toBe(true)
      if (!outcome.ok) return
      const { state, log } = outcome.value
      expect(state.status).toBe('completed')
      expect(state.completion?.graduated).toBe(true)
      expect(state.history.some((entry) => entry.stage === 'year-3')).toBe(true)
      const replayed = replayRun(log, demo)
      expect(replayed.ok && replayed.value.state).toEqual(state)
      const restored = restoreSnapshot(serializeSnapshot(state), built)
      expect(restored.ok && serializeSnapshot(restored.value)).toEqual(
        serializeSnapshot(state),
      )
    },
  )

  it('jugado con las respuestas del oráculo, el año llega a resultados óptimos', () => {
    const played = playGrade3(descriptor('g3-optimal', true), demo)
    expect(played.state.completion?.graduated).toBe(true)
    const yearThree = played.state.history.filter(
      (entry) => entry.stage === 'year-3' && entry.quality !== undefined,
    )
    expect(yearThree.length).toBeGreaterThanOrEqual(5)
    expect(yearThree.every((entry) => entry.quality === 'optimal')).toBe(true)
    // Y nada quedó debiendo, así que el año no abre ningún Repaso.
    expect(played.state.progression.pending).toEqual([])
  })

  it('la composición parcial cubre las cuatro etapas con ocho beats ordinarios', () => {
    const built = descriptor('g3-composed', false)
    expect(built.planFingerprint).toBeDefined()
    const outcome = simulateRun(built, partial)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const { state } = outcome.value
    expect(state.completion?.graduated).toBe(true)
    expect(state.plan?.stages.map((stage) => stage.stageId)).toEqual([
      'grade-7',
      'year-1',
      'year-2',
      'year-3',
    ])
    expect(state.plan?.stages.flatMap((stage) => stage.beats).length).toBe(8)
  })

  it('el servidor recalcula la run de 3.º y descarta lo que el cliente afirme', () => {
    const built = descriptor('g3-server', true)
    const outcome = simulateRun(built, demo)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const encoded = actionLogSchema.parse(serializeActionLog(outcome.value.log))
    const good = validateSubmittedRun(encoded, demo)
    expect(good.ok).toBe(true)
    // Valores inflados por el cliente: mismo resultado que la submission legítima.
    expect(
      validateSubmittedRun(
        {
          ...encoded,
          score: 999999,
          quality: 'optimal',
          graduated: false,
          aura: 99999,
        },
        demo,
      ),
    ).toEqual(good)
    for (const field of [
      'gameVersion',
      'contentVersion',
      'variantCatalogVersion',
    ])
      expect(
        validateSubmittedRun(
          {
            ...encoded,
            descriptor: { ...encoded.descriptor, [field]: 'forjado' },
          },
          demo,
        ).ok,
      ).toBe(false)
    expect(
      validateSubmittedRun(
        { ...encoded, actions: encoded.actions.slice(0, -1) },
        demo,
      ).ok,
    ).toBe(false)
  })

  it('un recorrido inventado no pasa el servidor: el orden viaja en el log', () => {
    const built = descriptor('g3-route-tamper', true)
    const outcome = simulateRun(built, demo)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const encoded = actionLogSchema.parse(serializeActionLog(outcome.value.log))
    const tampered = encoded.actions.map((action) =>
      action.command.type === 'ANSWER' &&
      action.command.answer.kind === 'route-builder'
        ? {
            ...action,
            command: {
              ...action.command,
              answer: { kind: 'route-builder' as const, stops: ['inventada'] },
            },
          }
        : action,
    )
    const changed = tampered.some(
      (action, index) => action !== encoded.actions[index],
    )
    if (!changed) return
    expect(
      validateSubmittedRun({ ...encoded, actions: tampered }, demo).ok,
    ).toBe(false)
  })

  it('un año con todo mal cierra igual, con un solo Repaso por etapa', () => {
    for (const seed of ['g3-hard-1', 'g3-hard-2']) {
      const outcome = simulateRun(descriptor(seed, true), demo)
      expect(outcome.ok).toBe(true)
      if (!outcome.ok) continue
      const { state } = outcome.value
      expect(state.completion?.graduated).toBe(true)
      expect(state.progression.pending).toEqual([])
      for (const stage of ['grade-7', 'year-1', 'year-2', 'year-3'])
        expect(
          state.progression.history.filter((entry) => entry.stageId === stage)
            .length,
        ).toBeLessThanOrEqual(1)
    }
  })

  it('el Repaso de 3.º se juega, cierra la obligación y no suma puntaje', () => {
    const played = playGrade3(descriptor('g3-recovery', true), demo, (id) =>
      id === 'y3.course-project-tech' || id === 'y3.transport-pass'
        ? 'invalid'
        : 'optimal',
    )
    const reviews = played.state.history.filter(
      (entry) => entry.stage === 'year-3' && entry.recovery === true,
    )
    expect(reviews.length).toBe(1)
    // El Repaso se juega y no es evidencia competitiva: FairScore cuenta los
    // beats ordinarios y deja el de recuperación afuera.
    const scored = scoreRun(
      scoredEventsOf(played.state.history),
      demo.catalog,
      candidateFairScorePolicy,
    )
    if (!isOk(scored)) throw new Error('no puntuó')
    expect(scored.value.scoredBeats).toBe(
      played.state.history.filter(
        (entry) => entry.challengeId !== undefined && entry.recovery !== true,
      ).length,
    )
    expect(played.state.completion?.graduated).toBe(true)
    expect(played.state.progression.pending).toEqual([])
    const record = played.state.progression.history.find(
      (entry) => entry.stageId === 'year-3',
    )
    expect(record?.resolved.length).toBeGreaterThanOrEqual(1)
    expect(record?.content?.templateId).toMatch(/^y3\./u)
  })
})
