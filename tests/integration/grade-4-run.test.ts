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
  createGrade4Dependencies,
  createGrade4RunDescriptor,
  grade4ApprovedVariants,
  grade4Challenges,
} from '@/content/grade-4'
import { playGrade4 } from '../helpers/grade-4-play'

const demo = createGrade4Dependencies(true)
const partial = createGrade4Dependencies()

function descriptor(seed: string, demoMode: boolean) {
  const built = createGrade4RunDescriptor(seed, demoMode)
  if (!built.ok) throw new Error(JSON.stringify(built.error))
  return built.value
}

describe('4.º · el año corre de punta a punta', () => {
  it('cada Template del año tiene variantes aprobadas en el catálogo', () => {
    for (const template of grade4Challenges) {
      const approved = grade4ApprovedVariants.variantsFor(template.id)
      expect(approved.length, template.id).toBeGreaterThanOrEqual(8)
    }
  })

  it.each(['g4-alpha', 'g4-beta', 'g4-gamma'])(
    'demo %s: juega los cinco años, egresa y replaya idéntico',
    (seed) => {
      const built = descriptor(seed, true)
      const outcome = simulateRun(built, demo)
      expect(outcome.ok).toBe(true)
      if (!outcome.ok) return
      const { state, log } = outcome.value
      expect(state.status).toBe('completed')
      expect(state.completion?.graduated).toBe(true)
      expect(state.history.some((entry) => entry.stage === 'year-4')).toBe(true)
      const replayed = replayRun(log, demo)
      expect(replayed.ok && replayed.value.state).toEqual(state)
      const restored = restoreSnapshot(serializeSnapshot(state), built)
      expect(restored.ok && serializeSnapshot(restored.value)).toEqual(
        serializeSnapshot(state),
      )
    },
  )

  it('jugado con las respuestas del oráculo, el año llega a resultados óptimos', () => {
    const played = playGrade4(descriptor('g4-optimal', true), demo)
    expect(played.state.completion?.graduated).toBe(true)
    const yearThree = played.state.history.filter(
      (entry) => entry.stage === 'year-4' && entry.quality !== undefined,
    )
    expect(yearThree.length).toBeGreaterThanOrEqual(5)
    expect(yearThree.every((entry) => entry.quality === 'optimal')).toBe(true)
    // Y nada quedó debiendo, así que el año no abre ningún Repaso.
    expect(played.state.progression.pending).toEqual([])
  })

  it('la composición parcial cubre las cinco etapas con diez beats ordinarios', () => {
    const built = descriptor('g4-composed', false)
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
      'year-4',
    ])
    expect(state.plan?.stages.flatMap((stage) => stage.beats).length).toBe(10)
  })

  it('el servidor recalcula la run de 4.º y descarta lo que el cliente afirme', () => {
    const built = descriptor('g4-server', true)
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

  it('una clasificación inventada no pasa el servidor: la respuesta viaja en el log', () => {
    const built = descriptor('g4-route-tamper', true)
    const outcome = simulateRun(built, demo)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const encoded = actionLogSchema.parse(serializeActionLog(outcome.value.log))
    const tampered = encoded.actions.map((action) =>
      action.command.type === 'ANSWER' &&
      action.command.answer.kind === 'classification'
        ? {
            ...action,
            command: {
              ...action.command,
              answer: {
                kind: 'classification' as const,
                entries: [{ statementId: 'inventada', labelId: 'entra' }],
              },
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

  it(
    'LOCKED · el cluster del evento escolar aporta como máximo una Template puntuable',
    { timeout: 60_000 },
    () => {
      const members = new Set([
        'y4.school-event-flow',
        'y4.shift-coverage',
        'y4.event-floor-plan',
      ])
      let composed = 0
      for (let seed = 0; seed < 24; seed++) {
        const built = createGrade4RunDescriptor(`cluster-${String(seed)}`)
        if (!built.ok) continue
        composed += 1
        const outcome = simulateRun(built.value, partial)
        expect(outcome.ok).toBe(true)
        if (!outcome.ok) continue
        const fromCluster = (outcome.value.state.plan?.stages ?? [])
          .flatMap((stage) => stage.beats)
          .filter((beat) => members.has(String(beat.variant.templateId)))
        expect(fromCluster.length).toBeLessThanOrEqual(1)
      }
      expect(composed).toBeGreaterThan(18)
    },
  )

  it(
    'la oportunidad especial nunca agrega un beat ni techo de FairScore',
    { timeout: 60_000 },
    () => {
      // Cuando `represent-class` entra, ocupa uno de los dos beats del año: la
      // cantidad de beats ordinarios no se mueve.
      let withSpecial = 0
      for (let seed = 0; seed < 24; seed++) {
        const built = createGrade4RunDescriptor(`special-${String(seed)}`)
        if (!built.ok) continue
        const outcome = simulateRun(built.value, partial)
        expect(outcome.ok).toBe(true)
        if (!outcome.ok) continue
        const beats = (outcome.value.state.plan?.stages ?? []).flatMap(
          (stage) => stage.beats,
        )
        expect(beats.length).toBe(10)
        if (
          beats.some(
            (beat) => String(beat.variant.templateId) === 'y4.represent-class',
          )
        )
          withSpecial += 1
      }
      expect(withSpecial).toBeGreaterThan(0)
    },
  )

  it('un año con todo mal cierra igual, con un solo Repaso por etapa', () => {
    for (const seed of ['g4-hard-1', 'g4-hard-2']) {
      const outcome = simulateRun(descriptor(seed, true), demo)
      expect(outcome.ok).toBe(true)
      if (!outcome.ok) continue
      const { state } = outcome.value
      expect(state.completion?.graduated).toBe(true)
      expect(state.progression.pending).toEqual([])
      for (const stage of ['grade-7', 'year-1', 'year-2', 'year-3', 'year-4'])
        expect(
          state.progression.history.filter((entry) => entry.stageId === stage)
            .length,
        ).toBeLessThanOrEqual(1)
    }
  })

  it('el Repaso de 4.º se juega, cierra la obligación y no suma puntaje', () => {
    const played = playGrade4(descriptor('g4-recovery', true), demo, (id) =>
      id === 'y4.course-project-fundraiser' || id === 'y4.event-floor-plan'
        ? 'invalid'
        : 'optimal',
    )
    const reviews = played.state.history.filter(
      (entry) => entry.stage === 'year-4' && entry.recovery === true,
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
      (entry) => entry.stageId === 'year-4',
    )
    expect(record?.resolved.length).toBeGreaterThanOrEqual(1)
    expect(record?.content?.templateId).toMatch(/^y4\./u)
  })
})
