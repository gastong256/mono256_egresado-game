# Target engine architecture

## Fundamental boundary

```text
Browser / React
    ↓ commands
Application/Game Controller
    ↓
Pure Deterministic Engine
    ↓
State + Domain Events + Effect Descriptors
    ↓
Adapters / persistence / server verification
```

The engine must not depend on React, DOM, localStorage, Supabase or ambient time/randomness.

## Pure transition target

Conceptually:

`transition(state, command, deterministicContext) -> TransitionResult`

## New capabilities required by current product direction

1. CareerState v0.2 migration.
2. ScenarioFamily/Template/Variant abstraction.
3. Stable RNG/seed derivation.
4. Variant validators and deployed catalogs.
5. Difficulty metadata/budget.
6. Competition score breakdown separate from career stats.
7. Canonical run descriptor/version fields.
8. Canonical action log/replay.
9. Server-side verification path for official fair submissions.
10. Graduation/fail-forward invariant when that product direction is activated in content.

## Functional core / imperative shell

Domain logic returns descriptions/effects; shell performs persistence, analytics or UI side effects.

## No ambient nondeterminism

No `Math.random()`, `Date.now()`, `new Date()` or `performance.now()` inside authoritative transition/evaluation logic. Time-sensitive gameplay must receive explicit timestamps/durations through trusted/deterministic context according to mode.
