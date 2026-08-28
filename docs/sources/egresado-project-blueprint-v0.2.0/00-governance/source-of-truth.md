# Source-of-truth hierarchy

Different artifacts answer different questions.

| Domain | Primary authority |
|---|---|
| Game behavior, math, commands, transitions | current repository docs + deterministic engine + tests |
| Visual identity, tokens, Game UI presentation | final Claude Design v0.2 handoff + screenshots |
| Product decisions in this refinement | this blueprint decision register |
| Actual current implementation state | repository code |
| Competitive event configuration | versioned server/event config after teacher approval |

## Conflict rule

1. Do not let a screenshot silently change mathematical rules.
2. Do not let legacy frontend styling override the approved design handoff.
3. Do not let old documentation override a newer explicit product decision without documenting the conflict.
4. When a score/ranking rule is still marked `TEACHER GATE` or `OPEN`, implement it behind versioned/configurable policy rather than hardcoding an irreversible assumption.

## Version identifiers required for official fair runs

Every official run should ultimately be attributable to at least:

- `engineVersion`
- `rulesetVersion`
- `contentVersion`
- `scoreVersion`
- `variantCatalogVersion`
- event/competition identifier

These identifiers permit reproducibility, audit, regrading and incident response.
