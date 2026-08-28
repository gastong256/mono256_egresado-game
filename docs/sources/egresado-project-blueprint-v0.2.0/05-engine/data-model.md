# Target data model — conceptual

Names should adapt to actual repository/database conventions.

## Event

- id
- name
- starts/ends
- status: draft/frozen/live/closed
- allowed version tuple
- attempts policy
- public ranking settings

## Participant

- pseudonymous id
- event id
- nickname
- moderation status
- created timestamp

## Run

- run id
- participant/event
- descriptor/version tuple
- seed/schedule
- state: issued/completed/pending/verified/rejected
- timestamps

## Run actions

Canonical ordered actions or compact immutable action log.

## Verified result

- score breakdown
- career summary
- archetype if full game
- rank tuple
- verification metadata

## Participant best

Materialized/reference row to best verified run for event, updated transactionally.

## Variant catalog

- catalog version
- template id
- seed/fingerprint
- difficulty metadata
- approval/test status

## Moderation audit

- moderator
- participant/nickname
- action/reason
- timestamp.
