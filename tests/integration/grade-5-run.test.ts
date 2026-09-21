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
  createGrade5Dependencies,
  createGrade5RunDescriptor,
  grade5ApprovedVariants,
  grade5Challenges,
} from '@/content/grade-5'
import { playGrade5 } from '../helpers/grade-5-play'

const demo = createGrade5Dependencies(true)
const partial = createGrade5Dependencies()

function descriptor(seed: string, demoMode: boolean) {
  const built = createGrade5RunDescriptor(seed, demoMode)
  if (!built.ok) throw new Error(JSON.stringify(built.error))
  return built.value
}

describe('5.º · el año corre de punta a punta', () => {
  it('cada Template del año tiene variantes aprobadas en el catálogo', () => {
    for (const template of grade5Challenges) {
      const approved = grade5ApprovedVariants.variantsFor(template.id)
      expect(approved.length, template.id).toBeGreaterThanOrEqual(8)
    }
  }, 30_000)

  it.each(['g5-alpha', 'g5-beta', 'g5-gamma'])(
    'demo %s: juega los seis años, egresa y replaya idéntico',
    (seed) => {
      const built = descriptor(seed, true)
      const outcome = simulateRun(built, demo)
      expect(outcome.ok).toBe(true)
      if (!outcome.ok) return
      const { state, log } = outcome.value
      expect(state.status).toBe('completed')
      expect(state.completion?.graduated).toBe(true)
      expect(state.history.some((entry) => entry.stage === 'year-5')).toBe(true)
      const replayed = replayRun(log, demo)
      expect(replayed.ok && replayed.value.state).toEqual(state)
      const restored = restoreSnapshot(serializeSnapshot(state), built)
      expect(restored.ok && serializeSnapshot(restored.value)).toEqual(
        serializeSnapshot(state),
      )
    },
  )

  it('jugado con las respuestas del oráculo, el año llega a resultados óptimos', () => {
    const played = playGrade5(descriptor('g5-optimal', true), demo)
    expect(played.state.completion?.graduated).toBe(true)
    const yearThree = played.state.history.filter(
      (entry) => entry.stage === 'year-5' && entry.quality !== undefined,
    )
    expect(yearThree.length).toBeGreaterThanOrEqual(5)
    expect(yearThree.every((entry) => entry.quality === 'optimal')).toBe(true)
    // Y nada quedó debiendo, así que el año no abre ningún Repaso.
    expect(played.state.progression.pending).toEqual([])
  }, 30_000)

  it('la carrera de seis años compone doce beats ordinarios', () => {
    const built = descriptor('g5-composed', false)
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
      'year-5',
    ])
    expect(state.plan?.stages.flatMap((stage) => stage.beats).length).toBe(12)
  }, 30_000)

  it('el servidor recalcula la run de 5.º y descarta lo que el cliente afirme', () => {
    const built = descriptor('g5-server', true)
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
  }, 30_000)

  it('una clasificación inventada no pasa el servidor: la respuesta viaja en el log', () => {
    const built = descriptor('g5-route-tamper', true)
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
  }, 30_000)

  it(
    'LOCKED · el cluster del evento escolar aporta como máximo una Template puntuable',
    { timeout: 60_000 },
    () => {
      const members = new Set([
        'y5.school-event-flow',
        'y5.shift-coverage',
        'y5.event-floor-plan',
      ])
      let composed = 0
      for (let seed = 0; seed < 24; seed++) {
        const built = createGrade5RunDescriptor(`cluster-${String(seed)}`)
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
        const built = createGrade5RunDescriptor(`special-${String(seed)}`)
        if (!built.ok) continue
        const outcome = simulateRun(built.value, partial)
        expect(outcome.ok).toBe(true)
        if (!outcome.ok) continue
        const beats = (outcome.value.state.plan?.stages ?? []).flatMap(
          (stage) => stage.beats,
        )
        expect(beats.length).toBe(12)
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
    for (const seed of ['g5-hard-1', 'g5-hard-2']) {
      const outcome = simulateRun(descriptor(seed, true), demo)
      expect(outcome.ok).toBe(true)
      if (!outcome.ok) continue
      const { state } = outcome.value
      expect(state.completion?.graduated).toBe(true)
      expect(state.progression.pending).toEqual([])
      for (const stage of [
        'grade-7',
        'year-1',
        'year-2',
        'year-3',
        'year-4',
        'year-5',
      ])
        expect(
          state.progression.history.filter((entry) => entry.stageId === stage)
            .length,
        ).toBeLessThanOrEqual(1)
    }
  }, 30_000)

  it('el Repaso de 5.º se juega, cierra la obligación y no suma puntaje', () => {
    const played = playGrade5(descriptor('g5-recovery', true), demo, (id) =>
      id === 'y5.final-trip-or-event' || id === 'y5.yearbook'
        ? 'invalid'
        : 'optimal',
    )
    const reviews = played.state.history.filter(
      (entry) => entry.stage === 'year-5' && entry.recovery === true,
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
      (entry) => entry.stageId === 'year-5',
    )
    expect(record?.resolved.length).toBeGreaterThanOrEqual(1)
    expect(record?.content?.templateId).toMatch(/^y5\./u)
  }, 30_000)
})
