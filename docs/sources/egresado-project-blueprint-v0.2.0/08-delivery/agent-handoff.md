# Future implementation-agent handoff

## Mandatory first steps

1. Read repository `AGENTS.md` and all current docs.
2. Inspect actual engine/code/tests before modifying state.
3. Read final Claude Design handoff and `resources/img` for visual authority.
4. Read this blueprint decision-status/register.
5. Produce a conflict map: repository current state vs blueprint vs design handoff.
6. Do not implement `RECOMMENDED/TEACHER GATE` constants as permanent magic numbers; create explicit versioned/configurable policy.

## Critical migrations

- old career stats → Promedio/Equipo/Aura/Estilo + hidden mastery/flags;
- fixed challenge definitions → family/template/variant-compatible structure where practical;
- ambient/random ad hoc variation → deterministic seed ownership;
- provisional score → explicit score engine separate from visible career stats.

## Do not

- move math evaluation into React;
- trust client final score;
- add a chart library solely for Estilo;
- expose mastery as Knowledge;
- score Estilo directly;
- make speed primary;
- generate uncontrolled fair variants at runtime;
- modify official competition rules after freeze without versioning;
- treat teacher review as proof of student engagement.

## Completion evidence

Require command/test logs, simulation statistics, exact version mapping, screenshots/visual QA and an explicit list of unresolved teacher-gate decisions.
