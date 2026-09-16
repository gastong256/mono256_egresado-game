/**
 * Gate 16 — simulación grande sobre el catálogo real.
 *
 * No busca un promedio bonito: busca que ninguna política de juego rompa el
 * motor, que toda carrera terminada egrese, que el servidor recomponga lo
 * mismo que el cliente y que el presupuesto de eventos raros se respete con
 * rareza encendida y apagada. Nada de esto recalibra contenido; si una política
 * produce puntajes bajos, ése es el resultado, no un defecto.
 */
import { describe, expect, it } from 'vitest'
import {
  activeChallengeView,
  appendAction,
  composeRun,
  createRun,
  materializeChallenge,
  toRunSeed,
  toVariantId,
  validateComposedPlan,
  emptyActionLog,
  replayRun,
  serializeActionLog,
  parseActionLog,
  transition,
  type EngineDependencies,
  type GameCommand,
  type SolutionQuality,
} from '@/game'
import {
  createFullCareerDependencies,
  createFullCareerRunDescriptor,
  fullCareerCompositionPolicy,
} from '@/content/full-career'
import { grade5ApprovedVariants } from '@/content/grade-5'
import { createRng } from '@/game/random/rng'
import { synthesizeAnswer } from '@/game/testing'
import { validateSubmittedRun } from '@/server/game/validate-run'
import { grade5Answer } from '../helpers/grade-5-play'

const dependencies = createFullCareerDependencies()

/** Sin política de rareza: la misma carrera, sin el hook de eventos raros. */
const withoutRare: EngineDependencies = Object.fromEntries(
  Object.entries(dependencies).filter(([key]) => key !== 'rareEvents'),
) as EngineDependencies

type Policy = (view: {
  readonly templateId: string
  readonly index: number
}) => SolutionQuality | 'random'

/** Cada política lleva su propia semilla ASCII: los ids de run son un contrato. */
const POLICIES: readonly {
  readonly name: string
  readonly seed: string
  readonly quality: Policy
}[] = [
  { name: 'óptima', seed: 'optimal', quality: () => 'optimal' },
  { name: 'eficiente', seed: 'efficient', quality: () => 'efficient' },
  { name: 'funcional', seed: 'functional', quality: () => 'functional' },
  {
    name: 'inválida pesada',
    seed: 'invalid-heavy',
    quality: ({ index }) => (index % 3 === 0 ? 'optimal' : 'invalid'),
  },
  {
    name: 'mixta',
    seed: 'mixed',
    quality: ({ index }) =>
      index % 3 === 0
        ? 'functional'
        : index % 3 === 1
          ? 'efficient'
          : 'optimal',
  },
  { name: 'aleatoria', seed: 'random', quality: () => 'random' },
]

function play(seed: string, policy: Policy, deps = dependencies) {
  const built = createFullCareerRunDescriptor(seed)
  if (!built.ok) throw new Error(`compose: ${JSON.stringify(built.error)}`)
  const created = createRun(built.value, deps)
  if (!created.ok) throw new Error(`create: ${JSON.stringify(created.error)}`)
  let state = created.value.state
  let log = emptyActionLog(built.value)
  const rng = createRng(built.value.seed, ['simulation', seed])
  let index = 0
  for (let step = 0; step < 240 && state.status === 'active'; step++) {
    let command: GameCommand = { type: 'CONTINUE' }
    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, deps)
      if (!view.ok || view.value === undefined)
        throw new Error('sin vista pública')
      const wanted = policy({ templateId: view.value.ref.templateId, index })
      index++
      let answer
      if (wanted === 'random')
        answer = synthesizeAnswer(view.value.interaction, rng)
      else
        try {
          answer = grade5Answer(view.value, deps, wanted, built.value)
        } catch {
          // Un Template sin ese nivel en su oráculo se juega óptimo: la
          // política mide robustez, no cobertura de niveles.
          answer = grade5Answer(view.value, deps, 'optimal', built.value)
        }
      command = {
        type: 'ANSWER',
        instanceId: view.value.ref.instanceId,
        answer,
      }
    }
    const next = transition(state, command, deps)
    if (!next.ok) throw new Error(`transition: ${JSON.stringify(next.error)}`)
    state = next.value.state
    log = appendAction(log, command)
  }
  return { state, log, descriptor: built.value }
}

describe('Gate 16 · barrido por política de juego', () => {
  it.each(POLICIES)(
    'la política $name termina, egresa y nunca rechaza un comando',
    { timeout: 240_000 },
    ({ seed: slug, quality: policy }) => {
      const scores: number[] = []
      for (let seed = 0; seed < 12; seed++) {
        const played = play(`sim-${slug}-${String(seed)}`, policy)
        expect(played.state.status).toBe('completed')
        // Egresar no depende del desempeño: es el contrato de fail-forward.
        expect(played.state.completion?.graduated).toBe(true)
        expect(played.state.completion?.recoveries ?? 0).toBeLessThanOrEqual(6)
        const score = played.state.completion?.totalScore ?? 0
        expect(Number.isInteger(score)).toBe(true)
        scores.push(score)
      }
      expect(scores).toHaveLength(12)
    },
  )

  it(
    'el servidor recompone cada política desde el log, sin creerle al cliente',
    { timeout: 240_000 },
    () => {
      for (const { name, seed: slug, quality: policy } of POLICIES) {
        const played = play(`server-${slug}`, policy)
        const encoded = serializeActionLog(played.log)
        const parsed = parseActionLog(encoded)
        expect(parsed.ok).toBe(true)
        if (!parsed.ok) continue
        const replayed = replayRun(parsed.value, dependencies)
        expect(replayed.ok).toBe(true)
        if (!replayed.ok) continue
        expect(replayed.value.state.completion?.totalScore).toBe(
          played.state.completion?.totalScore,
        )
        const validated = validateSubmittedRun(encoded, dependencies)
        expect(validated.ok, name).toBe(true)
      }
    },
  )
})

describe('Gate 16 · rareza encendida y apagada', () => {
  it(
    'el presupuesto de eventos raros se respeta, y sin política no hay ninguno',
    { timeout: 240_000 },
    () => {
      let withRare = 0
      for (let seed = 0; seed < 24; seed++) {
        const on = play(`rare-on-${String(seed)}`, () => 'optimal')
        const off = play(
          `rare-on-${String(seed)}`,
          () => 'optimal',
          withoutRare,
        )

        expect(off.state.rare).toHaveLength(0)
        expect(on.state.rare.length).toBeLessThanOrEqual(2)
        if (on.state.rare.length > 0) withRare++

        // Sin rareza la carrera sigue siendo jugable y egresa igual.
        expect(off.state.completion?.graduated).toBe(true)
        // Un evento raro nunca cambia el puntaje de una carrera óptima.
        expect(on.state.completion?.totalScore).toBe(
          off.state.completion?.totalScore,
        )
      }
      // Con 24 carreras y 150/75/20 por mil, esperar al menos una aparición no
      // es exigirle suerte al generador: es comprobar que el hook está vivo.
      expect(withRare).toBeGreaterThan(0)
    },
  )
})

describe('Gate 16 · direcciones de variante alteradas', () => {
  it('el plan real se acepta y el mismo plan con una dirección inventada no', () => {
    const composed = composeRun({
      seed: toRunSeed('tamper'),
      stages: dependencies.ruleset.stages.map((stage) => stage.id),
      catalog: dependencies.catalog,
      approvedVariants: grade5ApprovedVariants,
      policy: fullCareerCompositionPolicy,
    })
    expect(composed.ok).toBe(true)
    if (!composed.ok) return
    const context = {
      catalog: dependencies.catalog,
      approvedVariants: grade5ApprovedVariants,
      policy: fullCareerCompositionPolicy,
    }
    expect(validateComposedPlan(composed.value, context)).toEqual([])

    const [first, ...rest] = composed.value.stages
    if (first === undefined) throw new Error('plan sin etapas')
    const [beat, ...others] = first.beats
    if (beat === undefined) throw new Error('etapa sin beats')
    const tampered = {
      ...composed.value,
      stages: [
        {
          ...first,
          beats: [
            {
              ...beat,
              variant: {
                ...beat.variant,
                variantId: toVariantId('inventada-9999'),
              },
            },
            ...others,
          ],
        },
        ...rest,
      ],
    }
    const issues = validateComposedPlan(tampered, context)
    expect(issues.map((issue) => issue.code)).toContain(
      'plan.unapproved-variant',
    )
  })

  it('el motor se niega a materializar una variante fuera del catálogo aprobado', () => {
    const built = createFullCareerRunDescriptor('tamper-runtime')
    if (!built.ok) throw new Error('compose')
    const created = createRun(built.value, dependencies)
    if (!created.ok) throw new Error('create')
    const state = created.value.state
    const view = activeChallengeView(state, dependencies)
    expect(view.ok).toBe(true)
    if (!view.ok || view.value === undefined) return
    const forged = {
      ...view.value.ref,
      variantId: toVariantId('inventada-9999'),
    }
    const materialized = materializeChallenge(built.value, forged, dependencies)
    expect(materialized.ok).toBe(false)
  })
})
