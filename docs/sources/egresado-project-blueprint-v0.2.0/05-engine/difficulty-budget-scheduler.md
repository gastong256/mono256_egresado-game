# Difficulty-budget run scheduler

## Objective

Procedural diversity must not make one official run substantially easier than another.

## Model

Assign each deployed variant/template a calibrated `difficultyCost`, initially derived from authoring bands and later refined from fair data.

Example starting costs:

- CORE: 1.00
- STANDARD: 1.50
- STRETCH: 2.10

These costs are *scheduling metadata*, distinct from score multiplier.

A run configuration specifies target budget and slot constraints:

```json
{
  "slots": 6,
  "targetDifficultyBudget": 9.2,
  "tolerance": 0.2,
  "requiredFamilies": ["bus", "mural", "notebook", "group", "fair"]
}
```

Scheduler deterministically selects variants so:

`abs(sum(cost_i) - targetBudget) <= tolerance`.

## Why separate cost from score multiplier

A scheduler may need strong separation between CORE and STRETCH to balance a run, while the score multiplier should remain small to avoid luck dominating ranking.

## No adaptive free advantage in competition

Do not silently lower a struggling player's official difficulty unless scoring/equating formally accounts for it and teachers approve. Adaptive free-play can be a later mode.

## Calibration

Before real data: expert/teacher judgment + structural features.

After fair: inspect empirical success rates/time, but do not retroactively redefine official score unless event policy permits replay/regrade.
