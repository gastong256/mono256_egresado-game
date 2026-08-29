/**
 * Canonical JSON.
 *
 * `JSON.stringify` preserves insertion order, which two structurally identical
 * values can differ in. Sorting every level removes that as a source of false
 * mismatches, which is what makes it safe to compare states, fingerprint a
 * catalog entry or hash a composed plan by their serialized form.
 *
 * It lives in `core` because three unrelated parts of the engine need the same
 * guarantee and none of them should have to depend on the others to get it.
 */

export function canonicalize(value: unknown): string {
  return JSON.stringify(sortValue(value))
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue)
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))

    return Object.fromEntries(
      entries.map(([key, entry]) => [key, sortValue(entry)]),
    )
  }

  return value
}
