import { describe, expect, it } from 'vitest'
import {
  bandOf,
  candidateFairScorePolicy,
  composeRun,
  isOk,
  replayRun,
  restoreSnapshot,
  scoreRun,
  scoredEventsOf,
  SCORE_SCALE,
  serializeActionLog,
  serializeSnapshot,
  toRunSeed,
  validateComposedPlan,
} from '@/game'
import { validateSubmittedRun } from '@/server/game/validate-run'
import { actionLogSchema } from '@/game/runs/action-log'
import { simulateRun } from '@/game/testing'
import {
  closeCareer,
  createFullCareerDependencies,
  createFullCareerRunDescriptor,
  fullCareerCompositionPolicy,
} from '@/content/full-career'
import { grade5ApprovedVariants } from '@/content/grade-5'
import { playGrade5 } from '../helpers/grade-5-play'

const deps = createFullCareerDependencies()
const STAGES = deps.ruleset.stages.map((stage) => stage.id)

function compose(seed: string) {
  return composeRun({
    seed: toRunSeed(seed),
    stages: STAGES,
    catalog: deps.catalog,
    approvedVariants: grade5ApprovedVariants,
    policy: fullCareerCompositionPolicy,
  })
}

function descriptor(seed: string) {
  const built = createFullCareerRunDescriptor(seed)
  if (!built.ok) throw new Error(JSON.stringify(built.error))
  return built.value
}

describe('la carrera completa con el contenido real', () => {
  it('compone nueve beats ordinarios en los seis años, con un anchor por año', () => {
    const composed = compose('career-shape')
    expect(composed.ok).toBe(true)
    if (!composed.ok) return
    const beats = composed.value.stages.flatMap((stage) => stage.beats)
    expect(beats).toHaveLength(9)
    expect(composed.value.stages.map((stage) => stage.stageId)).toEqual(STAGES)
    for (const stage of composed.value.stages) {
      expect(stage.beats.filter((beat) => beat.role === 'anchor')).toHaveLength(
        1,
      )
      expect(stage.beats.length).toBeGreaterThanOrEqual(1)
      expect(stage.beats.length).toBeLessThanOrEqual(2)
    }
    // Seis anchors y tres secundarias: el reparto que pide el producto.
    expect(beats.filter((beat) => beat.role === 'anchor')).toHaveLength(6)
    expect(beats.filter((beat) => beat.role !== 'anchor')).toHaveLength(3)
    expect(
      validateComposedPlan(composed.value, {
        catalog: deps.catalog,
        approvedVariants: grade5ApprovedVariants,
        policy: fullCareerCompositionPolicy,
      }),
    ).toEqual([])
  })

  it(
    'veinticuatro seeds componen veinticuatro carreras válidas, y el validador independiente las acepta',
    { timeout: 120_000 },
    () => {
      const plans = new Set<string>()
      const templates = new Set<string>()
      for (let seed = 0; seed < 24; seed++) {
        const composed = compose(`career-sweep-${String(seed)}`)
        expect(composed.ok, String(seed)).toBe(true)
        if (!composed.ok) continue
        expect(
          validateComposedPlan(composed.value, {
            catalog: deps.catalog,
            approvedVariants: grade5ApprovedVariants,
            policy: fullCareerCompositionPolicy,
          }),
        ).toEqual([])
        const beats = composed.value.stages.flatMap((stage) => stage.beats)
        plans.add(
          beats
            .map(
              (beat) =>
                `${String(beat.variant.templateId)}/${String(beat.variant.variantId)}`,
            )
            .join('+'),
        )
        for (const beat of beats) templates.add(String(beat.variant.templateId))
      }
      expect(plans.size).toBe(24)
      // Y la carrera no se juega siempre con las mismas situaciones: en
      // veinticuatro seeds ya aparecen casi todas las Templates ordinarias.
      expect(templates.size).toBeGreaterThanOrEqual(18)
    },
  )

  it(
    'LOCKED · cluster, arco y cuotas se cumplen con el catálogo real',
    {
      timeout: 120_000,
    },
    () => {
      for (let seed = 0; seed < 24; seed++) {
        const composed = compose(`career-quota-${String(seed)}`)
        if (!composed.ok) throw new Error('no compuso')
        const beats = composed.value.stages.flatMap((stage) => stage.beats)
        const clusters = new Map<string, number>()
        let projects = 0
        const bands = new Map<string, number>()
        for (const beat of beats) {
          const template = deps.catalog.template(beat.variant.templateId)
          if (template === undefined) throw new Error('sin template')
          bands.set(
            bandOf(template.cognitive),
            (bands.get(bandOf(template.cognitive)) ?? 0) + 1,
          )
          const meta = template.composition
          if (meta?.eventCluster !== undefined)
            clusters.set(
              meta.eventCluster,
              (clusters.get(meta.eventCluster) ?? 0) + 1,
            )
          if (meta?.recurringArc === 'PROJECT') projects += 1
        }
        for (const count of clusters.values())
          expect(count).toBeLessThanOrEqual(1)
        expect(projects).toBeLessThanOrEqual(2)
        expect(bands.get('core') ?? 0).toBeGreaterThanOrEqual(2)
        expect(bands.get('standard') ?? 0).toBeGreaterThanOrEqual(4)
        expect(bands.get('stretch') ?? 0).toBeGreaterThanOrEqual(1)
        expect(bands.get('stretch') ?? 0).toBeLessThanOrEqual(2)
      }
    },
  )

  it('la carrera se juega entera, egresa, replaya y se reanuda idéntica', () => {
    const built = descriptor('career-play')
    const outcome = simulateRun(built, deps)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const { state, log } = outcome.value
    expect(state.status).toBe('completed')
    expect(state.completion?.graduated).toBe(true)
    expect(new Set(state.history.map((entry) => entry.stage))).toEqual(
      new Set(STAGES),
    )
    const replayed = replayRun(log, deps)
    expect(replayed.ok && replayed.value.state).toEqual(state)
    const restored = restoreSnapshot(serializeSnapshot(state), built)
    expect(restored.ok && serializeSnapshot(restored.value)).toEqual(
      serializeSnapshot(state),
    )
  })

  it('jugada con los oráculos, la carrera puntúa y el Repaso queda afuera', () => {
    const played = playGrade5(descriptor('career-optimal'), deps)
    expect(played.state.completion?.graduated).toBe(true)
    const scored = scoreRun(
      scoredEventsOf(played.state.history),
      deps.catalog,
      candidateFairScorePolicy,
    )
    if (!isOk(scored)) throw new Error('no puntuó')
    expect(scored.value.fairScore).toBeGreaterThan(0)
    expect(scored.value.scoredBeats).toBe(
      played.state.history.filter(
        (entry) => entry.challengeId !== undefined && entry.recovery !== true,
      ).length,
    )
  })

  it(
    'una carrera jugada al máximo puntúa exactamente 10.000',
    { timeout: 60_000 },
    () => {
      for (let seed = 0; seed < 6; seed++) {
        const played = playGrade5(descriptor(`max-${String(seed)}`), deps)
        const scored = scoreRun(
          scoredEventsOf(played.state.history),
          deps.catalog,
          candidateFairScorePolicy,
        )
        if (!isOk(scored)) throw new Error('no puntuó')
        // Con toda la evidencia disponible en su máximo, el techo se alcanza
        // exacto: si una variante no admitiera Math óptimo con Equipo o Aura
        // máximos, dos carreras competirían con techos distintos.
        expect(scored.value.fairScore, `seed ${String(seed)}`).toBe(SCORE_SCALE)
        // Y las componentes ausentes no penalizan: se remueven y los pesos se
        // redistribuyen entre las que sí hubo.
        const active = scored.value.components.filter(
          (component) => component.opportunities > 0,
        )
        expect(
          active.reduce(
            (total, component) => total + component.contribution,
            0,
          ),
        ).toBe(SCORE_SCALE)
      }
    },
  )

  it('el servidor recalcula la carrera entera y descarta lo que el cliente afirme', () => {
    const built = descriptor('career-server')
    const outcome = simulateRun(built, deps)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const encoded = actionLogSchema.parse(serializeActionLog(outcome.value.log))
    const good = validateSubmittedRun(encoded, deps)
    expect(good.ok).toBe(true)
    expect(
      validateSubmittedRun(
        { ...encoded, score: 10_000, quality: 'optimal', graduated: false },
        deps,
      ),
    ).toEqual(good)
    for (const field of [
      'gameVersion',
      'rulesetVersion',
      'contentVersion',
      'variantCatalogVersion',
    ])
      expect(
        validateSubmittedRun(
          {
            ...encoded,
            descriptor: { ...encoded.descriptor, [field]: 'forjado' },
          },
          deps,
        ).ok,
        field,
      ).toBe(false)
    // Y el plan viaja con su huella: cambiarla invalida la submission.
    expect(
      validateSubmittedRun(
        {
          ...encoded,
          descriptor: {
            ...encoded.descriptor,
            planFingerprint: 'a'.repeat(64),
          },
        },
        deps,
      ).ok,
    ).toBe(false)
  })

  it(
    'la rareza aparece, respeta su presupuesto y no cambia lo que la carrera ofrece',
    { timeout: 180_000 },
    () => {
      let withRare = 0
      let runs = 0
      const seen = new Set<string>()
      for (let seed = 0; seed < 30; seed++) {
        const built = createFullCareerRunDescriptor(`rare-${String(seed)}`)
        if (!built.ok) continue
        const outcome = simulateRun(built.value, deps)
        expect(outcome.ok).toBe(true)
        if (!outcome.ok) continue
        runs += 1
        const { state, log } = outcome.value
        // El presupuesto de la carrera manda: dos eventos, uno que toque un
        // beat puntuable, uno muy raro.
        expect(state.rare.length).toBeLessThanOrEqual(2)
        expect(
          state.rare.filter((entry) => entry.treatment === 'variant-modifier')
            .length,
        ).toBeLessThanOrEqual(1)
        expect(
          state.rare.filter((entry) => entry.band === 'VERY_RARE').length,
        ).toBeLessThanOrEqual(1)
        expect(new Set(state.rare.map((entry) => entry.id)).size).toBe(
          state.rare.length,
        )
        for (const entry of state.rare) seen.add(entry.id)
        if (state.rare.length > 0) {
          withRare += 1
          // Y no cambia lo que la carrera ofrece: los nueve beats siguen ahí.
          expect(
            (state.plan?.stages ?? []).flatMap((stage) => stage.beats).length,
          ).toBe(9)
          // El replay la reconstruye: es derivada de la seed y del estado.
          const replayed = replayRun(log, deps)
          expect(replayed.ok && replayed.value.state.rare).toEqual(state.rare)
          // Y una reanudación la conserva.
          const restored = restoreSnapshot(
            serializeSnapshot(state),
            built.value,
          )
          expect(restored.ok && restored.value.rare).toEqual(state.rare)
        }
      }
      expect(runs).toBeGreaterThan(25)
      // Aparece de verdad, y no en todas: es rareza, no decorado.
      expect(withRare).toBeGreaterThan(0)
      expect(withRare).toBeLessThan(runs / 2)
      expect(seen.size).toBeGreaterThanOrEqual(1)
    },
  )

  it('el cierre de la carrera es determinista, no puntúa y el servidor lo recompone', () => {
    const built = descriptor('career-closing')
    const outcome = simulateRun(built, deps)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const { state, log } = outcome.value

    const first = closeCareer(state)
    const second = closeCareer(state)
    expect(first).toEqual(second)
    // Egresaste va primero y ningún desempeño lo reemplaza.
    expect(first.epilogue.graduated).toBe(true)
    expect(first.epilogue.memories.length).toBeGreaterThanOrEqual(3)
    expect(first.epilogue.memories.length).toBeLessThanOrEqual(5)
    expect(new Set(first.epilogue.memories.map((entry) => entry.id)).size).toBe(
      first.epilogue.memories.length,
    )

    // Prestige: esta edición no ofrece oportunidades y el techo ofrecido lo
    // dice. Aparecer en un evento raro no otorga nada.
    expect(first.prestige.total).toBe(0)
    expect(first.prestige.offered).toEqual({
      'career-arc': 0,
      special: 0,
      rare: 0,
    })

    // Y el servidor lo recompone del log: no hay campo que el cliente pueda
    // mandar para mover Prestige.
    const encoded = actionLogSchema.parse(serializeActionLog(log))
    const validated = validateSubmittedRun(encoded, deps)
    expect(validated.ok).toBe(true)
    if (!validated.ok) return
    expect(validated.value.prestige?.total).toBe(first.prestige.total)
    expect(validateSubmittedRun({ ...encoded, prestige: 100 }, deps)).toEqual(
      validated,
    )
  })

  it('una carrera con todo mal egresa igual, con un Repaso por año como techo', () => {
    const played = playGrade5(descriptor('career-hard'), deps, () => 'invalid')
    expect(played.state.completion?.graduated).toBe(true)
    expect(played.state.progression.pending).toEqual([])
    for (const stage of STAGES)
      expect(
        played.state.progression.history.filter(
          (entry) => entry.stageId === stage,
        ).length,
        stage,
      ).toBeLessThanOrEqual(1)
  })
})
