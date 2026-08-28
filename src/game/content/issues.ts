/**
 * Shared shape for content diagnostics.
 *
 * Content validation and run-plan validation both report the same kind of
 * finding, and both are consumed by tooling that groups by `code`. The type
 * lives on its own so neither module has to import the other.
 */

export type ValidationSeverity = 'error' | 'warning'

export interface ValidationIssue {
  readonly severity: ValidationSeverity
  /** Stable machine-readable code, useful for suppressions and tooling. */
  readonly code: string
  readonly subject: string
  readonly message: string
}

export function contentError(
  code: string,
  subject: string,
  message: string,
): ValidationIssue {
  return { severity: 'error', code, subject, message }
}

export function contentWarning(
  code: string,
  subject: string,
  message: string,
): ValidationIssue {
  return { severity: 'warning', code, subject, message }
}

/** True when nothing in the list blocks the content from shipping. */
export function hasNoErrors(issues: readonly ValidationIssue[]): boolean {
  return issues.every((issue) => issue.severity !== 'error')
}
