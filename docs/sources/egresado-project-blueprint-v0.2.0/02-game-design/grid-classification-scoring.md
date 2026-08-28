# Grid-classification minigame scoring

The 25 de Mayo concept exposed a useful general scoring problem: selecting one correct tile can have 100% *precision* while missing most correct tiles.

## Confusion categories

- `TP`: correct targets selected.
- `FP`: incorrect tiles selected.
- `FN`: correct targets not selected.

## Metrics

`precision = TP / (TP + FP)`

`coverage/recall = TP / (TP + FN)`

If the denominator is zero, define safe deterministic behavior explicitly.

## Earlier simple proposal

`score = 0.6 × precision + 0.4 × coverage`

This works and makes coverage matter.

## Recommended generalization

Use F1 unless the content owner deliberately wants asymmetric penalties:

`F1 = 2 × precision × coverage / (precision + coverage)`

F1 is zero if either side collapses and prevents a player from earning a high result by selecting only one obvious target.

If missing a required step should matter more than false selection, use `Fβ` with a documented β—not an unexplained weight.

## Candidate outcome bands

- `1.00` — perfect
- `>= 0.85` — excellent/optimal-level
- `>= 0.60` — resolved
- `>= 0.40` — partial/survived
- `< 0.40` — insufficient

Thresholds are provisional and require teacher/content tuning.

## Aura mapping is contextual

A perfect public performance might award large Aura; the same classification mechanic in a normal worksheet context should award none. Mathematical quality does not automatically create Aura.
