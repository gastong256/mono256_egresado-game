# Traceability matrix

| Requirement | Design/Domain | Engine | Validation |
|---|---|---|---|
| Replayable variants | ScenarioFamily/Template/Variant | variant generator/catalog | seed property tests |
| No memorized fixed answer | template diversity + shuffle | run schedule | distribution audit |
| Math-dominant ranking | score policy | scoring engine/server verifier | synthetic ranking simulation |
| Unlimited attempts without grinding score | personal best | leaderboard comparator | E2E repeated runs |
| No global Game Over | fail-forward | progression state machine | graduation property test |
| Promedio/Equipo/Aura/Estilo only | career model | CareerState | migration tests/UI snapshots |
| Hidden mastery | pedagogy/engine | mastery state | no-HUD exposure test |
| Selected != correct | Design System | presentation state | component regression test |
| Competitive fairness | difficulty budget | run scheduler | budget invariant/stat audit |
| Prize score integrity | server authority | replay verifier | tamper E2E/security tests |
| Poor Wi-Fi tolerance | local-first | pending submission | network E2E |
| Accessibility | design/WCAG | semantic UI | axe + manual keyboard |
