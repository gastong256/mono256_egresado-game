# Functional specification

## F-001 — Start a run

The player enters a nickname/anonymous identity according to event configuration and starts a run. For official fair mode the run must receive an authoritative descriptor before it can become prize-eligible.

Acceptance:

- run id is unique;
- descriptor includes all rule/content/score versions;
- run seed/variant schedule is immutable after start;
- client can persist the active run locally.

## F-002 — Present a challenge variant

The engine selects the assigned family/template/variant for the current slot and exposes only the public view required by the renderer.

Acceptance:

- no answer/evaluator secret leaks through public content shape;
- variant is reproducible from descriptor/catalog;
- challenge renderer does not own domain correctness.

## F-003 — Submit interaction command

UI transforms interaction into a typed command. Engine validates command against current state.

Invalid command must not mutate state.

## F-004 — Resolve challenge

Engine evaluates response and returns:

- outcome quality;
- calculation/explanation data;
- career effects;
- hidden mastery/flags;
- competition performance dimensions;
- next progression state.

## F-005 — Apply career effects

Only semantically relevant dimensions change. `null` means not introduced. Promedio comes from grades/academic events rather than arbitrary generic increments.

## F-006 — Continue after failure

Insufficient/failed academic outcomes do not create a global terminal state. If product content enables recovery, progression schedules a compressed recovery/pending-subject event.

## F-007 — Complete year

Year milestone summarizes relevant career state and progresses to next stage. 7.º demo ends here.

## F-008 — Complete full career

Full product ends at `GRADUATED`, derives final archetype and creates final run summary.

## F-009 — Compute demo/official score

Score engine consumes evaluator performance and versioned score policy. UI never invents score.

## F-010 — Official submission

Client submits run/action log. Server replays/verifies and computes official score. Arbitrary client `score` field is ignored/rejected.

## F-011 — Leaderboard personal best

Official verifier updates participant's best run according to comparator. Lower run remains in audit history but does not replace public personal best.

## F-012 — Resume

When supported, refresh restores a compatible serialized run. Version mismatch has explicit migration/invalidation path.

## F-013 — Moderation

Organizer can hide/edit public nickname presentation without mutating historical run score.
