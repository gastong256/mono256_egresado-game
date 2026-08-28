# Competitive scoring and ranking

## Core separation

Do **not** derive the competition by naïvely multiplying visible career stats.

Career model answers: “What kind of school career did I build?”

FairScore answers: “How strong was this official run under competition rules?”

These are related but not identical.

## Why `Aura × 1 + Math × 10 + Equipo × 5` is not directly valid

Those variables live on different scales:

- mastery may be `0–1`;
- Promedio `1–10`;
- Equipo `0–100`;
- Aura signed/unbounded.

Multipliers do not express real relative weight until each component is normalized.

## Recommended score architecture

Each challenge evaluator returns competition-relevant normalized performance in addition to career effects.

### Math quality

`q_i ∈ [0,1]`

Discrete starting calibration (TEACHER GATE):

- optimal: `1.00`
- resolved: `0.75`
- partial: `0.40`
- insufficient: `0.10`

Continuous interactions should use their actual quality metric.

### Difficulty-adjusted raw math

`MathRaw = Σ (1000 × q_i × difficultyFactor_i)`

`MathMax = Σ (1000 × 1.0 × difficultyFactor_i)`

`MathPerformance = 10000 × MathRaw / MathMax`

This normalizes runs even when templates differ.

## Team and Aura competition contributions

If teachers want “the whole career matters”, use bounded **event competition contributions**, not the final visible stat values themselves.

`TeamPerformance ∈ [0,10000]`

`AuraPerformance ∈ [0,10000]` after event-specific normalization/caps.

Raw Aura remains signed/unbounded for narrative use. Competitive Aura must be capped so one spectacular event cannot dominate the math competition.

## Candidate FairScore

**RECOMMENDED / TEACHER GATE:**

`FairScore = round(0.80 × MathPerformance + 0.15 × TeamPerformance + 0.05 × AuraPerformance)`

The exact coefficients are not locked. A prior `10:5:1` intuition would normalize to 62.5% / 31.25% / 6.25%, which likely gives too much competitive weight to team behavior for an individual mathematics fair. A candidate around 80/15/5 is easier to defend.

## Promedio

Do not add final Promedio independently if it is already driven by academic mathematical outcomes; that can double-count the same performance.

## Estilo

Do not directly score Estilo. Assigning score to Aplicado/Estratega/Improvisador would imply an objectively superior personality and destroy the profile concept.

## Unlimited runs

Recommended official policy:

- unlimited attempts or configurable attempt policy;
- leaderboard stores **personal best**, not sum of all runs.

This rewards practice without making sheer play volume the scoring metric. Apple GameKit guidance similarly recommends Best Score for repeatable challenge-style competition rather than accumulated activity that disadvantages newcomers.

## Tie handling

Do not add random noise or meaningless decimal points.

Recommended deterministic ranking tuple:

1. `FairScore DESC`
2. `MathRaw/MathPerformance DESC`
3. `OptimalCount DESC`
4. `Accuracy DESC`
5. `DifficultySolved DESC`
6. `ActiveTimeMs ASC`

This makes ties extremely unlikely while preserving mathematical quality over speed.

### Exact tie

Do not falsely promise that a meaningful score can *mathematically never tie*. Guaranteeing uniqueness requires an arbitrary unique key. For prize fairness, define an organizer policy: shared rank/prize or a short tie-break challenge. A server sequence/run id may provide stable display order but should not secretly decide a prize.

## Number of attempts must not be a tie-breaker

Using more runs as a positive tie-breaker rewards free time; using fewer runs penalizes practice. Keep attempt count informational unless teachers deliberately choose another policy.
