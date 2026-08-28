# Non-functional requirements

## Reliability

- Official run should survive accidental refresh when technically feasible.
- Pending official submission should retry safely after temporary network loss.
- Submission is idempotent.

## Performance

- Mobile-first bundle discipline.
- Contextual images lazy-load unless critical.
- No heavy chart/animation framework solely for simple primitives.

## Accessibility

- WCAG 2.2 AA-oriented.
- Keyboard-complete.
- Reduced motion.
- Semantic controls/status.

## Determinism

- Reproducible official run from versions + descriptor + action log.

## Operability

- Health checks and event/ranking monitoring.
- Admin ability to hide inappropriate nickname without deleting audit evidence.

## Maintainability

- New year should mostly require content, not visual/engine reinvention.
