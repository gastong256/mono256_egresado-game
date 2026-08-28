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
