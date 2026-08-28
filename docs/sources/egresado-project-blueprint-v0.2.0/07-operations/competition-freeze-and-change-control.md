# Competition freeze and change control

## Before official start

Freeze:

- `rulesetVersion`;
- `contentVersion`;
- `variantCatalogVersion`;
- `scoreVersion`;
- leaderboard comparator;
- attempt policy.

## During official competition

Allowed without score-version change:

- visual bug fix that does not alter information/answering;
- crash fix preserving semantics;
- infrastructure scaling;
- moderation fix.

High-risk changes:

- challenge data;
- evaluator logic;
- score coefficients;
- difficulty factor;
- answer options;
- randomization.

If unavoidable, create a versioned incident decision and determine whether all prior runs can be replayed/regraded consistently.

## Audit

Keep deployment timestamp/version and event config history.
