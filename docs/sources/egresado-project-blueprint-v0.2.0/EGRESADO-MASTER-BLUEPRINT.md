# EGRESADO — MASTER PROJECT BLUEPRINT v0.2.0

> Consolidated agent-readable view. Individual files remain the maintainable source and retain their decision status.


---

<!-- SOURCE: 00-governance/decision-register.md -->

# Decision register

| ID | Decision | Status | Rationale |
|---|---|---|---|
| D-001 | UI-first visual identity | LOCKED | Identity should come from system, not hundreds of assets. |
| D-002 | Claude Design paper-grid v0.2 | LOCKED | Replaces derivative dark sports-career look. |
| D-003 | Promedio/Equipo/Aura/Estilo only | LOCKED | Compact career identity; avoids redundant RPG stats. |
| D-004 | Hidden mathematical mastery | LOCKED | Useful for engine/analytics; avoids duplicate visible Knowledge stat. |
| D-005 | No global Game Over | PRODUCT DIRECTION | Errors should produce paths/recovery, not terminate participation. |
| D-006 | ScenarioFamily/Template/Variant | RECOMMENDED | Scales replayability without authoring hundreds of separate challenges. |
| D-007 | Seeded deterministic variants | LOCKED architecture direction | Reproduction, fairness, debugging, replay. |
| D-008 | Competitive deployed/prevalidated variants | RECOMMENDED | Avoid impossible/ambiguous RNG cases during a prize event. |
| D-009 | Unlimited attempts + personal best | RECOMMENDED/TEACHER GATE | Rewards learning without making cumulative time-on-task the score. |
| D-010 | FairScore separate from career stats | RECOMMENDED | Career identity and competition have different semantics. |
| D-011 | Math dominates FairScore | RECOMMENDED/TEACHER GATE | Mathematics fair should primarily reward mathematical performance. |
| D-012 | Estilo not scored directly | RECOMMENDED | Avoid making one personality the objectively correct build. |
| D-013 | Deep deterministic tie breakers | RECOMMENDED/TEACHER GATE | Makes ties rare without random score noise. |
| D-014 | Difficulty budget per competitive run | RECOMMENDED | Better comparability across procedural variants. |
| D-015 | Low-floor/high-ceiling task design | RECOMMENDED principle | Wide age range requires accessible entry plus deeper reasoning ceiling. |
| D-016 | No real student playtest before fair | EXTERNAL CONSTRAINT | Must be compensated by teacher gate, simulation, QA and telemetry. |
| D-017 | Score/rules freeze during official event | RECOMMENDED operations rule | Equal competition conditions. |


---

<!-- SOURCE: 00-governance/decision-status.md -->

# Decision status and interpretation rules

## Why this file exists

Several ideas evolved during design. Some are final, others are strong proposals still requiring teacher validation. Future agents must not flatten those differences.

## LOCKED foundations

- Web-first/mobile-first game, Spanish `es-AR`.
- Pure deterministic game engine separated from React/UI.
- Same seed + versions + command sequence must reproduce the same logical run.
- UI-first artistic economy: the game must work without a large illustration pipeline.
- Visual system v0.2 from Claude Design is the visual source of truth.
- Persistent visible career model is limited to **Promedio, Equipo, Aura, Estilo**.
- Estilo axes: **Aplicado, Estratega, Improvisador**; none is intrinsically bad.
- Mathematical mastery and narrative flags/history are hidden engine systems, not HUD stats.
- `null/not introduced` is not equivalent to numerical zero for player stats.
- Challenge result and persistent career identity are separate concepts.
- Selected choice must never visually reveal whether it is correct before evaluation.
- Errors do not shame the player and should produce comprehensible consequences.
- Art is selective; ordinary situations default to zero or one contextual image.
- No permanent Energy/Fatigue/Money/Knowledge/Initiative RPG-style HUD.
- Current visual geometry: radius 0, no conventional shadows, border-driven hierarchy, paper grid canvas, as specified in the design handoff.

## PRODUCT DIRECTION

- Completed runs should converge on **EGRESADO**; failure changes the path, consequences, recovery and final profile rather than creating a global Game Over.
- Repetition/recovery should be represented as compressed story/game events, not replaying an entire school year.
- Full product progression: `7.º → 1.º → 2.º → 3.º → 4.º → 5.º → EGRESO`.
- Fair mode should support repeat play and reward improvement rather than cumulative grinding.
- Competitive ranking must be server-verifiable and versioned.

## RECOMMENDED — implement configurably

- Content architecture `ScenarioFamily → Template → deterministic Variant`.
- Build/deploy-time prevalidation of competitive variants rather than unconstrained runtime random generation.
- Unlimited attempts in fair mode with **personal best** as leaderboard score.
- Math-dominant composite FairScore, candidate weighting around 80% math / 15% team-game decisions / 5% Aura contribution.
- Estilo should not directly add FairScore; otherwise one personality becomes objectively superior.
- Promedio should not be added separately to FairScore when it is already driven by mathematical academic performance; avoid double counting.
- Deep lexicographic tie-breaking: FairScore → MathRaw → optimal count → accuracy → difficulty solved → active time. Exact ties should be rare, but the event still needs an organizer policy.
- Difficulty bands `CORE / STANDARD / STRETCH` and a per-run difficulty budget to keep different runs comparable.
- Mathematical difficulty should grow mainly through constraints, interpretation, multi-step reasoning and optimization—not by requiring advanced curriculum.

## TEACHER GATE

Validate before full production freeze:

- mathematical level and terminology;
- accepted challenge catalog by school year;
- exact FairScore weights and caps;
- exact outcome-to-score mapping;
- whether attempts are unlimited or capped for prizes;
- ranking/tie policy;
- recovery/previa language;
- total expected run duration;
- content tone and context plausibility.

## OPEN

- Exact final score coefficients.
- Exact Estilo nudge weights.
- Exact number of challenges/templates per year.
- Whether 25 de Mayo becomes a production 7.º challenge or remains a design exemplar.
- Whether fair ranking shows only best run or also selected secondary metrics publicly.
- Exact true-tie prize policy.

## DEFERRED

- Character/Avatar system.
- Full character-art pipeline.
- Full alternate dark theme.
- Heavy PWA/offline architecture beyond what fair reliability needs.
- Complex social graph/accounts.
- Chat.
- Monetization.


---

<!-- SOURCE: 00-governance/glossary.md -->

# Glossary

**Scenario Family** — recognizable narrative domain such as Colectivo, Mural or Feria.

**Template** — a distinct mathematical decision structure within a family, e.g. bus delay vs route comparison.

**Variant** — concrete deterministic parameterization of a template.

**Seed** — integer/input used to deterministically select/generate a variant.

**Deployed Variant** — variant generated, validated and approved before competitive runtime.

**Outcome** — quality of the current challenge resolution: e.g. óptimo/resuelto/parcial/insuficiente.

**Career State** — Promedio, Equipo, Aura, Estilo plus hidden mastery/flags.

**MathPerformance** — competition-oriented normalized measure derived from challenge performance, not a visible career stat.

**FairScore** — official composite score used for ranking.

**Difficulty Budget** — expected difficulty mass assigned to a run so different generated runs remain comparable.

**Run Descriptor** — immutable identity/configuration of a run: versions, seed, selected variants and event metadata.

**Action Log** — canonical sequence of player commands used for replay/verification.

**Fail Forward** — errors change subsequent consequences/content instead of ending the game.

**Golden Seed** — known seed retained for deterministic regression tests.


---

<!-- SOURCE: 00-governance/source-of-truth.md -->

# Source-of-truth hierarchy

Different artifacts answer different questions.

| Domain | Primary authority |
|---|---|
| Game behavior, math, commands, transitions | current repository docs + deterministic engine + tests |
| Visual identity, tokens, Game UI presentation | final Claude Design v0.2 handoff + screenshots |
| Product decisions in this refinement | this blueprint decision register |
| Actual current implementation state | repository code |
| Competitive event configuration | versioned server/event config after teacher approval |

## Conflict rule

1. Do not let a screenshot silently change mathematical rules.
2. Do not let legacy frontend styling override the approved design handoff.
3. Do not let old documentation override a newer explicit product decision without documenting the conflict.
4. When a score/ranking rule is still marked `TEACHER GATE` or `OPEN`, implement it behind versioned/configurable policy rather than hardcoding an irreversible assumption.

## Version identifiers required for official fair runs

Every official run should ultimately be attributable to at least:

- `engineVersion`
- `rulesetVersion`
- `contentVersion`
- `scoreVersion`
- `variantCatalogVersion`
- event/competition identifier

These identifiers permit reproducibility, audit, regrading and incident response.


---

<!-- SOURCE: 01-product/full-project-scope.md -->

# Full project scope

## Progression

`7.º → 1.º → 2.º → 3.º → 4.º → 5.º → EGRESADO`

Each stage uses the same design/engine grammar. Later years should add content complexity, not a new UI system.

## Full product capabilities

- Complete school-career progression.
- Scenario families and deterministic variants.
- Multiple interaction patterns.
- Career model: Promedio / Equipo / Aura / Estilo.
- Hidden mathematical mastery and narrative flags.
- Fail-forward academic recovery where relevant.
- Final archetype/title.
- Official fair scoring.
- Event leaderboard.
- Unlimited or configured attempts.
- Personal-best ranking by default recommendation.
- Versioned competition rules/content.
- Server verification/replay of official runs.
- Nickname moderation.
- Fair operations and incident procedures.
- Responsive web delivery.

## Content-production recommendation

Do not author years sequentially without a catalog. After Teacher Gate 1, create a complete matrix for 1.º–5.º identifying:

- scenario;
- math concept;
- interaction type;
- family/template;
- difficulty band;
- career effects;
- score dimension;
- narrative flags;
- required assets;
- validation invariants.

Then implement incrementally by year.

## Target variety

A useful planning range is roughly 6–8 meaningful situations per year, but this remains a **planning recommendation**, not a fixed requirement. Throughput and run-duration constraints must determine final counts.


---

<!-- SOURCE: 01-product/personas-and-contexts.md -->

# Personas and usage contexts

## Student 12–17

Needs fast comprehension, non-childish tone, accessible entry and no shame-based failure.

## Competitive student

Wants to improve personal best, understand score consequences and compare ranking.

## Parent / teacher / adult visitor

Should still find the reasoning interesting even if the mathematical curriculum is familiar. The challenge ceiling should come from interpretation and optimization, not advanced formulas.

## Mathematics teacher

Needs mathematically valid content, transparent rationale, reviewable variants and clear mapping from challenge to concept.

## Fair organizer

Needs stable competition rules, ranking moderation, incident handling and a way to identify prize winners without exposing unnecessary personal data.

## Developer / content author / AI agent

Needs strict content schemas, deterministic generators, invariant tests, source-of-truth rules and versioning.

## Context constraints

- Mobile devices around 360–430 px are primary.
- Fair Wi-Fi may be degraded.
- Multiple people may start/finish simultaneously.
- The game should remain playable locally after an official run is issued, minimizing round trips.
- No essential interaction depends on hover.


---

<!-- SOURCE: 01-product/product-vision.md -->

# Product vision

## One-line definition

**Egresado** is a short web game in which the player travels through school years, uses accessible mathematics to make practical/social decisions, builds a recognizable school-career identity and eventually graduates.

## Product promise

The mathematics is not a quiz inserted between game scenes. The numbers should change what action is rational, viable, efficient or optimal.

### Litmus test

> If the numbers can be removed and the decision remains essentially the same, the mathematics is decorative and the challenge should be redesigned.

## What the player is discovering

Not primarily: “Can I pass?”

Rather:

- What decisions did I make?
- How did I solve problems?
- What average did I build?
- How did I work with others?
- Which moments gave or cost Aura?
- Did I behave more like an Aplicado, Estratega or Improvisador?
- What kind of Egresado did I become?

## Fair-week product objective

During the school fair, Egresado also becomes a repeatable competition. Players can improve their personal best through understanding and practice while the ranking remains mathematically dominant, reproducible and auditable.

## Anti-goals

Egresado is not:

- an LMS;
- a conventional test with animation;
- a complete simulation of school life;
- a sports-career game reskinned for school;
- an RPG stat optimizer;
- a speed-math contest;
- a system where the person with the most free time wins by accumulating runs.


---

<!-- SOURCE: 01-product/real-delivery-lifecycle.md -->

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


---

<!-- SOURCE: 01-product/risks-and-assumptions.md -->

# Risks and assumptions

| Risk | Impact | Mitigation |
|---|---:|---|
| First real student test occurs during fair | High | teacher proxy gate, conservative UX, simulation, telemetry, hardening |
| Procedural variant is ambiguous/impossible | High | pre-generated/deployed competitive variants + invariant tests |
| Unlimited attempts favor time available | Medium | personal-best not cumulative; attempts policy configurable; difficulty-equated runs |
| Players reroll for easy runs | Medium | difficulty budget, matched variant pools, server-issued descriptors |
| Ranking score can be forged | High | server replay/authoritative score, never trust submitted final score |
| Scoring over-rewards speed | High | math dominates; time only late tie-breaker |
| Score duplicates academic performance twice | Medium | separate MathPerformance from visible Promedio; avoid double counting |
| Estilo becomes an optimization target | Medium | do not score it directly |
| Math too easy for adults / too hard for 12yo | High | low-floor/high-ceiling design; complexity via constraints/optimization |
| Visual design drifts back toward reference games | Medium | approved v0.2 Design System + distance checklist |
| Wi-Fi instability loses official run | High | local-first play after issued descriptor, durable pending submission |
| Rules change mid-fair | High | content/rules/score freeze + versioning + replay/regrade capability |
| Inappropriate nicknames | Medium | validation, moderation/hide, minimal identity |


---

<!-- SOURCE: 01-product/scope-demo-7mo.md -->

# Scope — 7.º Demo Candidate

## Goal

The 7.º demo is not a throwaway prototype. It should be a **vertical slice of the final architecture and visual identity** that lets teachers decide whether the project should be expanded to all years.

## Must prove

1. Egresado has its own visual identity.
2. Mathematics changes decisions rather than acting as trivia.
3. Different interaction patterns are possible.
4. Promedio / Equipo / Aura / Estilo form a sufficient career identity.
5. A second run is meaningfully different from the first.
6. Outcomes explain why a decision worked.
7. The engine can generate/replay deterministic variants.
8. The same UI/game foundations can scale to later years.

## Existing authored challenge families to preserve

The repository/design history identifies current content around:

- `bus-timing` / colectivo;
- `mural-paint`;
- `notebook-offer`;
- `group-tasks`;
- `stand-supplies` / feria/presupuesto.

Their existing mathematics should not be rewritten casually. The demo upgrade should make them **families**, not single memorized answers.

## Recommended demo content structure

For each core family, target at least 2 templates and several deterministic variants. The second teacher run should visibly change values and ideally change the reasoning pattern for some families.

Example:

### Colectivo
- delay percentage;
- latest departure;
- route comparison;
- service frequency.

### Mural
- coverage;
- coverage minus openings;
- package/cost optimization.

### Notebook
- percentage vs fixed discount;
- installment/cash constraint;
- discount plus extra cost.

### Group project
- assignment by skills;
- capacity/time constraints;
- balanced allocation.

### Fair stand
- package selection;
- minimum requirements;
- budget optimization.

## Candidate additional minigame: 25 de Mayo

**Status: OPEN / recommended concept, not automatically production content.**

A folklore act can use a number grid and a changing memory-aid rule:

- even numbers;
- multiples of 3;
- prime numbers.

This is useful because it demonstrates math + social situation + Aura + a different interaction family. It should only enter production after math/content review.

## Demo scoring

A full online ranking is not required for Teacher Gate 1, but the demo should preferably expose a **run score breakdown prototype** so teachers can evaluate the competitive philosophy before full production.

## Demo completion

The player should reach a clear 7.º milestone and see a year summary. This is not the final full-game archetype reveal, but it must demonstrate the career model.

## Explicitly out of demo scope

- production prize leaderboard backend;
- full 1.º–5.º content;
- full recovery arcs;
- complex account system;
- character art pipeline;
- large asset library;
- final full-career archetype algorithm.


---

<!-- SOURCE: 01-product/success-metrics.md -->

# Success metrics

Because there is no target-student playtest before the fair, distinguish **pre-release quality gates** from **post-release evidence**.

## Pre-release measurable gates

- 100% competitive variants pass invariant validation.
- 100% official runs are reproducible by seed + version + action log.
- 0 known P0/P1 engine/ranking defects.
- 0 ambiguous-answer variants in deployed catalog.
- representative mobile flows pass at 360/390/430 px.
- keyboard and reduced-motion operation validated.
- score distribution simulations show no single answer position/template dominating unexpectedly.
- leaderboard cannot be updated from an arbitrary client-supplied score.

## Teacher Gate 1 indicators

- content accepted or has bounded correction list;
- teachers can explain mathematical objective of each demo family;
- ranking principles considered appropriate for fair competition;
- no foundational redesign requested.

## Fair telemetry indicators

Use aggregate/pseudonymous telemetry only as justified:

- run completion rate;
- median active run duration;
- challenge completion/outcome distribution;
- abandonment point;
- client/server error rate;
- ranking submission success;
- score distribution;
- repeated-run improvement distribution.

These metrics provide the first real student-use evidence and must not be misrepresented as pre-fair validated engagement.


---

<!-- SOURCE: 02-functional/functional-specification.md -->

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


---

<!-- SOURCE: 02-functional/traceability-matrix.md -->

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


---

<!-- SOURCE: 02-functional/user-flows.md -->

# User flows

## Demo flow

```text
Landing
→ nickname/setup
→ 7.º intro
→ challenge slot 1
→ feedback
→ ...
→ challenge slot N
→ 7.º complete
→ career summary + demo score
→ play again
```

Second run should select different valid variants/templates so replayability is visible.

## Full fair flow

```text
QR / URL
→ event landing
→ nickname / participant token
→ request official run
→ server issues descriptor
→ local-first gameplay
→ graduate
→ final summary
→ submit action log
→ pending verification state if necessary
→ server verified score
→ personal best / ranking
→ play again
```

## Network interruption

During an issued run:

```text
network lost
→ continue locally if all required variant data already available
→ finish
→ submission pending
→ retry idempotently
→ verified when connectivity returns
```

If no authoritative run could be issued before start, the app can offer non-official/free play rather than silently making an unverified run prize-eligible.

## Recovery flow

```text
academic insufficient
→ consequence
→ recovery required flag/event
→ compressed recovery challenge/storylet
→ next stage
```

No loop that forces replaying the same year indefinitely.


---

<!-- SOURCE: 02-functional/user-stories.md -->

# User stories

## Player

- As a player, I can start quickly without creating a conventional account.
- As a player, I can replay and receive different values/situations rather than memorizing one answer.
- As a player, I understand why an outcome was optimal/resolved/partial/insufficient.
- As a player, I can make mistakes and still finish the run.
- As a player, I see only career stats that have acquired meaning.
- As a player, I can improve my personal best without my total number of attempts being the score.
- As a keyboard user, I can complete every essential interaction.

## Teacher

- As a teacher, I can identify the mathematical concept and intended reasoning of each template.
- As a teacher, I can inspect representative variants and their worked rationale.
- As a teacher, I can understand/configure the scoring philosophy before the fair.

## Organizer

- As an organizer, I can see the official ranking and moderate inappropriate nicknames.
- As an organizer, I can identify which run/version produced a score.
- As an organizer, I can recover from transient submission failures without awarding duplicate entries.

## Developer/content author

- As an author, I define a template once and generate many valid deterministic variants.
- As a developer, I can reproduce a reported bug from run id/seed/version.
- As an engineer, I can add 1.º content without inventing new buttons/cards/colors/scoring architecture.


---

<!-- SOURCE: 02-game-design/challenge-families-and-variants.md -->

# Challenge families, templates and variants

## Problem solved

A single fixed challenge becomes memorized. Merely changing `25% → 15%` helps briefly but players still learn “the second option”. We need **structural variation**, not just numeric noise.

## Recommended hierarchy

```text
ScenarioFamily
  └─ Template
       └─ Variant(seed, parameters)
```

### Family
Narrative context: Colectivo, Mural, Notebook, Group Project, Fair Stand.

### Template
Distinct reasoning structure within the same setting.

### Variant
Concrete numbers/options generated or selected deterministically.

## Colectivo example

- Delay template: travel time + percentage delay.
- Latest departure template: derive latest safe departure.
- Route comparison template: compare two transport alternatives.
- Frequency template: next service + travel time + arrival deadline.

## Deterministic seed

Every variant must be reconstructable from run identity. Never call ambient `Math.random()` in domain logic.

Suggested derivation:

`variantSeed = H(runSeed, familyId, templateId, slotIndex, contentVersion)`

Use a stable owned derivation function so changing an RNG library does not silently reshuffle old competitions.

## Reverse generation / constraint-first generation

Prefer generating **from desired pedagogical properties**.

Example Mural:

Want 1L insufficient, 2L optimal, 4L valid but inefficient. With coverage `8 m²/L`, generate required area in `(8,16]`, then choose dimensions that create a readable value.

This is safer than generating arbitrary dimensions and hoping answer categories remain valid.

## Competitive deployed variants

For prize mode, do not rely solely on arbitrary runtime generation. Recommended pipeline:

`Generator → N candidate seeds → invariant tests → difficulty audit → approved deployed catalog → runtime deterministic selection`.

This is analogous to STACK's recommendation to pre-generate/test random question variants so learners are not exposed to impossible or defective random cases.

## Runtime variety without chaos

A deployed catalog can still provide hundreds/thousands of combinations. Runtime picks from validated variants using seed/run descriptor.

## Anti-memorization controls

- seeded option shuffle where semantically allowed;
- test answer-position distribution;
- avoid immediate repetition of same template/variant;
- maintain equivalent difficulty budget;
- do not expose seed as a way to cherry-pick.


---

<!-- SOURCE: 02-game-design/competitive-scoring-and-ranking.md -->

# Competitive scoring and ranking

## Core separation

Do **not** derive the competition by naïvely multiplying visible career stats.

Career model answers: “What kind of school career did I build?”

FairScore answers: “How strong was this official run under competition rules?”

These are related but not identical.

## Why `Aura × 1 + Math × 10 + Equipo × 5` is not directly valid

Those variables live on different scales:

- mastery may be `0–1`;
- Promedio `1–10`;
- Equipo `0–100`;
- Aura signed/unbounded.

Multipliers do not express real relative weight until each component is normalized.

## Recommended score architecture

Each challenge evaluator returns competition-relevant normalized performance in addition to career effects.

### Math quality

`q_i ∈ [0,1]`

Discrete starting calibration (TEACHER GATE):

- optimal: `1.00`
- resolved: `0.75`
- partial: `0.40`
- insufficient: `0.10`

Continuous interactions should use their actual quality metric.

### Difficulty-adjusted raw math

`MathRaw = Σ (1000 × q_i × difficultyFactor_i)`

`MathMax = Σ (1000 × 1.0 × difficultyFactor_i)`

`MathPerformance = 10000 × MathRaw / MathMax`

This normalizes runs even when templates differ.

## Team and Aura competition contributions

If teachers want “the whole career matters”, use bounded **event competition contributions**, not the final visible stat values themselves.

`TeamPerformance ∈ [0,10000]`

`AuraPerformance ∈ [0,10000]` after event-specific normalization/caps.

Raw Aura remains signed/unbounded for narrative use. Competitive Aura must be capped so one spectacular event cannot dominate the math competition.

## Candidate FairScore

**RECOMMENDED / TEACHER GATE:**

`FairScore = round(0.80 × MathPerformance + 0.15 × TeamPerformance + 0.05 × AuraPerformance)`

The exact coefficients are not locked. A prior `10:5:1` intuition would normalize to 62.5% / 31.25% / 6.25%, which likely gives too much competitive weight to team behavior for an individual mathematics fair. A candidate around 80/15/5 is easier to defend.

## Promedio

Do not add final Promedio independently if it is already driven by academic mathematical outcomes; that can double-count the same performance.

## Estilo

Do not directly score Estilo. Assigning score to Aplicado/Estratega/Improvisador would imply an objectively superior personality and destroy the profile concept.

## Unlimited runs

Recommended official policy:

- unlimited attempts or configurable attempt policy;
- leaderboard stores **personal best**, not sum of all runs.

This rewards practice without making sheer play volume the scoring metric. Apple GameKit guidance similarly recommends Best Score for repeatable challenge-style competition rather than accumulated activity that disadvantages newcomers.

## Tie handling

Do not add random noise or meaningless decimal points.

Recommended deterministic ranking tuple:

1. `FairScore DESC`
2. `MathRaw/MathPerformance DESC`
3. `OptimalCount DESC`
4. `Accuracy DESC`
5. `DifficultySolved DESC`
6. `ActiveTimeMs ASC`

This makes ties extremely unlikely while preserving mathematical quality over speed.

### Exact tie

Do not falsely promise that a meaningful score can *mathematically never tie*. Guaranteeing uniqueness requires an arbitrary unique key. For prize fairness, define an organizer policy: shared rank/prize or a short tie-break challenge. A server sequence/run id may provide stable display order but should not secretly decide a prize.

## Number of attempts must not be a tie-breaker

Using more runs as a positive tie-breaker rewards free time; using fewer runs penalizes practice. Keep attempt count informational unless teachers deliberately choose another policy.


---

<!-- SOURCE: 02-game-design/content-authoring-guide.md -->

# Content authoring guide

Every challenge/template should answer these questions before code exists.

## 1. Context

What recognizable school-life decision is happening?

## 2. Mathematical purpose

Which concept/relationship is necessary to decide well?

## 3. Decorative-math test

If the numbers disappear, does the decision meaningfully change? If no, redesign.

## 4. Interaction

Choice, numeric, timeline, budget, assignment, classification grid, chart/statistics, spatial, request-information, narrative choice, or genuinely new family.

## 5. Valid solution space

Define what makes a response insufficient, partial, resolved, optimal.

## 6. Variant constraints

Write invariants before generator code:

- at least one valid solution;
- no unintended multiple optimum unless explicitly designed;
- readable arithmetic;
- plausible school context;
- no duplicate choices;
- correct option position not fixed;
- target difficulty band.

## 7. Career effects

Does the event genuinely affect:

- Promedio?
- Equipo?
- Aura?
- Estilo?

Most events should affect one or two visible dimensions, not all four.

## 8. Competition effects

Define normalized math quality and any bounded team/Aura competition contribution separately from visible stats.

## 9. Hidden mastery/flags

Which math domains were exercised? What story flag should be written?

## 10. Feedback

Explain the decisive calculation/constraint. Avoid generic “incorrect”.

## Authoring record template

See `09-reference/examples/challenge-authoring-template.yaml`.


---

<!-- SOURCE: 02-game-design/core-loop-and-progression.md -->

# Core loop and progression

## Core loop

1. Present a recognizable school-life context.
2. Expose relevant data.
3. Ask for a decision or minigame action.
4. Evaluate through deterministic domain logic.
5. Explain calculation/constraint and consequence.
6. Apply only relevant career/hidden effects.
7. Advance narrative/progression.

## Outcome language

The exact repository vocabulary is authoritative; current intended grammar includes:

- **Óptimo** — best valid solution under the defined objective/constraints.
- **Resuelto / eficiente** — valid solution that meets goal but is not best.
- **Parcial** — meaningful progress but incomplete/suboptimal.
- **Insuficiente** — requirement not met.

Avoid reducing every result to “correct/incorrect”.

## Progression invariant direction

Year/stage advancement should be structurally independent from perfect performance. Academic failure can trigger recovery, pending subjects or alternate events, but a completed run should converge on graduation.

## Why fail-forward fits the product

A fair/demo experience should not eject a player because of mistakes. The meaningful consequence is the **career story and score**, not loss of access to the rest of the game.

## No life system

No hearts, limited lives or “three strikes”. Errors create consequences and additional narrative—not fewer minutes of game.


---

<!-- SOURCE: 02-game-design/difficulty-and-universal-playability.md -->

# Difficulty and universal playability

## Audience problem

The fair can include 7.º students, older students, parents and teachers. A single “medium curriculum level” will be too hard for some and trivial for others.

## Design principle: low floor, high ceiling, wide walls

Mathematics-task literature describes low-floor/high-ceiling tasks as accessible with limited prior knowledge while still allowing deeper mathematical thinking. “Wide walls” adds multiple pathways/representations.

For Egresado this means:

- easy to understand the situation;
- no advanced formula required just to enter;
- deeper reasoning emerges from constraints, tradeoffs and optimization;
- more knowledgeable players can distinguish themselves by finding better solutions, not by knowing university mathematics.

## Difficulty bands

Recommended authoring taxonomy:

### CORE
One main relationship, minimal cognitive branching.

### STANDARD
Two relationships/constraints, comparison or a small multi-step chain.

### STRETCH
Multiple constraints, optimization, information selection or competing objectives.

These labels are internal authoring/competition metadata, not necessarily shown to the player.

## Difficulty should rise through

- number of relevant relationships;
- constraints;
- need to filter irrelevant information;
- multi-step planning;
- optimization;
- comparison of alternatives;
- uncertainty/statistical interpretation.

Not primarily through:

- giant numbers;
- ugly decimals;
- advanced formulas;
- speed pressure.

## Supports are not cheating when the target is reasoning

If the target is choosing the best alternative, showing a formula or allowing a calculator may reduce irrelevant memory/mental-calculation barriers. CAST UDL guidance supports multiple means of representation, clarification of mathematical symbols, optimized challenge/support, and varied action/expression.

## Competitive caution: adaptive difficulty

Adaptive difficulty can be useful in free/learning mode, but unrestricted adaptation threatens ranking comparability. In official fair mode prefer **difficulty-equated runs** using a difficulty budget and matched variant pools.

## Difficulty budget

Example concept:

- 2 CORE
- 3 STANDARD
- 1 STRETCH

or a numeric budget `Σ difficultyCost ≈ constant`.

Each run may differ in context/values while having approximately equal expected challenge mass.

## Candidate difficulty multipliers

Provisional only:

- CORE `1.00`
- STANDARD `1.08`
- STRETCH `1.15`

Keep multipliers small. If they are too large, random assignment dominates skill rather than merely compensating difficulty.


---

<!-- SOURCE: 02-game-design/full-content-roadmap.md -->

# Full content roadmap

## Principle

Later years should become more sophisticated through decisions and constraints, not merely bigger numbers.

## Suggested progression themes — not final curriculum

### 7.º — learn the grammar
Time, percentages, area, budget, simple allocation, divisibility.

### 1.º — adaptation and organization
Schedules, proportional reasoning, first stronger evaluations, group dynamics.

### 2.º — autonomy
Resource tradeoffs, probability introductions, financial comparisons, project decisions.

### 3.º — interpretation
Statistics, samples, uncertainty, information requests, multi-variable choices.

### 4.º — responsibility
Larger projects, constraints, planning, optimization, richer narratives.

### 5.º — closure
Final projects, pending subjects/recovery, graduation events, future-facing choices.

Teachers own curriculum appropriateness. This roadmap defines game-design escalation, not the official mathematics syllabus.

## Production sequence after Teacher Gate 1

1. Build complete content matrix for 1.º–5.º.
2. Mathematics Department reviews matrix, not only finished screens.
3. Implement one year at a time with generator/variant tests.
4. Keep same Design System and engine abstractions.


---

<!-- SOURCE: 02-game-design/grade7-challenge-catalog.md -->

# 7.º challenge catalog — working blueprint

This is a design catalog, not an assertion that every template is already coded.

## Family: Colectivo

Math domains: time, percentages, comparison.

Templates:

1. **Delay percentage** — departure + normal duration + delay percentage + deadline.
2. **Latest departure** — derive the last safe bus time.
3. **Route choice** — compare duration/delay alternatives.
4. **Frequency** — next bus based on interval plus travel duration.

Primary career signal: Estilo. Normally not Promedio because it is not an academic evaluation.

## Family: Mural

Math: rectangle area, coverage, proportional reasoning, optimization.

Templates:

1. coverage packages;
2. subtract door/window opening;
3. coverage + package prices + budget.

Potential effects: Promedio when framed as graded project; Estilo; sometimes Equipo.

## Family: Notebook / purchase

Math: percentages, fixed discounts, installments, cash constraints, comparison.

Avoid simple “compute 20%” only. Use the result to select an option under a real constraint.

## Family: Group project

Math: capacity, allocation, scheduling/optimization.

Potential effect: Equipo + Estilo. It can have multiple valid solutions with an optimal balance.

## Family: Fair stand / supplies

Math: packages, minimum requirements, budget, optimization.

Builder interaction is preferable when it makes the constraints visible.

## Candidate: Acto 25 de Mayo

Math: parity/divisibility/primes through short classification rounds.

Narrative purpose: social/public moment where Aura makes semantic sense.

Status: teacher/content approval required.

## Variation target for demo

At least enough deployed variants/templates that a teacher can play twice and immediately observe meaningful difference. Do not claim “dynamic” if only answer order changes.


---

<!-- SOURCE: 02-game-design/graduation-and-fail-forward.md -->

# Graduation, recovery and fail-forward

## Intended invariant

> Every valid completed run reaches `GRADUATED`.

The player competes on quality and builds a distinct career, but is not locked out of completion.

## Separate progression from performance

Performance changes:

- Promedio;
- score;
- recovery content;
- flags;
- final archetype;
- Aura/Equipo/Estilo where contextually relevant.

Performance does **not** directly create a terminal “you cannot continue” state.

## Academic recovery pattern

Suggested compressed year states:

- promotion/direct closure;
- normal closure;
- recovery required;
- promotion “con lo justo” / pending subject callback.

A recovery can itself be imperfect. The system still converges through another compressed consequence rather than replaying the year indefinitely.

## Pending subjects

A hidden `academicDebt/pendingSubjects` structure can create callbacks:

`1.º: te quedó una previa → 2.º/3.º: esa previa sigue ahí → 5.º: final recovery arc`.

Do not expose this as another permanent HUD stat unless product later requires it.

## Property requirement

Property-based/simulation testing should attempt thousands of valid command sequences and establish:

- every completable run reaches `GRADUATED`;
- no academic-failure state is terminal;
- recovery cannot create a dead end;
- state remains serializable/replayable.


---

<!-- SOURCE: 02-game-design/grid-classification-scoring.md -->

# Grid-classification minigame scoring

The 25 de Mayo concept exposed a useful general scoring problem: selecting one correct tile can have 100% *precision* while missing most correct tiles.

## Confusion categories

- `TP`: correct targets selected.
- `FP`: incorrect tiles selected.
- `FN`: correct targets not selected.

## Metrics

`precision = TP / (TP + FP)`

`coverage/recall = TP / (TP + FN)`

If the denominator is zero, define safe deterministic behavior explicitly.

## Earlier simple proposal

`score = 0.6 × precision + 0.4 × coverage`

This works and makes coverage matter.

## Recommended generalization

Use F1 unless the content owner deliberately wants asymmetric penalties:

`F1 = 2 × precision × coverage / (precision + coverage)`

F1 is zero if either side collapses and prevents a player from earning a high result by selecting only one obvious target.

If missing a required step should matter more than false selection, use `Fβ` with a documented β—not an unexplained weight.

## Candidate outcome bands

- `1.00` — perfect
- `>= 0.85` — excellent/optimal-level
- `>= 0.60` — resolved
- `>= 0.40` — partial/survived
- `< 0.40` — insufficient

Thresholds are provisional and require teacher/content tuning.

## Aura mapping is contextual

A perfect public performance might award large Aura; the same classification mechanic in a normal worksheet context should award none. Mathematical quality does not automatically create Aura.


---

<!-- SOURCE: 02-game-design/narrative-and-storylets.md -->

# Narrative and storylets

## Purpose

Storylets turn independent challenges into a school career.

Use conditions over:

- year/stage;
- career state bands;
- flags/history;
- pending subjects;
- Aura/Equipo thresholds;
- Estilo tendencies;
- previous challenge outcomes.

## Callbacks

Examples:

- low Equipo → later group situation offers a different path;
- high Aura → invited to a visible school event;
- pending subject → later “esa previa sigue ahí” callback;
- strong Strategist tendency → contextual “ask for more information” option.

Do not trigger special branches constantly. Scarcity gives them narrative weight.

## Declarative conditions

Prefer versioned declarative AST/data over arbitrary executable JavaScript in content. This improves validation, server replay and authoring safety.

## Fail-forward narrative

A poor outcome should create new content, not remove content. Recovery, awkward storylets and alternate opportunities make mistakes interesting.


---

<!-- SOURCE: 02-game-design/player-career-model.md -->

# Player career model

## Visible permanent dimensions

### Promedio
Academic record. `1.0–10.0` style scale when applicable; `null` before a real grade exists. Should be derived from actual academic evaluations rather than arbitrary XP deltas.

### Equipo
Persistent collaboration behavior, conceptually `0–100`. It is not morality and should not look like a health bar.

### Aura
Signed narrative/social capital. It represents memorable or iconic moments, not mathematical correctness. It has no natural 0–100 ceiling.

### Estilo
Ternary profile:

- **Aplicado** — preparation, completeness, safe execution.
- **Estratega** — efficient allocation, relevant information, optimization.
- **Improvisador** — risk, shortcuts, last-minute/unconventional resolution.

No axis is intrinsically bad.

## Hidden dimensions

### Mathematical mastery
Per-domain latent state, e.g. geometry, percentages, proportional reasoning. Use for analytics/content decisions; do not expose as a visible “Knowledge” bar.

### Narrative flags/history
Record significant choices and prerequisites for storylets/callbacks.

## Progressive reveal

A stat that has never been established is `null`/absent, not zero. UI should reveal dimensions when they acquire meaning.

## Only show what changed

Result feedback lists only dimensions actually affected. Do not display `Aura +0`, `Equipo +0`, etc.

## Contradictions are desirable

A player can have:

- high Promedio and low Equipo;
- mediocre Promedio and huge Aura;
- high Equipo and Improvisador style.

This prevents the experience from becoming a single “fill every bar” optimization problem.

## Derived archetype

Final title is derived from career state + important flags. It is a narrative payoff, not a fifth stat.


---

<!-- SOURCE: 03-pedagogy/math-design-framework.md -->

# Mathematical design framework

## Central principle

The desired skill is **mathematical reasoning in context**, not mechanical recall in disguise.

## Design goals

- meaningful/authentic context;
- visible relationships between data and decision;
- action-oriented feedback;
- multiple representations when they reduce irrelevant barriers;
- low floor/high ceiling;
- stable mathematical correctness across variants.

## Cognitive difficulty vs arithmetic ugliness

Do not confuse difficulty with:

- large values;
- awkward decimals;
- time pressure;
- hidden formulas.

A richer challenge can use elementary arithmetic but require:

- combining constraints;
- selecting relevant information;
- checking feasibility;
- comparing alternatives;
- optimization;
- interpreting uncertainty.

## Example: mural ladder

CORE: area already given, compare coverage.

STANDARD: calculate area, compare packages.

STRETCH: subtract opening, respect budget/package prices, optimize waste/cost.

Same conceptual domain; increasing reasoning ceiling.

## Support design

If formula recall is not the target, provide formula/reference. If mental arithmetic is not the target, calculator support can be acceptable. This follows UDL's distinction between access barriers and the actual goal of a task.

## Feedback

A high-value explanation says:

- what relationship mattered;
- what was calculated;
- why the chosen option met or missed the constraint;
- why another option was more efficient/optimal.


---

<!-- SOURCE: 03-pedagogy/teacher-review-framework.md -->

# Mathematics Department review framework

Teachers are the formal pre-production content gate.

## Review each family/template on

1. **Curricular appropriateness** — is the mathematics reasonable for the intended stage?
2. **Correctness** — are all solution paths and feedback mathematically valid?
3. **Ambiguity** — could two interpretations reasonably change the answer?
4. **Context** — is the school-life situation credible and respectful?
5. **Cognitive target** — does difficulty come from intended reasoning rather than accidental arithmetic?
6. **Support** — should formula/calculator/reference be available?
7. **Outcome semantics** — do optimal/resolved/partial/insufficient labels make sense?
8. **Competition fairness** — is difficulty band plausible relative to other templates?

## Variant review

Teachers do not need to manually inspect every deployed variant if robust invariants exist, but they should inspect representative and edge variants per template/difficulty band.

## Deliverable

Use `08-delivery/teacher-gate-1-checklist.md` and a content matrix exported from the authoring schema.


---

<!-- SOURCE: 03-pedagogy/theory-basis.md -->

# Theory and industry basis

This document explains why the recommended systems exist. It is not an academic literature review exhaustive enough to claim causal proof for Egresado.

## 1. UDL — variability is expected

CAST UDL Guidelines 3.0 emphasize multiple means of engagement, representation, and action/expression; they explicitly recommend optimizing challenge/support, clarifying mathematical language/symbols, authentic relevance, varied response methods and action-oriented feedback.

Product implication:

- do not assume one representation works for every player;
- preserve keyboard/non-drag alternatives;
- remove irrelevant barriers when reasoning is the target;
- give feedback that supports action/reflection rather than shame.

## 2. Low floor / high ceiling / wide walls

Recent mathematics task-design literature identifies low-threshold/high-ceiling/wide-walls as an inclusion principle: accessible entry with room for stronger learners to extend reasoning, and potentially multiple pathways.

Product implication:

- make 7.º-level mathematical concepts approachable to everyone;
- make adult challenge come from constraints and optimization rather than advanced curriculum.

## 3. Procedural randomization requires validation

STACK uses pseudo-random seeded question variants and strongly recommends pre-generating/testing/deploying variants because random generation can create impossible or defective cases. Seeds let a specific variant be reconstructed.

Product implication:

- deterministic seeded variants;
- prevalidated fair catalog;
- golden seeds and variant tests;
- no uncontrolled runtime RNG during a prize competition.

## 4. Repeatable competition and personal best

Apple GameKit guidance notes that challenge leaderboards should avoid designs that reward sheer accumulated activity and recommends Best Score for repeatable challenges.

Product implication:

- unlimited/configured repeats can be pedagogically positive;
- official ranking should use personal best rather than total score across all attempts.

## 5. Property-based testing

fast-check documents deterministic/reproducible property-based testing through fixed/failure seeds and compatibility with standard test runners.

Product implication:

- test generator invariants across thousands of seeds;
- persist failing seeds;
- replay exact problematic variants.

## 6. WCAG 2.2

WCAG 2.2 covers programmatic names/roles/states, status messages and other interaction requirements relevant to custom game UI.

Product implication:

- semantic controls;
- programmatically announced feedback/status;
- keyboard operation;
- no color-only result semantics.

## 7. Server authority and API limits

OWASP game/API guidance emphasizes trust boundaries, server authority for sensitive game state, validation of client data, and resource/rate limits.

Product implication:

- client cannot post an arbitrary final score;
- server validates/replays official submissions;
- rate-limit run creation/submission/admin operations;
- limit payload/action-log sizes.

See `09-reference/research-basis.md` for URLs and retrieval notes.


---

<!-- SOURCE: 04-design/accessibility-and-interaction.md -->

# Accessibility and interaction constraints

## Hard requirements

- WCAG 2.2 AA-oriented implementation.
- Minimum useful touch targets around 44 px; final Design System defines actual sizes.
- Keyboard-complete interactions.
- One coherent visible focus treatment.
- No information conveyed only through color.
- Reduced-motion mode without loss of information.
- `lang="es-AR"`.
- Proper labels/status announcements.
- Drag interactions always have a non-drag path.

## Selection semantics

Before evaluation, selected means only “my choice”. Do not make it green/red based on correctness.

## Feedback semantics

Status requires text + mark/icon/shape + optional color reinforcement.

## Mathematical notation

Keep notation readable and explain symbols when needed. The game should not turn font/notation decoding into an unintended difficulty gate.


---

<!-- SOURCE: 04-design/assets-motion-audio.md -->

# Assets, motion and audio

## Raster budget

Design handoff budget: roughly 6–9 contextual/milestone raster assets for the 7.º foundation, not dozens.

Current raster generation is deferred. Screens must remain structurally complete without it.

## Motion

Simple deterministic motion only:

- enter;
- select;
- resolve;
- progress;
- stat/Aura change;
- milestone/confetti.

No generated video, sprite system or cinematic pipeline.

## Aura motion

Magnitude changes emphasis; negative Aura is intentionally restrained rather than using humiliating shake/buzzer behavior.

## Audio

Small sonic vocabulary only: select, confirm, continue, optimal, insufficient, progress, storylet, year-complete. Audio remains enhancement, not a requirement for comprehension.


---

<!-- SOURCE: 04-design/ui-art-foundation.md -->

# UI and art foundation summary

The final Claude Design handoff is authoritative. These constraints are repeated here because future engine/content work must respect them.

## Identity

“Hoja cuadriculada como canvas. Tinta como información. Oscuro sólo al decidir. Una única isla negra para Aura.”

## Final foundation from handoff

- warm paper canvas around `#F6F5F0`;
- 16 px visual grid;
- Schibsted Grotesk for titles/data;
- Libre Franklin for prose;
- mixed-case headings; uppercase reserved for small labels;
- all quantitative values use tabular numbers;
- radius `0` throughout;
- no conventional box shadows;
- border weight and background contrast create hierarchy;
- dark decision block focuses active choice;
- black Aura island is a distinctive game device;
- school-derived product families: green/red/white/gray plus lime action;
- green is not equivalent to “correct”; red is not equivalent to “wrong”;
- selection remains neutral/white until evaluation;
- correction mark/strike/underline provides a second semantic channel;
- game viewport around 412 px, centered on larger screens.

## Key current token examples from the handoff

- school/product green `#1B6B3A`
- red `#C0272D`
- action lime `#C6F24E`
- Aura green `#4AE88C` on black

Exact implementation must consume the actual handoff tokens, not this summary.

## Art economy

- default ordinary screen: zero image;
- maximum one contextual image for ordinary situation unless a genuine before/after is needed;
- assets should not carry functional UI text;
- no character consistency/LoRA pipeline needed at this stage;
- current visual system already works with zero raster assets.

## Why

The earlier dark/condensed system looked too much like Copero/El Ídolo. Egresado keeps their product principles—fast data, UI-first gameplay, clear decisions, milestones—but not their visual grammar.


---

<!-- SOURCE: 05-engine/api-contracts.md -->

# API contracts — conceptual fair backend

Exact framework/route naming follows repository conventions.

## POST /events/{eventId}/participants

Creates/resumes pseudonymous participant. Validate nickname length/characters and event state.

## POST /events/{eventId}/runs

Issues official RunDescriptor.

Server determines:

- rule versions;
- score version;
- seed;
- variant assignments.

Client cannot request an “easy” difficulty or arbitrary seed for prize mode.

## POST /runs/{runId}/submit

Payload:

- canonical action log;
- client completion metadata if useful;
- idempotency key.

Do not accept authoritative `fairScore` from browser.

Responses:

- verified result;
- pending/processing;
- rejected with non-sensitive reason code.

## GET /events/{eventId}/leaderboard

Returns moderated public best results, pagination/limit capped.

## Admin moderation endpoints

Separate authorization. Never exposed merely by obscurity.

## Contract limits

- nickname max length;
- action count/log bytes;
- request body size;
- rate limits;
- version validation;
- pagination limit.


---

<!-- SOURCE: 05-engine/career-state-migration.md -->

# Career-state migration

The Claude Design handoff explicitly states that the old visible model (`knowledge`, `team`, `initiative`, `energy` in the historical implementation) requires a **data migration**, not a CSS reskin.

## Target shape

Conceptual TypeScript:

```ts
type EstiloAxis = 'aplicado' | 'estratega' | 'improvisador';

type Estilo = Record<EstiloAxis, number>;

type CareerState = {
  promedio: number | null;
  equipo: number | null;
  aura: number | null;
  estilo: Estilo;
  mastery: Record<MathCategory, number>;
  flags: SetOrSerializableEquivalent<string>;
};
```

## Serialization caution

Native `Set` is not a JSON wire format. The actual engine snapshot schema should use a deterministic serializable representation (e.g. sorted string array) or codec.

## Estilo normalization

Decide one invariant and enforce it. The design handoff conceptualizes percentages summing to 100. The engine can store raw evidence weights and derive normalized percentages, or store normalized values. Prefer **raw cumulative evidence + derived percentages** if it avoids rounding drift and preserves history.

Example:

```ts
styleEvidence = { aplicado: 6, estratega: 9, improvisador: 3 }
stylePercent = normalize(styleEvidence)
```

This allows deterministic integer nudges and stable recalculation.

## Promedio

Prefer a grade ledger rather than arbitrary delta:

```ts
grades: [{ eventId, value, weight? }]
promedio = deriveAverage(grades)
```

Only create a grade when the event is genuinely academic.

## Event effects

An event should declare only dimensions that can actually change. Absence differs from zero.

## Migration impact audit

Before implementation trace:

- state types;
- commands/events;
- reducers/transitions;
- content effects;
- selectors;
- snapshots/codecs;
- replay;
- fixtures;
- simulations;
- UI adapters;
- persisted dev runs.


---

<!-- SOURCE: 05-engine/content-and-rules-versioning.md -->

# Content, rule and score versioning

## Why separate versions

A visual hotfix should not change scoring. A scoring formula change should not silently alter old runs. A content generator change should not make old seeds reconstruct differently.

Track separately:

- engine implementation;
- game rules/progression;
- content/templates;
- variant catalog;
- scoring;
- visual app release if useful.

## Competition freeze

Once official fair competition begins:

- do not change generator semantics;
- do not change score coefficients;
- do not change difficulty mappings;
- do not change content that affects score.

If a severe correctness bug requires change, create a new version and use replay/regrade policy. Do not mix scores from non-comparable versions without an explicit migration/recomputation.


---

<!-- SOURCE: 05-engine/data-model.md -->

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


---

<!-- SOURCE: 05-engine/difficulty-budget-scheduler.md -->

# Difficulty-budget run scheduler

## Objective

Procedural diversity must not make one official run substantially easier than another.

## Model

Assign each deployed variant/template a calibrated `difficultyCost`, initially derived from authoring bands and later refined from fair data.

Example starting costs:

- CORE: 1.00
- STANDARD: 1.50
- STRETCH: 2.10

These costs are *scheduling metadata*, distinct from score multiplier.

A run configuration specifies target budget and slot constraints:

```json
{
  "slots": 6,
  "targetDifficultyBudget": 9.2,
  "tolerance": 0.2,
  "requiredFamilies": ["bus", "mural", "notebook", "group", "fair"]
}
```

Scheduler deterministically selects variants so:

`abs(sum(cost_i) - targetBudget) <= tolerance`.

## Why separate cost from score multiplier

A scheduler may need strong separation between CORE and STRETCH to balance a run, while the score multiplier should remain small to avoid luck dominating ranking.

## No adaptive free advantage in competition

Do not silently lower a struggling player's official difficulty unless scoring/equating formally accounts for it and teachers approve. Adaptive free-play can be a later mode.

## Calibration

Before real data: expert/teacher judgment + structural features.

After fair: inspect empirical success rates/time, but do not retroactively redefine official score unless event policy permits replay/regrade.


---

<!-- SOURCE: 05-engine/persistence-and-resume.md -->

# Persistence and resume

## Client local persistence

During an active run persist enough to restore:

- RunDescriptor;
- canonical commands/action log;
- current snapshot if used as optimization;
- pending official submission state.

The action log + descriptor is the durable logical truth; snapshot is an optimization and must be versioned/validated.

## Restore strategy

1. Load persisted envelope.
2. Validate schema/version.
3. If compatible, restore snapshot or replay log.
4. If migration exists, migrate deterministically.
5. If incompatible, present explicit recovery message; do not crash or silently corrupt.

## Official pending submissions

Network retry must not create a new score entry. Use idempotent run submission.


---

<!-- SOURCE: 05-engine/run-state-machine.md -->

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


---

<!-- SOURCE: 05-engine/score-policy-configuration.md -->

# Score policy configuration

The scoring model must be versioned data/configuration, not scattered magic constants.

## Example

```ts
interface ScorePolicy {
  version: string;
  weights: {
    math: number;
    team: number;
    aura: number;
  };
  discreteQuality: {
    optimal: number;
    resolved: number;
    partial: number;
    insufficient: number;
  };
  difficultyMultiplier: Record<DifficultyBand, number>;
  auraContributionCap: number;
  tieBreakOrder: TieMetric[];
}
```

Validate:

- weights sum to 1;
- all coefficients are finite/in allowed ranges;
- score result cannot exceed expected range;
- version immutable after official freeze.

## Teacher decision should produce config

When the Mathematics Department approves `80/15/5` or another distribution, create a new explicit `scoreVersion`, not a hidden code edit.


---

<!-- SOURCE: 05-engine/scoring-replay-and-ranking.md -->

# Scoring, replay and ranking engine

## Never trust a submitted final score

Official client submission should send an immutable run identity plus canonical action log/result evidence. The server reconstructs/replays the run under the recorded versions and computes the official score.

## Run descriptor

At minimum:

```ts
interface RunDescriptor {
  runId: string;
  eventId: string;
  playerId: string; // pseudonymous
  runSeed: string | number;
  engineVersion: string;
  rulesetVersion: string;
  contentVersion: string;
  scoreVersion: string;
  variantCatalogVersion: string;
  slots: VariantAssignment[];
}
```

## Scoring output

Store a transparent breakdown:

- MathRaw;
- MathPerformance normalized;
- TeamPerformance normalized;
- AuraPerformance normalized;
- FairScore;
- optimal count;
- accuracy;
- difficulty solved;
- active time if measured;
- version.

## Replay verification

Server:

1. loads exact engine/content/rules version;
2. reconstructs variants;
3. replays commands;
4. rejects impossible/invalid action logs;
5. computes career state and competition score;
6. writes immutable official run result;
7. updates leaderboard personal best transactionally.

## Personal-best update

Update only if new rank tuple is better than current best according to the versioned comparator.

## Idempotency

Final submission must support idempotency by `runId`/submission id to avoid duplicate network retries creating multiple leaderboard entries.

## Time

If active time is a tie-breaker, define it carefully. Wall-clock time can be distorted by background tabs/network. Prefer engine-controlled active intervals or server-verifiable start/end events, and use time only after mathematical tie-breakers.


---

<!-- SOURCE: 05-engine/server-authoritative-fair-mode.md -->

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


---

<!-- SOURCE: 05-engine/target-engine-architecture.md -->

# Target engine architecture

## Fundamental boundary

```text
Browser / React
    ↓ commands
Application/Game Controller
    ↓
Pure Deterministic Engine
    ↓
State + Domain Events + Effect Descriptors
    ↓
Adapters / persistence / server verification
```

The engine must not depend on React, DOM, localStorage, Supabase or ambient time/randomness.

## Pure transition target

Conceptually:

`transition(state, command, deterministicContext) -> TransitionResult`

## New capabilities required by current product direction

1. CareerState v0.2 migration.
2. ScenarioFamily/Template/Variant abstraction.
3. Stable RNG/seed derivation.
4. Variant validators and deployed catalogs.
5. Difficulty metadata/budget.
6. Competition score breakdown separate from career stats.
7. Canonical run descriptor/version fields.
8. Canonical action log/replay.
9. Server-side verification path for official fair submissions.
10. Graduation/fail-forward invariant when that product direction is activated in content.

## Functional core / imperative shell

Domain logic returns descriptions/effects; shell performs persistence, analytics or UI side effects.

## No ambient nondeterminism

No `Math.random()`, `Date.now()`, `new Date()` or `performance.now()` inside authoritative transition/evaluation logic. Time-sensitive gameplay must receive explicit timestamps/durations through trusted/deterministic context according to mode.


---

<!-- SOURCE: 05-engine/variant-generation-engine.md -->

# Variant generation engine

## Recommended interfaces

```ts
interface ChallengeFamilyDefinition {
  id: FamilyId;
  templateIds: TemplateId[];
}

interface ChallengeTemplate<P, PublicView, Answer> {
  id: TemplateId;
  difficulty: DifficultyBand;
  generate(ctx: GenerationContext): GeneratedVariant<P>;
  toPublicView(params: P): PublicView;
  evaluate(params: P, answer: Answer): Evaluation;
  validate(params: P): ValidationResult;
}
```

Exact repository architecture may differ; preserve its challenge registry strategy.

## Generation context

Should contain explicit:

- seed/substream;
- content version;
- requested difficulty;
- locale if genuinely necessary;
- feature/ruleset version.

## Generator responsibilities

Generator creates parameters, not React nodes.

## Validator responsibilities

Validator checks domain invariants independent of UI.

Examples:

- `hasSolution`;
- `intendedOutcomeOrdering`;
- `noAmbiguousOptimum`;
- `readableArithmetic`;
- `uniqueOptions`;
- `validMoneyMinorUnits`;
- `difficultyBandConsistent`.

## Deployed catalog

Competitive build job can generate many candidate seeds, retain only validated approved variants and create a versioned catalog:

```json
{
  "catalogVersion": "fair-2026-v1",
  "templateId": "bus.delay.v1",
  "variants": [{"seed": 123, "difficulty": "STANDARD", "fingerprint": "..."}]
}
```

## Fingerprint/question note

Compute a canonical fingerprint of public parameters/answer semantics so duplicate seeds producing equivalent variants can be detected.

## Distribution validation

Run aggregate checks for:

- correct-answer position balance;
- template frequency;
- difficulty distribution;
- duplicate rate;
- parameter edge distribution;
- invalid seed count = 0 in deployed catalog.


---

<!-- SOURCE: 06-quality/manual-qa-matrix.md -->

# Manual QA matrix

## Devices/viewports

- 360 px Android-like viewport;
- 390 px iPhone-like viewport;
- 430 px larger phone;
- tablet portrait;
- desktop centered shell.

## Game states

- initial empty CareerStrip;
- first Promedio reveal;
- first Equipo reveal;
- Aura positive/negative;
- Estilo compact/expanded;
- every outcome state;
- choice selected but not submitted;
- recovery path if implemented;
- year milestone;
- pending submission;
- verified personal best;
- non-best completed run.

## Adverse conditions

- refresh mid-run;
- network offline before/after completion;
- duplicate submit click;
- slow leaderboard response;
- invalid/blocked nickname;
- reduced motion;
- keyboard only;
- 200% browser zoom where applicable.


---

<!-- SOURCE: 06-quality/non-functional-requirements.md -->

# Non-functional requirements

## Reliability

- Official run should survive accidental refresh when technically feasible.
- Pending official submission should retry safely after temporary network loss.
- Submission is idempotent.

## Performance

- Mobile-first bundle discipline.
- Contextual images lazy-load unless critical.
- No heavy chart/animation framework solely for simple primitives.

## Accessibility

- WCAG 2.2 AA-oriented.
- Keyboard-complete.
- Reduced motion.
- Semantic controls/status.

## Determinism

- Reproducible official run from versions + descriptor + action log.

## Operability

- Health checks and event/ranking monitoring.
- Admin ability to hide inappropriate nickname without deleting audit evidence.

## Maintainability

- New year should mostly require content, not visual/engine reinvention.


---

<!-- SOURCE: 06-quality/scoring-fairness-audit.md -->

# Scoring and fairness audit

Before teacher approval and before fair freeze, answer:

## Comparability

- Do runs have equivalent difficulty budget?
- Can one template systematically award more points than another for equal skill?
- Can a player reroll until receiving an easier schedule?

## Dominance

- Does MathPerformance actually dominate final score?
- Can Aura or Team overwhelm a materially stronger math run?
- Is Promedio accidentally double-counted?
- Is any Estilo axis indirectly rewarded by score design?

## Speed bias

- Would a slower but more accurate student lose to a much less accurate fast player?
- Is active time only a late tie-breaker?

## Attempt-volume bias

- Is leaderboard best score, not cumulative total?
- Are unlimited attempts an intentional learning/replay policy?

## Tie analysis

Simulate ranking comparator and estimate tie rate. Do not add random noise to scores solely to make them unique.

## Transparency

Published rules should be understandable: math matters most; secondary game decisions contribute; speed is only a tie-breaker if used.


---

<!-- SOURCE: 06-quality/security-threat-model.md -->

# Security and competition threat model

## Assets at risk

- prize ranking integrity;
- event availability;
- moderation controls;
- participant pseudonymous identity;
- fair rules/version integrity.

## Primary threats

### Client score forgery
Mitigation: server computes/replays score.

### Modified action log
Mitigation: deterministic replay validates command legality/state sequence.

### Run descriptor tampering
Mitigation: server-issued/stored descriptor; validate run/player/event binding.

### Submission replay/duplication
Mitigation: idempotency key/run id; immutable official result.

### Resource abuse / DoS
Mitigation: rate limits, payload/command caps, timeouts, monitoring. OWASP API4/API6 are directly relevant.

### Nickname abuse
Mitigation: length/character validation, profanity moderation/hide, admin tools.

### Admin privilege abuse
Mitigation: authenticated admin role, least privilege, audit log.

### Version mixing
Mitigation: reject official submissions whose version tuple does not match allowed event configuration.

## Avoid overbuilding

This is a school fair, not an esports platform. Use risk-proportionate controls, but do not trust the browser with prize-determining values.


---

<!-- SOURCE: 06-quality/statistical-variant-audit.md -->

# Statistical variant audit

For each template and deployed catalog, generate a machine-readable audit.

## Parameters

- count generated;
- count valid/invalid;
- duplicate fingerprints;
- distribution by difficulty;
- answer-position distribution;
- distribution of relevant numeric parameters;
- outcome availability;
- expected score max/min.

## Example acceptance heuristics

Not universal constants, but useful flags:

- invalid deployed variants: exactly 0;
- duplicate choices: exactly 0;
- answer position severe skew: investigate;
- template whose theoretical max differs unexpectedly: investigate;
- variant whose required arithmetic leaves intended band: reject/reclassify.

## Monte Carlo ranking audit

Simulate many run schedules and player skill profiles. Compare expected score by schedule. If schedule alone explains a material share of score variance, difficulty equating is weak.

## Empirical post-fair calibration

After event, estimate per-template success/partial/time distributions. Use only for future versions unless an official regrade policy applies.


---

<!-- SOURCE: 06-quality/teacherless-preflight-risk-compensation.md -->

# Pre-fair risk compensation without student playtest

## Constraint

There is no planned real student gameplay evaluation before the game is built and released for the fair.

This means **student enjoyment, comprehension speed and real difficulty distribution remain uncertain until launch**. Teacher approval reduces content/pedagogy risk but is not equivalent to testing with 12–17-year-old players.

## Compensating controls

### UX heuristic review

- instructions visible at point of action;
- one primary action at a time;
- minimal text before first interaction;
- actual Spanish content at narrow viewport;
- no hidden hover requirements;
- progressive disclosure of meta systems.

### Proxy testing

Have teachers and available adults play without verbal assistance. Record where they ask what to do.

### Simulation

Catches logic/fairness, not fun. Do not confuse synthetic success with user validation.

### Accessibility checks

Reduces predictable interaction barriers.

### Telemetry readiness

Because fair is first real exposure, instrumentation and incident response must be ready on day one.

### Freeze discipline

Do not react to anecdotal first-hour difficulty by changing score rules mid-competition. Record findings for post-event or use only non-semantic hotfixes.

## Residual risk statement

No documentation process can eliminate the missing target-user playtest. The project should explicitly accept this residual risk rather than claim it has been validated.


---

<!-- SOURCE: 06-quality/testing-and-simulation.md -->

# Testing and simulation strategy

## Test pyramid by risk

### Unit/domain

- evaluator arithmetic;
- money/time helpers;
- scoring normalization;
- Estilo normalization;
- graduation/recovery transitions;
- tie comparator.

### Property-based

Use fast-check or existing equivalent for:

- generator invariants across many seeds;
- serialization round-trip;
- replay determinism;
- score bounds;
- no invalid Estilo percentages;
- graduation convergence when enabled.

Persist failing seed/path for exact reproduction.

### Golden deterministic

Keep golden seeds for representative/edge variants and replay them in CI.

### Simulation

Development/demo: thousands of synthetic runs.

Before fair: tens of thousands to 100k+ if runtime permits, focusing on:

- score distribution;
- unreachable outcomes;
- dominant strategies;
- ranking ties;
- variant repetition;
- difficulty distribution;
- career-state extremes;
- graduation reachability.

### UI/component

Test semantics and behavior, not Tailwind class strings.

### E2E

Representative mobile flows, mixed performance, reload/resume, final submission.

### Accessibility

Automated axe + manual keyboard + screen-reader spot checks.

## Competition simulation

Generate synthetic players of different skill strategies, not only random clicking. At minimum:

- high math accuracy;
- average accuracy;
- low accuracy;
- optimizer;
- fast-but-error-prone;
- slow/high-accuracy;
- Team-heavy choices;
- Aura-seeking choices.

Inspect whether intended ranking priorities actually emerge.


---

<!-- SOURCE: 06-quality/variant-validation-invariants.md -->

# Variant validation invariants

Every deployed competitive variant must satisfy domain-specific tests.

## Generic invariants

- generation terminates;
- values are finite/in range;
- at least one valid answer/path;
- no accidental duplicate options;
- intended optimum exists where required;
- no unintended tie for optimum unless design explicitly allows multiple optima;
- all outcome branches are reachable as intended;
- feedback calculations match evaluator;
- public prompt contains all information needed;
- no malformed currency/time/unit formatting;
- difficulty metadata exists;
- canonical fingerprint exists.

## UX/readability invariants

- no ugly accidental decimal complexity outside target;
- no absurd school context values;
- option text remains within practical mobile limits;
- mathematical notation can be represented accessibly.

## Statistical invariants

Across large generated sample:

- correct option positions roughly balanced when shuffled;
- no one template dominates unintentionally;
- difficulty mix matches target;
- invalid/deployment failure rate is visible and reviewed;
- duplicate/fingerprint collision rate acceptable.


---

<!-- SOURCE: 07-operations/competition-freeze-and-change-control.md -->

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


---

<!-- SOURCE: 07-operations/deployment-and-environments.md -->

# Deployment and environments

## Environments

### Local/dev
Unrestricted generators, golden seeds, design-system showcase, debug tools.

### Teacher demo
Stable 7.º content and deterministic demo variant pool. No production-prize guarantees required, but behavior should represent final architecture.

### Staging/fair rehearsal
Same infrastructure/config shape as production, synthetic participants, ranking/load tests.

### Fair production
Frozen event config, official deployed variant catalog, authoritative verification, monitoring/moderation.

## Configuration isolation

Do not allow dev score/content versions to become accepted official production versions accidentally. Event record should explicitly allow only frozen version tuple.


---

<!-- SOURCE: 07-operations/fair-mode-and-ranking.md -->

# Fair mode and ranking operations

## Attempts

Recommended default: unlimited attempts, personal best counts. Keep event config able to switch to 1/N attempts if teachers decide otherwise.

## Why personal best

Cumulative scoring rewards time spent rather than quality. Personal best creates a practice/improvement loop while keeping one comparable run per participant on the board.

## Leaderboard record

Public view should use nickname and score. Avoid exposing hidden mastery or unnecessary personal data.

## Rank comparator

Use versioned lexicographic comparator. Store the full comparison breakdown for audits.

## True tie policy

Must be written before prizes. Recommended options:

- organizer tie-break minigame;
- shared place/prize;
- another explicitly announced skill-based criterion.

Do not secretly award a prize based on random UUID ordering.

## Ranking refresh

Realtime is optional. Polling every few seconds may be simpler and more robust at fair scale. Choose based on actual platform/load, not novelty.


---

<!-- SOURCE: 07-operations/incident-runbook.md -->

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


---

<!-- SOURCE: 07-operations/load-and-network-test-plan.md -->

# Load and network test plan

## Why

A school fair creates bursty arrivals, shared Wi-Fi and ranking refreshes.

## Test scenarios

- many run issuance requests in a short burst;
- concurrent final submissions;
- leaderboard polling while submissions occur;
- duplicate/retry submissions;
- high latency;
- transient offline during run;
- database/API restart or degraded response;
- moderation during load.

## Success properties

- no duplicate official run result;
- personal-best update remains correct under concurrency;
- leaderboard reads do not block verification path excessively;
- clients retain pending submission;
- rate limits reject abuse without blocking expected fair burst.

Choose numeric concurrency targets from expected attendance and multiply by a safety factor; do not invent cloud scale without event estimates.


---

<!-- SOURCE: 07-operations/privacy-and-minors.md -->

# Privacy and minors

## Data minimization

The ranking does not require a full student account.

Prefer:

- nickname;
- pseudonymous player/event identifier;
- run data necessary for verification;
- score breakdown;
- moderation status.

Avoid unless the school explicitly requires and governs it:

- full legal name;
- email;
- phone;
- exact age/birth date;
- unnecessary profile data.

## Prize resolution

If real identity is needed to award prizes, prefer an organizer-controlled external mapping or event code rather than publishing identity in the game.

## Retention

Define before launch:

- how long raw action logs are retained;
- how long event leaderboard remains public;
- whether data is archived/anonymized/deleted post-fair.

Consult applicable school/legal policy before production; this document is product guidance, not legal advice.


---

<!-- SOURCE: 07-operations/ranking-moderation-and-prizes.md -->

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


---

<!-- SOURCE: 07-operations/telemetry-and-observability.md -->

# Telemetry and observability

## Purpose

Because the first real target-user exposure is the fair, aggregate telemetry is valuable for operations and later learning.

## Minimal useful events

- run_issued;
- run_started;
- challenge_started;
- challenge_completed;
- challenge_outcome;
- run_completed;
- submission_pending;
- submission_verified;
- submission_rejected with reason code;
- technical_error.

## Avoid

- full answer payloads in general analytics when not needed;
- personal names/emails;
- sensitive profiling;
- excessive event volume.

## Operational dashboards

- active/error rate;
- submission success/latency;
- database/API health;
- ranking update failures;
- abnormal rate-limit activity.

## Product analysis after fair

- abandonment points;
- time by challenge;
- outcome distributions;
- repeat-attempt improvement;
- variant difficulty outliers.


---

<!-- SOURCE: 08-delivery/agent-handoff.md -->

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


---

<!-- SOURCE: 08-delivery/content-matrix-template.md -->

# Full-game content matrix template

Use one row per template, not one row per generated variant.

| Stage | Family | Template | Narrative purpose | Math domains | Interaction | Difficulty | Promedio | Equipo | Aura | Estilo | Score math | Assets | Teacher status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7.º | Mural | coverage | feria project | geometry/proportion | choice | STANDARD | yes | maybe | no | strategist | evaluator | optional scene | approved/pending |

Add columns for:

- generator invariants;
- support/calculator;
- story flags;
- implementation status;
- deployed variant count;
- test status.


---

<!-- SOURCE: 08-delivery/definition-of-done.md -->

# Definition of Done

## 7.º Demo Candidate

- approved Design System applied to real slice;
- career-state migration complete;
- no old visible stats;
- at least meaningful deterministic variant diversity;
- no invalid variant in demo pool;
- full 7.º path completes;
- year summary works;
- score proposal demonstrable;
- mobile/keyboard/a11y checks pass;
- teacher review packet ready.

## Full fair candidate

- all years complete;
- official variant catalog versioned and validated;
- competition score approved/frozen;
- server computes official results;
- personal-best leaderboard transactionally correct;
- replay verifies official submissions;
- rate limits/moderation exist;
- load/network/mobile hardening passes;
- event runbook and true-tie policy approved;
- no P0/P1 known defects.


---

<!-- SOURCE: 08-delivery/demo-presentation-guide.md -->

# 7.º teacher-demo presentation guide

## Do not present it as a generic design review

The session should answer product/math questions.

## Suggested order

1. Let teacher play first run without explanation.
2. Let teacher replay and observe variation.
3. Show career summary and explain Promedio/Equipo/Aura/Estilo.
4. Explain ScenarioFamily/Template/Variant and why answers cannot simply be memorized.
5. Show score breakdown proposal: math dominant, personal best, time late tie-break.
6. Show open decision list and request explicit teacher decisions.

## Questions to record

- What felt too easy/hard?
- Which mathematical support should be visible?
- Are contexts/words natural for students?
- Does any outcome feel unfair?
- Is the scoring philosophy appropriate for prizes?
- Unlimited attempts or cap?
- Which 7.º situations should remain/remove/add?

Do not spend the meeting asking teachers to choose padding, font weights or visual tokens already closed.


---

<!-- SOURCE: 08-delivery/implementation-sequence.md -->

# Implementation sequence after current Design System integration

## 1. Stabilize 7.º foundation

- implement/migrate career model;
- turn fixed challenges into family/template/variant-ready architecture;
- preserve deterministic engine;
- add variant invariant tests;
- demonstrate run-to-run variation.

## 2. Build score engine skeleton

- normalized challenge performance;
- score breakdown;
- configurable weighting;
- comparator/tie metrics;
- local/demo display.

No production leaderboard required yet.

## 3. Prepare Teacher Demo Candidate

- visual/functional QA;
- teacher review materials;
- known-open decisions clearly listed.

## 4. Gate 1 corrections + foundation freeze

## 5. Full content matrix 1.º–5.º

## 6. Incremental full game implementation

For each year:

- content templates;
- generators/deployed variants;
- invariant/property tests;
- storylets;
- stage milestone.

## 7. Official fair backend

- run issuance;
- replay verification;
- score service;
- personal-best leaderboard;
- moderation;
- persistence.

## 8. Gate 2

## 9. Freeze + production hardening

## 10. Fair release


---

<!-- SOURCE: 08-delivery/open-decisions.md -->

# Open decisions

Do not silently close these in code.

## Teacher Gate 1

- final score weights/caps;
- exact outcome score calibration;
- unlimited vs capped attempts;
- true-tie prize policy;
- 25 de Mayo production inclusion;
- exact target run duration;
- difficulty-band calibration.

## Later content

- final number of scenario families/templates per year;
- exact Estilo nudge weights;
- year-specific minimal accents;
- final archetype rules.

## Art/product

- whether to generate the raster pack or keep UI-only where sufficient;
- avatar remains deferred.


---

<!-- SOURCE: 08-delivery/product-freeze-checklist.md -->

# Foundation/product freeze checklist

After Teacher Gate 1 corrections, freeze foundational choices if all are true:

- Design System accepted;
- career model accepted;
- challenge/outcome grammar accepted;
- variant architecture accepted;
- scoring philosophy accepted or parameter decisions documented;
- teacher-approved content-authoring rules written;
- no open architectural blocker for 1.º–5.º;
- 7.º deterministic/replay tests pass.

After freeze, later years may add content and genuinely new interaction types, but should not reopen basic card/button/stat/scoring architecture without evidence of a defect.


---

<!-- SOURCE: 08-delivery/teacher-gate-1-checklist.md -->

# Teacher Gate 1 — 7.º Demo review

## Demonstrate

- full 7.º flow;
- at least two runs showing variant changes;
- several interaction patterns;
- Promedio/Equipo/Aura/Estilo;
- year-complete summary;
- proposed FairScore explanation/breakdown;
- how difficulty bands/variants work.

## Ask teachers to decide/review

### Mathematics
- Are concepts appropriate?
- Is terminology correct?
- Are contexts credible?
- Which challenges need support/formula/calculator?

### Difficulty
- Are CORE/STANDARD/STRETCH bands reasonable?
- Does the same elementary content still provide enough challenge to adults?

### Competition
- Accept math-dominant score?
- Accept secondary Team/Aura contribution?
- Unlimited attempts + personal best?
- Tie-break order?

### Product
- Is guaranteed eventual graduation/recovery approach acceptable?
- Is the tone/humor appropriate?

## Capture decisions

Do not accept only free-form “looks good”. Record each closed/open item in decision register after meeting.


---

<!-- SOURCE: 08-delivery/teacher-gate-2-checklist.md -->

# Teacher Gate 2 — Full game acceptance

This gate happens after 1.º–5.º and ranking exist.

Review:

- all stage content/catalog;
- representative variant edges;
- full career duration;
- recovery/egreso behavior;
- final archetypes;
- exact score formula and public explanation;
- ranking UI;
- attempts policy;
- exact tie/prize policy;
- nickname rules;
- event instructions.

After approval:

- freeze content/rules/scoring;
- only hardening and non-semantic fixes remain before fair.


---

<!-- SOURCE: 09-reference/formulas-and-algorithms.md -->

# Formulas and algorithms reference

## 1. Promedio

Recommended conceptual model:

`Promedio = Σ(weight_j × grade_j) / Σ(weight_j)`

If every grade has equal weight, weights are 1. Grade ledger is preferred over arbitrary “+0.3 average” deltas.

## 2. Estilo normalization

Given non-negative evidence vector `(A,E,I)` and `S=A+E+I`:

- if `S=0`, Estilo is not yet meaningful/introduced;
- otherwise `%A=100A/S`, `%E=100E/S`, `%I=100I/S`.

Render rounding must preserve a displayed total of 100 if percentages are printed. Use largest-remainder rounding rather than independently rounding each percentage.

## 3. Classification precision/coverage

`precision = TP/(TP+FP)`

`coverage = TP/(TP+FN)`

`F1 = 2PR/(P+R)` when `P+R>0`, else 0.

## 4. Difficulty-adjusted math

`MathRaw = Σ(1000 × q_i × d_i)`

`MathMax = Σ(1000 × d_i)`

`MathPerformance = 10000 × MathRaw/MathMax`

## 5. Candidate FairScore

`FairScore = round(wM*M + wT*T + wA*A)`

with `wM+wT+wA=1` and candidate `0.80/0.15/0.05` pending teacher approval.

## 6. Rank comparator

Compare lexicographically:

`(FairScore, MathPerformance, OptimalCount, Accuracy, DifficultySolved, -ActiveTimeMs)`

Higher tuple wins. Exact tie requires explicit event policy.

## 7. Reverse-generation mural example

Coverage `c=8 m²/L`, packages `1,2,4L`.

To guarantee `2L` is the smallest valid package, choose required area `R` such that:

`8 < R ≤ 16`.

Then choose human-readable dimensions whose product (minus openings if used) equals R.


---

<!-- SOURCE: 09-reference/research-basis.md -->

# Research and standards basis

**Access context:** August 2026. These sources inform recommendations; Egresado still requires school-specific validation.

## STACK — seeded and deployed random variants

- STACK Docs, “Deploying”: https://docs.stack-assessment.org/en/STACK_question_admin/Deploying/
- STACK Docs, “Random objects”: https://docs.stack-assessment.org/en/CAS/Random/
- STACK Docs, “Systematic deployment”: https://docs.stack-assessment.org/en/STACK_question_admin/Deploying_systematically/

Relevant principle: pseudo-random seeded variants are reproducible; pre-generating/testing/deploying variants reduces the risk of impossible or defective random cases.

## CAST Universal Design for Learning Guidelines 3.0

- https://udlguidelines.cast.org/
- Action & Expression: https://udlguidelines.cast.org/action-expression/
- Representation: https://udlguidelines.cast.org/representation/
- Engagement: https://udlguidelines.cast.org/engagement/

Relevant principles: optimize challenge/support, clarify mathematical notation/symbols, use multiple representations, vary response/navigation methods, authentic relevance, action-oriented feedback.

## Low-floor / high-ceiling task design

- Radmehr et al.-related 2025 literature review: https://www.tandfonline.com/doi/full/10.1080/0020739X.2025.2457365
- Educational Designer example: https://www.educationaldesigner.org/ed/volume5/issue17/article68/

Relevant principle: accessible entry with opportunities for deeper mathematical reasoning and multiple paths.

## Repeatable leaderboard / Best Score

- Apple GameKit, “Choosing a leaderboard for your challenges”: https://developer.apple.com/documentation/gamekit/choosing-a-leaderboard-for-your-challenges

Relevant principle: repeatable challenges should generally use Best Score rather than cumulative activity that can unfairly advantage heavy-volume players.

## Property-based testing

- fast-check, “Why Property-Based Testing?”: https://fast-check.dev/docs/introduction/why-property-based/

Relevant principle: property-based tests can remain reproducible using seeds and failure seeds.

## Accessibility

- W3C WCAG 2.2: https://www.w3.org/TR/wcag/

Relevant principles: semantic name/role/value, programmatically determinable state, status messages, keyboard/accessibility requirements.

## API/game security

- OWASP API Security Top 10 2023: https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- API4 Unrestricted Resource Consumption: https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/
- OWASP Game Security Framework: https://owasp.org/www-project-gamesec-framework/OGSF

Relevant principles: validate trust-boundary data, keep sensitive competition logic authoritative, apply rate/resource limits.
