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
