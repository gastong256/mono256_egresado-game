/**
 * La carrera completa: `7.º → 5.º` con el presupuesto de nueve beats.
 *
 * Los sets por año existen para desarrollar e inspeccionar un año a la vez, y
 * cada uno compone dos beats por etapa. Éste es el otro: el mismo contenido y
 * el mismo catálogo aprobado, con las restricciones de carrera de producto —
 * nueve beats ordinarios, seis anchors y tres secundarias, cuotas de banda,
 * pacing, razonamiento, cluster y arco— que hasta ahora sólo se habían probado
 * contra catálogos sintéticos.
 *
 * La política **competitiva** de esta edición sí es oficial desde el FREEZE de
 * producción: `fair-score-v1`, con los mismos números que la candidata que la
 * precedió. La ruleset, en cambio, sigue declarando `official: false`, y eso no
 * es una contradicción: son dos banderas de capas distintas. La de la ruleset
 * dice que composición, recuperación, rareza y costo siguen siendo políticas de
 * desarrollo —subirlas exigiría versionarlas todas y mover la huella del plan,
 * que es exactamente el riesgo de replay que un congelamiento existe para no
 * correr—; la del score dice con qué calibración se rankea, que es la que un
 * resultado publicado tiene que poder nombrar.
 */
import {
  ENGINE_VERSION,
  EngineInvariantError,
  candidateDifficultyCostPolicy,
  buildEpilogue,
  careerMemories,
  candidatePrestigePolicy,
  officialFairScorePolicy,
  candidateRarePolicy,
  earnedMilestones,
  scorePrestige,
  composeRun,
  createRuleset,
  fullCareerV1Constraints,
  ok,
  planFingerprint,
  stageCompositionPolicy,
  toRulesetId,
  toRunId,
  toRunSeed,
  type CareerEpilogue,
  type CareerMemory,
  type CompetitiveScorePolicy,
  type CompositionFailure,
  type CompositionPolicy,
  type EngineDependencies,
  type Milestone,
  type PrestigeBreakdown,
  type Result,
  type RunDescriptor,
  type RunState,
} from '@/game'
import { GRADE_7_HOSTABLE_TEMPLATES } from '@/content/grade-7/composition'
import {
  GRADE_5_CONTENT_VERSION,
  GRADE_5_VARIANT_CATALOG_VERSION,
} from '@/content/grade-5/versions'
import {
  createGrade5Dependencies,
  grade5ApprovedVariants,
} from '@/content/grade-5'
import { careerRareEvents } from '@/content/rare-events'
import {
  careerMilestones,
  careerPrestigeOpportunities,
  iconicStorylets,
} from '@/content/career-closing'

/** Identidad propia: el contenido es el de 5.º, la política de carrera no. */
export const FULL_CAREER_RULESET_VERSION = '1.0.0-full-career'

/**
 * Nueve beats entre seis años, con un anchor por año.
 *
 * Cada etapa admite uno o dos beats ordinarios; la cuenta total la fija la
 * restricción de carrera, así que es la búsqueda global la que decide en qué
 * tres años entra la secundaria. El objetivo de dificultad sube con los años
 * porque las bandas suben con ellos, y la tolerancia deja lugar a que un año
 * traiga una sola situación.
 */
export const fullCareerCompositionPolicy: CompositionPolicy = {
  id: 'full-career',
  version: '1.0.0-candidate',
  official: false,
  costPolicy: candidateDifficultyCostPolicy,
  /**
   * Adentro del sobre, decide el sorteo sembrado.
   *
   * Las cuotas de variedad de la carrera —familias de razonamiento, motores de
   * interacción, bandas, pacing, cluster y arco— son **duras**: el compositor
   * no produce un plan que las incumpla. Lo que queda después es un conjunto de
   * carreras igualmente legítimas, y ahí ordenar por más objetivos blandos no
   * agrega calidad: elige siempre la misma.
   *
   * Está medido. Con la lista completa —empezando por `difficulty-fit`— las 300
   * carreras compuestas usaban doce Templates y `y1.course-project-expo` no
   * aparecía **nunca**; con `template-freshness` sola, que vale nueve en todo
   * plan legal y por lo tanto empata siempre, aparecen las veintiocho y la
   * expo entra en una de cada tres. El costo de composición no se movió.
   */
  objectives: ['template-freshness'],
  stages: [
    stageCompositionPolicy('grade-7', {
      difficulty: { target: 200, tolerance: 160 },
      narrativeBeats: 1,
      hostableTemplates: [...GRADE_7_HOSTABLE_TEMPLATES],
    }),
    stageCompositionPolicy('year-1', {
      difficulty: { target: 220, tolerance: 170 },
      narrativeBeats: 2,
    }),
    stageCompositionPolicy('year-2', {
      difficulty: { target: 240, tolerance: 180 },
      narrativeBeats: 2,
    }),
    stageCompositionPolicy('year-3', {
      difficulty: { target: 260, tolerance: 190 },
      narrativeBeats: 2,
    }),
    stageCompositionPolicy('year-4', {
      difficulty: { target: 280, tolerance: 200 },
      narrativeBeats: 2,
    }),
    stageCompositionPolicy('year-5', {
      difficulty: { target: 300, tolerance: 210 },
      narrativeBeats: 2,
    }),
  ],
  career: fullCareerV1Constraints,
}

/**
 * Cómo se parametriza una edición de carrera completa.
 *
 * Una sola cosa: qué calibración competitiva rankea. El FREEZE de producción
 * publicó `fair-score-v1` con los mismos números que `fair-score-dev-2`, y las
 * partidas emitidas bajo la candidata tienen que poder seguir verificándose
 * —el servidor vuelve a jugar el log contra las versiones que el intento fijó,
 * y una calibración que ya no se puede resolver convierte evidencia guardada en
 * un intento invalidable—. Por eso la política entra como parámetro en vez de
 * estar cableada: no para poder elegirla en runtime, sino para que el registro
 * de ediciones pueda declarar las dos que existen.
 */
export interface FullCareerEditionOptions {
  readonly competitiveScore?: CompetitiveScorePolicy
}

export function createFullCareerDependencies(
  options: FullCareerEditionOptions = {},
): EngineDependencies {
  const base = createGrade5Dependencies()
  const created = createRuleset({
    ...base.ruleset,
    id: toRulesetId('full-career'),
    version: FULL_CAREER_RULESET_VERSION,
    composition: fullCareerCompositionPolicy,
    // La calibración de rareza es una regla y vive en la ruleset; los eventos
    // son contenido y viajan aparte. Los sets por año no sortean: la rareza es
    // un sistema de la carrera.
    rare: candidateRarePolicy,
  })
  if (!created.ok)
    throw new EngineInvariantError(
      `invalid full-career ruleset: ${created.error.kind}`,
    )
  return {
    ...base,
    ruleset: created.value,
    composition: fullCareerCompositionPolicy,
    competitiveScore: options.competitiveScore ?? officialFairScorePolicy,
    rareEvents: careerRareEvents,
    prestige: {
      policy: candidatePrestigePolicy,
      opportunities: careerPrestigeOpportunities,
    },
  }
}

/**
 * Cómo se emite una carrera concreta a partir de la seed.
 *
 * El servidor de competencia necesita dos cosas que una práctica local no: un
 * `runId` propio por intento —la edición comparte seed, así que el id es lo
 * único que separa un intento de otro— y el modo `fair`, que es lo que hace
 * que el epílogo hable de un puesto en vez de decir que el resultado es
 * personal. Todo lo demás —plan, variantes, dificultad, oportunidades— sale de
 * la seed y de las mismas políticas, que es exactamente el punto.
 */
export interface FullCareerRunOptions extends FullCareerEditionOptions {
  readonly runId?: string
  readonly mode?: RunDescriptor['mode']
}

export function createFullCareerRunDescriptor(
  seed: string,
  options: FullCareerRunOptions = {},
): Result<RunDescriptor, CompositionFailure> {
  const competitiveScore = options.competitiveScore ?? officialFairScorePolicy
  const dependencies = createFullCareerDependencies({ competitiveScore })
  const base: RunDescriptor = {
    runId: toRunId(options.runId ?? `career-${seed}`),
    seed: toRunSeed(seed),
    mode: options.mode ?? 'practice',
    difficulty: 'fixed',
    gameVersion: ENGINE_VERSION,
    rulesetVersion: FULL_CAREER_RULESET_VERSION,
    contentVersion: GRADE_5_CONTENT_VERSION,
    variantCatalogVersion: GRADE_5_VARIANT_CATALOG_VERSION,
    scoreVersion: competitiveScore.version,
  }
  const composed = composeRun({
    seed: base.seed,
    stages: dependencies.ruleset.stages.map((stage) => stage.id),
    catalog: dependencies.catalog,
    approvedVariants: grade5ApprovedVariants,
    policy: fullCareerCompositionPolicy,
  })
  return composed.ok
    ? ok({ ...base, planFingerprint: planFingerprint(composed.value) })
    : composed
}

/**
 * El cierre de una carrera terminada: hitos, Prestige y epílogo.
 *
 * Puro y derivado: lee el estado final y no lo toca. El servidor recompone lo
 * mismo desde el log de acciones, así que nada de esto es una afirmación del
 * cliente.
 */
export function closeCareer(state: RunState): {
  readonly milestones: readonly Milestone[]
  readonly prestige: PrestigeBreakdown
  readonly epilogue: CareerEpilogue
  /**
   * Todo lo que la carrera puede recordar, año por año, antes de la selección
   * de saliencia. El recorrido del cierre elige uno por año de acá; el epílogo
   * conserva su propia selección de tres a cinco.
   */
  readonly memories: readonly CareerMemory[]
} {
  const dependencies = createFullCareerDependencies()
  const milestones = earnedMilestones(state, careerMilestones)
  const prestige = scorePrestige(
    state,
    careerPrestigeOpportunities,
    candidatePrestigePolicy,
  )
  const memories = careerMemories({
    state,
    storylets: dependencies.storylets,
    rareEvents: careerRareEvents,
    milestones,
    iconicStorylets,
  })
  return {
    milestones,
    prestige,
    memories,
    epilogue: buildEpilogue({
      state,
      storylets: dependencies.storylets,
      rareEvents: careerRareEvents,
      milestones,
      iconicStorylets,
      // Prestige se muestra sólo si la edición ofreció alguna oportunidad.
      // Dibujar un 0 donde no había nada que ganar presenta una ausencia como
      // un mal resultado, que es la misma regla por la que una dimensión no
      // establecida no se dibuja como cero.
      ...(Object.values(prestige.offered).some((value) => value > 0)
        ? { prestige: prestige.total }
        : {}),
    }),
  }
}
