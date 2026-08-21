/**
 * Challenge registry.
 *
 * A content set registers its definitions once; the engine never switches on a
 * challenge id. Adding a family means adding a definition, not editing the
 * kernel. Registration is static and typed — there is no dynamic plugin loading
 * and no runtime container.
 */

import type { ChallengeId } from '../core/branded'
import { EngineInvariantError } from '../core/invariant'
import type { StageId } from '../progression/stages'
import type { ChallengeDefinition, MathCategory } from './contracts'

export interface ChallengeRegistry {
  readonly definitions: readonly ChallengeDefinition[]
  get(id: ChallengeId): ChallengeDefinition | undefined
  /** Definitions playable in a stage, optionally filtered by category. */
  forStage(
    stage: StageId,
    categories?: readonly MathCategory[],
  ): readonly ChallengeDefinition[]
}

export function createChallengeRegistry(
  definitions: readonly ChallengeDefinition[],
): ChallengeRegistry {
  const byId = new Map<string, ChallengeDefinition>()

  for (const definition of definitions) {
    if (byId.has(definition.id)) {
      throw new EngineInvariantError(
        `duplicate challenge definition: ${definition.id}`,
      )
    }
    byId.set(definition.id, definition)
  }

  // Deterministic order: the registry is consumed by seeded selection, so its
  // iteration order is part of the replay contract.
  const ordered = [...definitions].sort((left, right) =>
    left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
  )

  return {
    definitions: ordered,
    get(id: ChallengeId): ChallengeDefinition | undefined {
      return byId.get(id)
    },
    forStage(
      stage: StageId,
      categories?: readonly MathCategory[],
    ): readonly ChallengeDefinition[] {
      return ordered.filter((definition) => {
        if (!definition.stages.includes(stage)) {
          return false
        }
        if (categories === undefined || categories.length === 0) {
          return true
        }
        return definition.categories.some((category) =>
          categories.includes(category),
        )
      })
    },
  }
}
