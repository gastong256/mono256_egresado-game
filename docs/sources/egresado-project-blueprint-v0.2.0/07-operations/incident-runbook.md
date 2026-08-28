# Fair incident runbook

## P0 — ranking integrity compromised

Examples: arbitrary score submission accepted, wrong score version, systemic evaluator error.

Actions:

1. stop official leaderboard writes if needed;
2. preserve logs/run descriptors/actions;
3. keep gameplay available in non-official state only if clearly communicated;
4. fix/version;
5. replay/regrade affected runs if possible;
6. communicate organizer decision.

## P1 — game unavailable

- check hosting/database/edge status;
- verify health endpoints;
- scale/restart only documented services;
- preserve pending client runs;
- use fallback page/instructions if outage persists.

## P1 — submissions failing but gameplay works

- queue/retry pending submissions;
- avoid asking players to replay immediately;
- monitor idempotent recovery.

## P2 — inappropriate nickname

Hide/moderate from public board while preserving internal participant/run reference for prize resolution.

## Rule

Do not change score/content mid-event as an ad-hoc “fix”. Use versioned incident procedure.
