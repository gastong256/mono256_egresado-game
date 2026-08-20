# Game engine

## Objetivo

Motor TypeScript determinista, puro y reproducible.

## Restricciones

El core no puede depender de:
- React;
- `window`/DOM;
- almacenamiento local;
- DB;
- red;
- fecha/hora global no inyectada;
- `Math.random()` directo.

## Entradas

```typescript
interface RunConfig {
  seed: string
  mode: GameMode
  difficulty: Difficulty
  gameVersion: string
  rulesetVersion: string
  contentVersion: string
}
```

## Estado

```typescript
interface GameState {
  stage: SchoolStage
  eventIndex: number
  stats: PlayerStats
  flags: Record<string, boolean | number | string>
  history: ResolvedEvent[]
  rngState: RngState
  scorePreview: number
  status: 'active' | 'completed'
}
```

## Acciones

```typescript
type GameAction =
  | { type: 'ANSWER'; challengeId: string; payload: unknown }
  | { type: 'REQUEST_INFO'; challengeId: string; key: string }
  | { type: 'USE_TOOL'; challengeId: string; tool: ToolId }
  | { type: 'CONTINUE' }
```

Las acciones deben tener schema Zod en frontera externa.

## Reducer

`transition(state, action, dependencies) -> TransitionResult`

Debe ser puro respecto de inputs. Si existe RNG, se consume mediante objeto seeded incluido en estado/dependencias.

## RNG

- Elegir un PRNG estable cuya implementación/version quede controlada.
- No cambiar algoritmo sin `ruleset_version` o ADR si afecta runs.
- Toda selección de storylet y generación procedural consume el RNG en orden documentado.

## Evaluadores

Cada challenge type implementa:

```typescript
interface ChallengeEvaluator<I, M> {
  validateInput(input: unknown): I
  evaluate(model: M, input: I): ChallengeResult
}
```

## Generadores

```typescript
interface ChallengeGenerator<P, M> {
  generate(params: P, rng: SeededRng): M
  verify(model: M): VerificationResult
}
```

## Replay

El servidor reconstruye:

```text
initialState(config)
-> action[0]
-> action[1]
-> ...
-> finalState
```

Si cliente y servidor producen `result_hash`, debe coincidir para una implementación/version compatibles.

## Hash de resultado

Opcional pero recomendado:
- canonicalizar state relevante;
- hash SHA-256 server-side/client-side;
- útil para detectar divergencias, no como mecanismo de seguridad por sí mismo.

## Compatibilidad

Una run sólo puede reanudarse/reproducirse con el engine compatible con sus versiones. No intentar migrar silenciosamente runs activas entre rulesets incompatibles.
