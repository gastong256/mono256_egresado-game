# Run state machine

A formal state machine prevents dead ends and ambiguous commands.

## Suggested macro states

```text
CREATED
→ ACTIVE_STAGE
→ ACTIVE_CHALLENGE
→ CHALLENGE_RESOLVED
→ [STORYLET | NEXT_CHALLENGE | RECOVERY | STAGE_COMPLETE]
→ ...
→ CAREER_COMPLETE
→ GRADUATED
→ [SUBMISSION_PENDING]
→ VERIFIED
```

The demo may end at `STAGE_COMPLETE` for 7.º rather than full career.

## Command legality

Each state declares valid commands. Examples:

- `ACTIVE_CHALLENGE`: choose/update answer, submit answer.
- `CHALLENGE_RESOLVED`: continue.
- `STAGE_COMPLETE`: continue to next year or end demo.
- `GRADUATED`: request/submit official result in shell, not mutate domain score from UI.

## Invariants

- no `submitAnswer` twice unless interaction explicitly supports multi-round state;
- no progression before resolved state;
- exactly one current challenge slot;
- official run descriptor never changes;
- completed challenge result immutable;
- transition result deterministic.

## Recovery

Recovery is a normal schedulable content state, not an exceptional failure branch.
