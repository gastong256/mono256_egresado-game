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
