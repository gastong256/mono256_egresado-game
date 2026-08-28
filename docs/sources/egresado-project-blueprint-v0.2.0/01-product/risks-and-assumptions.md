# Risks and assumptions

| Risk | Impact | Mitigation |
|---|---:|---|
| First real student test occurs during fair | High | teacher proxy gate, conservative UX, simulation, telemetry, hardening |
| Procedural variant is ambiguous/impossible | High | pre-generated/deployed competitive variants + invariant tests |
| Unlimited attempts favor time available | Medium | personal-best not cumulative; attempts policy configurable; difficulty-equated runs |
| Players reroll for easy runs | Medium | difficulty budget, matched variant pools, server-issued descriptors |
| Ranking score can be forged | High | server replay/authoritative score, never trust submitted final score |
| Scoring over-rewards speed | High | math dominates; time only late tie-breaker |
| Score duplicates academic performance twice | Medium | separate MathPerformance from visible Promedio; avoid double counting |
| Estilo becomes an optimization target | Medium | do not score it directly |
| Math too easy for adults / too hard for 12yo | High | low-floor/high-ceiling design; complexity via constraints/optimization |
| Visual design drifts back toward reference games | Medium | approved v0.2 Design System + distance checklist |
| Wi-Fi instability loses official run | High | local-first play after issued descriptor, durable pending submission |
| Rules change mid-fair | High | content/rules/score freeze + versioning + replay/regrade capability |
| Inappropriate nicknames | Medium | validation, moderation/hide, minimal identity |
