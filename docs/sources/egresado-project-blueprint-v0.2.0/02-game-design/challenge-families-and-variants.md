# Challenge families, templates and variants

## Problem solved

A single fixed challenge becomes memorized. Merely changing `25% → 15%` helps briefly but players still learn “the second option”. We need **structural variation**, not just numeric noise.

## Recommended hierarchy

```text
ScenarioFamily
  └─ Template
       └─ Variant(seed, parameters)
```

### Family
Narrative context: Colectivo, Mural, Notebook, Group Project, Fair Stand.

### Template
Distinct reasoning structure within the same setting.

### Variant
Concrete numbers/options generated or selected deterministically.

## Colectivo example

- Delay template: travel time + percentage delay.
- Latest departure template: derive latest safe departure.
- Route comparison template: compare two transport alternatives.
- Frequency template: next service + travel time + arrival deadline.

## Deterministic seed

Every variant must be reconstructable from run identity. Never call ambient `Math.random()` in domain logic.

Suggested derivation:

`variantSeed = H(runSeed, familyId, templateId, slotIndex, contentVersion)`

Use a stable owned derivation function so changing an RNG library does not silently reshuffle old competitions.

## Reverse generation / constraint-first generation

Prefer generating **from desired pedagogical properties**.

Example Mural:

Want 1L insufficient, 2L optimal, 4L valid but inefficient. With coverage `8 m²/L`, generate required area in `(8,16]`, then choose dimensions that create a readable value.

This is safer than generating arbitrary dimensions and hoping answer categories remain valid.

## Competitive deployed variants

For prize mode, do not rely solely on arbitrary runtime generation. Recommended pipeline:

`Generator → N candidate seeds → invariant tests → difficulty audit → approved deployed catalog → runtime deterministic selection`.

This is analogous to STACK's recommendation to pre-generate/test random question variants so learners are not exposed to impossible or defective random cases.

## Runtime variety without chaos

A deployed catalog can still provide hundreds/thousands of combinations. Runtime picks from validated variants using seed/run descriptor.

## Anti-memorization controls

- seeded option shuffle where semantically allowed;
- test answer-position distribution;
- avoid immediate repetition of same template/variant;
- maintain equivalent difficulty budget;
- do not expose seed as a way to cherry-pick.
