# Score policy configuration

The scoring model must be versioned data/configuration, not scattered magic constants.

## Example

```ts
interface ScorePolicy {
  version: string;
  weights: {
    math: number;
    team: number;
    aura: number;
  };
  discreteQuality: {
    optimal: number;
    resolved: number;
    partial: number;
    insufficient: number;
  };
  difficultyMultiplier: Record<DifficultyBand, number>;
  auraContributionCap: number;
  tieBreakOrder: TieMetric[];
}
```

Validate:

- weights sum to 1;
- all coefficients are finite/in allowed ranges;
- score result cannot exceed expected range;
- version immutable after official freeze.

## Teacher decision should produce config

When the Mathematics Department approves `80/15/5` or another distribution, create a new explicit `scoreVersion`, not a hidden code edit.
