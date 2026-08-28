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
