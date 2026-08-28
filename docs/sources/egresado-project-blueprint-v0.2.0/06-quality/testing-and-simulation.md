# Testing and simulation strategy

## Test pyramid by risk

### Unit/domain

- evaluator arithmetic;
- money/time helpers;
- scoring normalization;
- Estilo normalization;
- graduation/recovery transitions;
- tie comparator.

### Property-based

Use fast-check or existing equivalent for:

- generator invariants across many seeds;
- serialization round-trip;
- replay determinism;
- score bounds;
- no invalid Estilo percentages;
- graduation convergence when enabled.

Persist failing seed/path for exact reproduction.

### Golden deterministic

Keep golden seeds for representative/edge variants and replay them in CI.

### Simulation

Development/demo: thousands of synthetic runs.

Before fair: tens of thousands to 100k+ if runtime permits, focusing on:

- score distribution;
- unreachable outcomes;
- dominant strategies;
- ranking ties;
- variant repetition;
- difficulty distribution;
- career-state extremes;
- graduation reachability.

### UI/component

Test semantics and behavior, not Tailwind class strings.

### E2E

Representative mobile flows, mixed performance, reload/resume, final submission.

### Accessibility

Automated axe + manual keyboard + screen-reader spot checks.

## Competition simulation

Generate synthetic players of different skill strategies, not only random clicking. At minimum:

- high math accuracy;
- average accuracy;
- low accuracy;
- optimizer;
- fast-but-error-prone;
- slow/high-accuracy;
- Team-heavy choices;
- Aura-seeking choices.

Inspect whether intended ranking priorities actually emerge.
