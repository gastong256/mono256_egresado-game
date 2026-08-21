/**
 * Explicit result values for expected domain rejections.
 *
 * Invalid player actions are ordinary outcomes of a run, not exceptional
 * conditions, so the engine returns them instead of throwing. Exceptions remain
 * reserved for invariant violations described in `./errors`.
 */

export type Ok<T> = { readonly ok: true; readonly value: T }
export type Err<E> = { readonly ok: false; readonly error: E }
export type Result<T, E> = Ok<T> | Err<E>

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value }
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error }
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok
}

/** Maps the success channel and leaves a rejection untouched. */
export function mapOk<T, U, E>(
  result: Result<T, E>,
  transform: (value: T) => U,
): Result<U, E> {
  return result.ok ? ok(transform(result.value)) : result
}

/**
 * Unwraps a result that the caller has already proven successful. Used only in
 * code paths where a rejection would be a programming error.
 */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback
}
