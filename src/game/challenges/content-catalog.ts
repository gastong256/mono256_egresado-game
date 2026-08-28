/**
 * Content catalog: everything a run *could* play.
 *
 * The catalog is the authored, available content of a content set — scenario
 * families and the challenge templates inside them. It answers "what exists and
 * where may it appear", and deliberately not "what is this run playing": that is
 * the run plan, and keeping the two apart is what lets the catalog grow to a
 * whole school career while a run stays short.
 *
 * It is also not the future *deployed variant catalog*, which will hold
 * generated, validated and approved competitive variants. This one holds
 * authored definitions.
 *
 * A content set registers its families and templates once; the engine never
 * switches on a template id. Adding a family means adding data, not editing the
 * kernel. Registration is static and typed — there is no dynamic plugin loading
 * and no runtime container.
 */

import type { ChallengeId, ScenarioFamilyId } from '../core/branded'
import { EngineInvariantError } from '../core/invariant'
import type { StageId } from '../progression/stages'
import type { ChallengeDefinition, MathCategory } from './contracts'
import type { ScenarioFamilyDefinition } from './content-model'

export interface ContentCatalog {
  /** Every scenario family, ordered by id. */
  readonly families: readonly ScenarioFamilyDefinition[]
  /** Every challenge template, ordered by id. */
  readonly templates: readonly ChallengeDefinition[]
  family(id: ScenarioFamilyId): ScenarioFamilyDefinition | undefined
  template(id: ChallengeId): ChallengeDefinition | undefined
  /** Templates belonging to a family, ordered by id. */
  templatesOfFamily(id: ScenarioFamilyId): readonly ChallengeDefinition[]
  /** Templates a stage may schedule, optionally filtered by category. */
  forStage(
    stage: StageId,
    categories?: readonly MathCategory[],
  ): readonly ChallengeDefinition[]
}

function byId<T extends { readonly id: string }>(
  items: readonly T[],
): readonly T[] {
  return [...items].sort((left, right) =>
    left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
  )
}

/**
 * Builds a catalog from authored families and templates.
 *
 * Every template must name a family the catalog knows. A dangling family
 * reference is a content bug that would otherwise only surface as a confusing
 * lookup failure in the middle of a run.
 */
export function createContentCatalog(
  families: readonly ScenarioFamilyDefinition[],
  templates: readonly ChallengeDefinition[],
): ContentCatalog {
  const familiesById = new Map<string, ScenarioFamilyDefinition>()
  for (const family of families) {
    if (familiesById.has(family.id)) {
      throw new EngineInvariantError(
        `duplicate scenario family definition: ${family.id}`,
      )
    }
    familiesById.set(family.id, family)
  }

  const templatesById = new Map<string, ChallengeDefinition>()
  for (const template of templates) {
    if (templatesById.has(template.id)) {
      throw new EngineInvariantError(
        `duplicate challenge template definition: ${template.id}`,
      )
    }
    if (!familiesById.has(template.family)) {
      throw new EngineInvariantError(
        `challenge template ${template.id} belongs to unknown family ${template.family}`,
      )
    }
    templatesById.set(template.id, template)
  }

  // Deterministic order: the catalog is consumed by seeded selection, so its
  // iteration order is part of the replay contract.
  const orderedFamilies = byId(families)
  const orderedTemplates = byId(templates)

  return {
    families: orderedFamilies,
    templates: orderedTemplates,

    family(id: ScenarioFamilyId): ScenarioFamilyDefinition | undefined {
      return familiesById.get(id)
    },

    template(id: ChallengeId): ChallengeDefinition | undefined {
      return templatesById.get(id)
    },

    templatesOfFamily(id: ScenarioFamilyId): readonly ChallengeDefinition[] {
      return orderedTemplates.filter((template) => template.family === id)
    },

    forStage(
      stage: StageId,
      categories?: readonly MathCategory[],
    ): readonly ChallengeDefinition[] {
      return orderedTemplates.filter((template) => {
        if (!template.stages.includes(stage)) {
          return false
        }
        if (categories === undefined || categories.length === 0) {
          return true
        }
        return template.categories.some((category) =>
          categories.includes(category),
        )
      })
    },
  }
}
