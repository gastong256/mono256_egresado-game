/**
 * Invariant failures.
 *
 * Kept in its own module so the rejection taxonomy and the exhaustiveness
 * helper can both depend on it without forming an import cycle.
 */

/**
 * Thrown when the engine reaches a state its own rules should have prevented.
 * Reaching this class in production is a bug, never a player action.
 */
export class EngineInvariantError extends Error {
  public constructor(message: string) {
    super(`Egresado engine invariant violated: ${message}`)
    this.name = 'EngineInvariantError'
  }
}

export function invariant(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    throw new EngineInvariantError(message)
  }
}
