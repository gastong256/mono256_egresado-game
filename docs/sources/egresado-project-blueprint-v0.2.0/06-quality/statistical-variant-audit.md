# Statistical variant audit

For each template and deployed catalog, generate a machine-readable audit.

## Parameters

- count generated;
- count valid/invalid;
- duplicate fingerprints;
- distribution by difficulty;
- answer-position distribution;
- distribution of relevant numeric parameters;
- outcome availability;
- expected score max/min.

## Example acceptance heuristics

Not universal constants, but useful flags:

- invalid deployed variants: exactly 0;
- duplicate choices: exactly 0;
- answer position severe skew: investigate;
- template whose theoretical max differs unexpectedly: investigate;
- variant whose required arithmetic leaves intended band: reject/reclassify.

## Monte Carlo ranking audit

Simulate many run schedules and player skill profiles. Compare expected score by schedule. If schedule alone explains a material share of score variance, difficulty equating is weak.

## Empirical post-fair calibration

After event, estimate per-template success/partial/time distributions. Use only for future versions unless an official regrade policy applies.
