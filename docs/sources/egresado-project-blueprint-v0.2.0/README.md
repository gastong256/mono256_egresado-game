# EGRESADO — Project Blueprint & Technical Handoff

**Version:** v0.2.0  
**Status:** consolidated product/game/technical blueprint after the 7.º visual-system redesign and the competitive-fair design discussions.  
**Primary language:** Spanish / `es-AR`.  
**Purpose:** provide a future engineer or AI agent with enough context to understand the product, the reasons behind the rules, the intended 7.º demo, the complete fair scope, the target engine capabilities, the competitive model, the design constraints, and the decisions that must *not* be guessed.

This package is intentionally documentation-heavy. It is not a replacement for the repository code, tests, ADRs or the Claude Design package. It is the **product/game/technical contract that connects them**.

## Read order for an implementation agent

1. `00-governance/decision-status.md`
2. `00-governance/source-of-truth.md`
3. `01-product/product-vision.md`
4. `01-product/real-delivery-lifecycle.md`
5. `01-product/scope-demo-7mo.md`
6. `02-game-design/core-loop-and-progression.md`
7. `02-game-design/player-career-model.md`
8. `02-game-design/challenge-families-and-variants.md`
9. `02-game-design/difficulty-and-universal-playability.md`
10. `02-game-design/competitive-scoring-and-ranking.md`
11. `05-engine/target-engine-architecture.md`
12. `05-engine/variant-generation-engine.md`
13. `05-engine/scoring-replay-and-ranking.md`
14. `06-quality/testing-and-simulation.md`
15. `08-delivery/agent-handoff.md`

Then read the remaining documents by subject.

## Decision maturity legend

This package deliberately distinguishes certainty levels:

- **LOCKED** — accepted/final foundation or an explicit handoff constraint. Implement unless superseded by a newer authoritative decision.
- **PRODUCT DIRECTION** — strong intended behavior that should guide architecture; confirm only if repository state materially contradicts it.
- **RECOMMENDED** — senior recommendation, designed to be configurable. It is not a hidden immutable requirement.
- **TEACHER GATE** — must be validated with the Mathematics Department before competitive production freeze.
- **OPEN** — deliberately unresolved. An agent must not silently decide it.
- **DEFERRED** — intentionally out of current scope.

The register is in `00-governance/decision-register.md`.

## Important relationship to the Claude Design handoff

The approved Claude Design v0.2 package remains the **visual authority**. This blueprint summarizes its core rules because they affect game/engine behavior, but implementation must read the actual handoff, tokens and screenshots when available.

Key visual direction: the game is UI-first, uses a warm grid-paper canvas, square geometry, border hierarchy, mixed-case typography, and a distinct dark Aura island. It intentionally moved away from the initial dark sports-career aesthetic that was too close to Copero / El Ídolo.

## Core product statement

> Egresado is not about discovering whether the player can finish school. It is about discovering **how they graduate**, while using accessible mathematics to make meaningful decisions and, during the fair, competing on a math-dominant and auditable score.
