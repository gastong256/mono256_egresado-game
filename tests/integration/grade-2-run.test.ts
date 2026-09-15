import { describe, expect, it } from 'vitest'
import {
  replayRun,
  restoreSnapshot,
  serializeActionLog,
  serializeSnapshot,
} from '@/game'
import { validateSubmittedRun } from '@/server/game/validate-run'
import { actionLogSchema } from '@/game/runs/action-log'
import { simulateRun } from '@/game/testing'
import {
  createGrade2Dependencies,
  createGrade2RunDescriptor,
  grade2ApprovedVariants,
  grade2Challenges,
} from '@/content/grade-2'

const demo = createGrade2Dependencies(true)
const partial = createGrade2Dependencies()

function descriptor(seed: string, demoMode: boolean) {
  const built = createGrade2RunDescriptor(seed, demoMode)
  if (!built.ok) throw new Error(JSON.stringify(built.error))
  return built.value
}

describe('2.º · el año corre de punta a punta', () => {
  it('cada Template del año tiene variantes aprobadas en el catálogo', () => {
    for (const template of grade2Challenges) {
      const approved = grade2ApprovedVariants.variantsFor(template.id)
      expect(approved.length, template.id).toBeGreaterThanOrEqual(8)
    }
  })

  it.each(['g2-alpha', 'g2-beta', 'g2-gamma'])(
    'demo %s: juega los tres años, egresa y replaya idéntico',
    (seed) => {
      const built = descriptor(seed, true)
      const outcome = simulateRun(built, demo)
      expect(outcome.ok).toBe(true)
      if (!outcome.ok) return
      const { state, log } = outcome.value
      expect(state.status).toBe('completed')
      expect(state.completion?.graduated).toBe(true)
      expect(state.history.some((entry) => entry.stage === 'year-2')).toBe(true)
      const replayed = replayRun(log, demo)
      expect(replayed.ok && replayed.value.state).toEqual(state)
      const restored = restoreSnapshot(serializeSnapshot(state), built)
      expect(restored.ok && serializeSnapshot(restored.value)).toEqual(
        serializeSnapshot(state),
      )
    },
  )

  it('la composición parcial cubre las tres etapas con seis beats ordinarios', () => {
    const built = descriptor('g2-composed', false)
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
    ])
    expect(state.plan?.stages.flatMap((stage) => stage.beats).length).toBe(6)
  })

  it('el servidor recalcula la run de 2.º y descarta lo que el cliente afirme', () => {
    const built = descriptor('g2-server', true)
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

  it('LOCKED · el cluster Intercurso aporta como máximo una Template puntuable', () => {
    const members = new Set([
      'y2.intercurso-plan',
      'y2.standings-claim',
      'y2.court-zones',
    ])
    let composed = 0
    for (let seed = 0; seed < 60; seed++) {
      const built = createGrade2RunDescriptor(`cluster-${String(seed)}`)
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
    expect(composed).toBeGreaterThan(50)
  })

  it('un año con todo mal cierra igual, con un solo Repaso por etapa', () => {
    for (const seed of ['g2-hard-1', 'g2-hard-2']) {
      const outcome = simulateRun(descriptor(seed, true), demo)
      expect(outcome.ok).toBe(true)
      if (!outcome.ok) continue
      const { state } = outcome.value
      expect(state.completion?.graduated).toBe(true)
      expect(state.progression.pending).toEqual([])
      for (const stage of ['grade-7', 'year-1', 'year-2'])
        expect(
          state.progression.history.filter((entry) => entry.stageId === stage)
            .length,
        ).toBeLessThanOrEqual(1)
    }
  })
})
