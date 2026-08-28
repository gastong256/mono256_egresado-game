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
