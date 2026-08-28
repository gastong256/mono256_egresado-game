# Server-authoritative fair mode with local-first play

## Desired balance

Fair Wi-Fi may be poor, but prizes require score integrity.

Recommended architecture:

1. Server issues signed/recorded RunDescriptor with balanced variant schedule.
2. Browser plays mostly locally using deterministic engine.
3. Browser persists action log locally during run.
4. On completion, client submits action log + run id, not trusted score.
5. Server replays and computes official score.
6. If network is temporarily unavailable, submission stays pending and retries idempotently.

This minimizes round trips without trusting the client with the leaderboard.

## Trust boundaries

Client controls presentation and captures input. Server controls:

- official run issuance;
- official competition versions;
- score computation/verification;
- leaderboard best result;
- moderation/admin actions.

## Abuse controls

- rate-limit run issuance/submission;
- cap action-log size and command count;
- validate all ids/versions;
- reject unknown variant assignments;
- admin endpoints require strong authorization;
- monitor abnormal submission volume or impossible timing.
