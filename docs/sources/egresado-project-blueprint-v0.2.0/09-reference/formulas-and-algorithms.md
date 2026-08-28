# Formulas and algorithms reference

## 1. Promedio

Recommended conceptual model:

`Promedio = Σ(weight_j × grade_j) / Σ(weight_j)`

If every grade has equal weight, weights are 1. Grade ledger is preferred over arbitrary “+0.3 average” deltas.

## 2. Estilo normalization

Given non-negative evidence vector `(A,E,I)` and `S=A+E+I`:

- if `S=0`, Estilo is not yet meaningful/introduced;
- otherwise `%A=100A/S`, `%E=100E/S`, `%I=100I/S`.

Render rounding must preserve a displayed total of 100 if percentages are printed. Use largest-remainder rounding rather than independently rounding each percentage.

## 3. Classification precision/coverage

`precision = TP/(TP+FP)`

`coverage = TP/(TP+FN)`

`F1 = 2PR/(P+R)` when `P+R>0`, else 0.

## 4. Difficulty-adjusted math

`MathRaw = Σ(1000 × q_i × d_i)`

`MathMax = Σ(1000 × d_i)`

`MathPerformance = 10000 × MathRaw/MathMax`

## 5. Candidate FairScore

`FairScore = round(wM*M + wT*T + wA*A)`

with `wM+wT+wA=1` and candidate `0.80/0.15/0.05` pending teacher approval.

## 6. Rank comparator

Compare lexicographically:

`(FairScore, MathPerformance, OptimalCount, Accuracy, DifficultySolved, -ActiveTimeMs)`

Higher tuple wins. Exact tie requires explicit event policy.

## 7. Reverse-generation mural example

Coverage `c=8 m²/L`, packages `1,2,4L`.

To guarantee `2L` is the smallest valid package, choose required area `R` such that:

`8 < R ≤ 16`.

Then choose human-readable dimensions whose product (minus openings if used) equals R.
