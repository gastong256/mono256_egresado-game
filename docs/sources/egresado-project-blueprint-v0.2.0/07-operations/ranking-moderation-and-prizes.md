# Ranking moderation and prize operations

## Public ranking fields

Recommended minimal display:

- rank;
- nickname;
- FairScore;
- optional public secondary metric(s) only if teachers approve.

Do not publish hidden mastery or personal identifiers.

## Winner determination

Prize result should be derived from **verified personal-best runs only**.

Before the fair, organizers must approve:

- number of winners;
- attempt policy;
- rank comparator;
- true-tie policy;
- cutoff time;
- handling of late pending submissions;
- moderation policy for nicknames.

## Cutoff

Define server-side event closing timestamp and whether a run issued before close may submit after close within a grace period.

## Audit export

At close, export top candidates with:

- participant internal id;
- nickname;
- best run id;
- score breakdown;
- version tuple;
- verification status;
- tie-break metrics.

This allows organizers to confirm winners without relying only on the public UI.
