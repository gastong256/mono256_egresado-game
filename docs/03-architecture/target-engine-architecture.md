# Arquitectura objetivo del motor

**Este documento describe lo que todavía no existe.** [Game engine](game-engine.md) describe el motor implementado y sigue siendo la fuente autoritativa del estado actual. Acá se documenta la brecha entre ese motor y las capacidades que pide la dirección de producto del [blueprint v0.2](../07-reference/blueprint-v0.2-integration.md), con el estado real de cada una.

Ninguna capacidad marcada TARGET debe describirse en presente en otro documento hasta que exista en el código y en los tests.

## Frontera fundamental — sin cambios

```text
Browser / React
    ↓ comandos
Controlador de aplicación
    ↓
Motor determinista puro
    ↓
Estado + eventos de dominio + descriptores de efecto
    ↓
Adapters · persistencia · verificación en servidor
```

Esto ya es lo que hay: núcleo funcional con función de transición explícita ([ADR-011](adr/ADR-011-functional-core-transition-engine.md)), sin React, DOM, almacenamiento, red ni tiempo ambiente adentro del dominio, y con aritmética racional exacta ([ADR-013](adr/ADR-013-exact-rational-arithmetic.md)). La evolución que sigue **no toca esta frontera**; si una propuesta futura la toca, es un ADR nuevo, no una tarea de contenido.

## Estado por capacidad

| # | Capacidad | Estado | Dónde |
|---|---|---|---|
| 1 | `CareerState` v0.2: Promedio derivado de notas, Equipo, Aura, Estilo | **implementado** | `src/game/progression/career.ts`, [ADR-016](adr/ADR-016-career-player-model.md) |
| 2 | Libro de notas para Promedio en vez de deltas arbitrarios | **implementado** | `grades: readonly number[]` |
| 3 | Estilo como evidencia acumulada con normalización derivada | **implementado** | `estilo` + `estiloEvidence` |
| 4 | Dominio matemático oculto por categoría | **implementado**, nunca renderizado | `mastery` |
| 5 | Flags e historia narrativa ocultos | **implementado** | `src/game/narrative/` |
| 6 | Generación seeded, verificación e vista pública sin solución | **implementado** | `src/game/challenges/contracts.ts` |
| 7 | Derivación de seed estable y substreams versionados | **implementado** | [ADR-012](adr/ADR-012-seeded-prng-and-substreams.md) |
| 8 | Action log canónico y replay | **implementado** | `src/game/runs/` |
| 9 | Codec de snapshot versionado con rechazo explícito de versiones viejas | **implementado** | `src/game/runs/snapshot.ts` |
| 10 | Política de score nombrada, versionada y no oficial por defecto | **implementado** | `src/game/scoring/`, `production: false` |
| 11 | Tripleta de versiones en toda run | **implementado**: `gameVersion`, `rulesetVersion`, `contentVersion` | `src/game/core/versioning.ts` |
| 12 | Jerarquía `ScenarioFamily → Template → Variant` | **TARGET** | [familias y variantes](../01-game-design/challenge-families-and-variants.md) |
| 13 | `VariantGenerator` por restricción, reutilizable entre plantillas | **TARGET** | ídem |
| 14 | `VariantValidator` con invariantes de dominio ejecutables | **parcial**: cada desafío verifica los suyos; no hay contrato transversal | [validación de variantes](../04-quality/variant-validation-and-audit.md) |
| 15 | Catálogo de variantes desplegado, aprobado y versionado | **TARGET** | ídem |
| 16 | Bandas `CORE / STANDARD / STRETCH` como metadata de autoría | **TARGET**; hoy existe `DifficultyLevel` 1–5 | [dificultad](../01-game-design/difficulty-and-playability.md) |
| 17 | Scheduler por presupuesto de dificultad | **TARGET** | ídem |
| 18 | `MathPerformance` / `TeamPerformance` / `AuraPerformance` normalizados | **TARGET** | [score competitivo](../01-game-design/competitive-scoring-and-ranking.md) |
| 19 | `ScorePolicy` competitiva con pesos, topes y orden de desempate | **TARGET** | ídem |
| 20 | `RunDescriptor` emitido por servidor | **TARGET** | este documento |
| 21 | `scoreVersion` y `variantCatalogVersion` | **TARGET** | este documento |
| 22 | Verificación autoritativa por replay en servidor | **TARGET**; hoy existe `src/server/game/validate-run.ts` como base | [ADR-004](adr/ADR-004-server-authoritative-scoring.md) |
| 23 | Ranking con personal best transaccional | **TARGET** | [modo feria](../05-operations/fair-mode-and-competition-freeze.md) |
| 24 | Invariante de egreso y recuperación fail-forward | **TARGET** | [egreso y fail-forward](../01-game-design/graduation-and-fail-forward.md) |

## Lo que la migración de carrera ya cerró

El blueprint pide una migración del modelo viejo (`knowledge`, `team`, `initiative`, `energy`) al modelo de carrera. **Esa migración ya ocurrió.** `ENGINE_VERSION` es `2.0.0` exactamente por eso, y un action log `1.x` no reproduce su resultado original bajo este motor —que es lo que la tripleta de versiones existe para decir en voz alta.

Un agente futuro que lea el paquete original y planifique esa migración estaría replanificando trabajo hecho. Lo que sí queda pendiente del capítulo de migración es la serialización de flags como estructura determinista, ya resuelta en el codec actual, y el rastreo de impacto ante cada cambio de estado, que sigue siendo la disciplina vigente.

## `RunDescriptor` — objetivo

Identidad inmutable de una run oficial. Forma conceptual, no contrato implementado:

```ts
interface RunDescriptor {
  runId: string
  eventId: string
  playerId: string // pseudónimo
  runSeed: string | number
  engineVersion: string
  rulesetVersion: string
  contentVersion: string
  scoreVersion: string
  variantCatalogVersion: string
  slots: VariantAssignment[]
}
```

Ver [ejemplo](../07-reference/run-descriptor.example.json). El ejemplo es documentación: no se importa desde runtime ni define configuración de producción.

Reglas asociadas:

- el servidor decide versiones, seed y asignación de variantes;
- el cliente no puede pedir un seed arbitrario ni una dificultad más fácil para modo con premios;
- el descriptor no cambia una vez emitido.

El contrato HTTP concreto se decide dentro de [contratos API](api-contracts.md) cuando exista; la [pregunta 22](../07-reference/open-questions.md) es su gate.

## Verificación autoritativa — objetivo

El navegador no es confiable para un valor que decide un premio. Secuencia objetivo:

1. el servidor emite y registra el `RunDescriptor`;
2. el browser juega localmente con el motor determinista;
3. el browser persiste el action log durante la run;
4. al terminar, el cliente envía **action log e identidad de run, no un score**;
5. el servidor recarga las versiones exactas, reconstruye variantes, reproduce comandos y calcula el score oficial;
6. si no hay red, el envío queda pendiente y reintenta de forma idempotente;
7. el servidor escribe un resultado oficial inmutable y actualiza el personal best transaccionalmente.

Esto no agrega round trips dentro del loop de juego: es exactamente el local-first de [ADR-006](adr/ADR-006-local-first-gameplay.md) con la autoridad de [ADR-004](adr/ADR-004-server-authoritative-scoring.md).

### Controles de abuso

Límite de tasa en emisión y envío de runs; tope de tamaño y de cantidad de comandos del action log; validación de todos los ids y versiones; rechazo de asignaciones de variante desconocidas; autorización fuerte en endpoints de administración; monitoreo de volumen o de tiempos imposibles. Detalle en [threat model](../04-quality/threat-model.md) y [seguridad y privacidad](security-privacy.md).

Proporcionalidad: esto es una feria escolar, no una plataforma de esports. Los controles se dimensionan al riesgo, pero el browser no decide el premio.

## Versionado separado

Un arreglo visual no debe cambiar un score. Un cambio de fórmula no debe alterar runs viejas en silencio. Un cambio de generador no debe hacer que un seed viejo reconstruya otra cosa.

Ejes de versión objetivo:

| Eje | Cambia cuando |
|---|---|
| `engineVersion` / `gameVersion` | transición, consumo de RNG, derivación de seed, formato de action log o codec de snapshot |
| `rulesetVersion` | scoring, dificultad, progresión o política de perfil |
| `contentVersion` | datos de desafíos o storylets |
| `scoreVersion` | **TARGET** — coeficientes y topes de la política competitiva |
| `variantCatalogVersion` | **TARGET** — catálogo desplegado de variantes |

Los tres primeros existen. Los dos últimos son el agregado que pide el modo competitivo, y su compatibilidad se decide como los otros: igualdad exacta, no rangos semver.

## Prohibiciones que siguen vigentes

- nada de `Math.random()`, `Date.now()`, `new Date()` ni `performance.now()` dentro de la transición o la evaluación autoritativas;
- la evaluación matemática no se muda a React;
- el dominio devuelve descripciones y efectos; el shell hace persistencia, analytics y UI;
- una constante de scoring recomendada no se escribe como número mágico: se escribe como política versionada.
