# Real delivery lifecycle

This project has a specific real-world delivery sequence. Architecture and planning must reflect it.

## Phase A — 7.º Demo Candidate

Build a polished playable 7.º slice representative of the final product.

### Audience
Mathematics Department teachers.

### Purpose
Validate:

- concept;
- mathematical appropriateness;
- situations and tone;
- Game UI;
- career model;
- variation/replayability direction;
- scoring/ranking proposal.

There is **no real student playtest before full production**. Teacher validation is a proxy gate, not equivalent evidence of student appeal.

## Phase B — Teacher Gate 1

Teachers accept or request changes.

Expected output:

- content corrections;
- difficulty guidance;
- approval or adjustment of scoring principles;
- approval of the game direction.

## Phase C — Foundation Freeze

After accepted changes, freeze foundational behavior and visual system. Avoid reopening architecture or design without a major defect.

## Phase D — Complete Game Production

Implement:

`7.º → 1.º → 2.º → 3.º → 4.º → 5.º → Egreso`

plus:

- complete scenario catalog;
- procedural/deployed variants;
- ranking;
- event backend;
- authoritative verification;
- moderation/operations.

## Phase E — Teacher Gate 2

Show complete candidate. This is acceptance/last-detail review, not another broad concept exploration.

Review:

- final content;
- level progression;
- score/ranking behavior;
- duration;
- competition rules;
- presentation details.

## Phase F — Competition Freeze and Production Hardening

Freeze content/rules/scoring versions. Then run simulation, load, network, security, accessibility, mobile and operational tests.

## Phase G — Fair Week

Students and other visitors play online and compete. Best score/personal best or final attempt policy is defined by event config after teacher approval.

## Phase H — Post-fair

Choose whether to keep the game online, archive the event ranking, create free-play mode, or evolve the product.

## Consequence of no pre-fair student playtest

This is a material product risk. Compensating controls:

- highly conservative interaction clarity;
- teacher proxy testing;
- browser/mobile manual QA;
- automated accessibility;
- seeded simulation at scale;
- content validation;
- ranking distribution simulation;
- anonymous operational telemetry during fair;
- strong first-day monitoring;
- rules frozen once official competition starts.
