# Arquitectura objetivo del motor

**Este documento sigue la brecha hasta la arquitectura objetivo.** [Game engine](game-engine.md) describe el motor implementado y sigue siendo la fuente autoritativa del estado actual. La tabla de este documento conserva las capacidades que pide la dirección de producto del [blueprint v0.2](../07-reference/blueprint-v0.2-integration.md) y marca cuáles ya llegaron a `implementado`, cuáles son parciales y cuáles continúan como `TARGET`.

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
| 12 | Jerarquía `ScenarioFamily → Template → Variant` | **implementado** | [ADR-019](adr/ADR-019-scenario-family-template-variant.md), `src/game/challenges/content-model.ts` |
| 13 | `VariantGenerator` por restricción, reutilizable entre plantillas | **implementado** | [ADR-020](adr/ADR-020-variant-generation-and-approved-catalog.md), `src/game/challenges/variant-source.ts` |
| 14 | `VariantValidator` con invariantes de dominio ejecutables | **implementado**: genéricas más las de cada plantilla, con oráculos independientes | `src/game/challenges/variant-validation.ts` |
| 15 | Catálogo de variantes aprobado y versionado | **implementado para desarrollo y consumido por la partida** — `ApprovedVariantCatalog` con `grade-7-dev-1` a `dev-5` inmutables; `dev-5` es el vigente y suma la plantilla de repaso sobre la población de `dev-4`; el catálogo oficial de feria no está congelado | `src/game/content/variant-catalog.ts`, [ADR-020](adr/ADR-020-variant-generation-and-approved-catalog.md), [ADR-021](adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md), [ADR-022](adr/ADR-022-difficulty-model-and-run-composer.md), [ADR-023](adr/ADR-023-competitive-score-policy.md) |
| 16 | Bandas `CORE / STANDARD / STRETCH` como metadata de autoría | **implementado**: la banda se deriva de seis rasgos cognitivos declarados por plantilla; `DifficultyLevel` 1–5 sigue siendo la perilla del runtime y las dos pueden discrepar | `src/game/difficulty/cognitive.ts`, [ADR-022](adr/ADR-022-difficulty-model-and-run-composer.md) |
| 17 | Scheduler por presupuesto de dificultad | **implementado**: compositor determinista por enumeración, con presupuesto y tolerancia por etapa, validador independiente y verificación en servidor | `src/game/plan/`, [ADR-022](adr/ADR-022-difficulty-model-and-run-composer.md) |
| 18 | `MathPerformance` / `TeamPerformance` / `AuraPerformance` normalizados | **implementado**: en puntos básicos enteros, y cada plantilla declara qué hecho suyo alimenta cada una | `src/game/scoring/`, [ADR-023](adr/ADR-023-competitive-score-policy.md) |
| 19 | `ScorePolicy` competitiva con pesos, topes y recompensas | **implementada y versionada**: `fair-score-dev-1` histórica y `fair-score-dev-2` post-TG1 actual; ambas `official: false`; el desempate espera al ranking | `src/game/scoring/competitive-policy.ts`, [ADR-023](adr/ADR-023-competitive-score-policy.md) |
| 20 | `RunDescriptor` emitido por servidor | **TARGET**; el descriptor ya lleva la huella del plan que un servidor tendría que emitir y verificar | este documento, [ADR-022](adr/ADR-022-difficulty-model-and-run-composer.md) |
| 21 | `scoreVersion` y `variantCatalogVersion` | **implementado**: los tres —catálogo, huella del plan y versión de score— viajan en descriptor, snapshot y action log, y `createRun` los comprueba | `src/game/runs/state.ts`, [ADR-021](adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md), [ADR-022](adr/ADR-022-difficulty-model-and-run-composer.md), [ADR-023](adr/ADR-023-competitive-score-policy.md) |
| 22 | Verificación autoritativa por replay en servidor | **TARGET** para endpoints y sesión; el caso de uso ya reproduce la run, recompone y valida su plan, **calcula su propio score competitivo** y **recalcula progresión y egreso** —dos cosas distintas que no se mezclan— sin leer nada que el cliente afirme | `src/server/game/validate-run.ts`, [ADR-004](adr/ADR-004-server-authoritative-scoring.md), [ADR-023](adr/ADR-023-competitive-score-policy.md), [ADR-024](adr/ADR-024-progression-recovery-and-graduation.md) |
| 23 | Ranking con personal best transaccional | **TARGET** | [modo feria](../05-operations/fair-mode-and-competition-freeze.md) |
| 24 | Invariante de egreso y recuperación fail-forward | **implementado**: el egreso es un estado terminal que decide la progresión, y la recuperación converge por construcción —sólo un beat ordinario deja algo por cerrar y un repaso siempre lo cierra—, con un repaso por año como techo. No aporta evidencia competitiva | `src/game/progression/recovery.ts`, [ADR-024](adr/ADR-024-progression-recovery-and-graduation.md), [egreso y fail-forward](../01-game-design/graduation-and-fail-forward.md) |
| 25 | Catálogo de contenido disponible separado del plan de la run | **implementado** | `ContentCatalog`, `RunPlan`, [ADR-019](adr/ADR-019-scenario-family-template-variant.md) |
| 26 | Elegibilidad por etapa y roles de colocación declarativos | **implementado** | ídem |
| 27 | Presupuesto de beats por año validable | **implementado y ejercido**: el compositor produce años de uno o dos beats ordinarios y el motor los ejecuta; `grade-7-composed` juega tres eventos contra los ocho de la demo | `src/game/plan/composer.ts`, [ADR-022](adr/ADR-022-difficulty-model-and-run-composer.md) |
| 28 | Auditoría estadística de una población de variantes | **implementado** | `src/game/content/variant-audit.ts`, `pnpm game:variants audit` |
| 29 | `RecoveryPolicy` nombrada, versionada y no oficial por defecto | **implementada**: `recovery-dev-1@1.0.0-candidate`, `official: false`; el validador rechaza un techo mayor a dos y una política que dispare con `optimal`, y la huella del ruleset la cubre | `src/game/progression/recovery.ts`, [ADR-024](adr/ADR-024-progression-recovery-and-graduation.md) |

## Lo que la migración de carrera ya cerró

El blueprint pide una migración del modelo viejo (`knowledge`, `team`, `initiative`, `energy`) al modelo de carrera. **Esa migración ya ocurrió.** `ENGINE_VERSION` es `2.0.0` exactamente por eso, y un action log `1.x` no reproduce su resultado original bajo este motor —que es lo que la tripleta de versiones existe para decir en voz alta.

Un agente futuro que lea el paquete original y planifique esa migración estaría replanificando trabajo hecho. Lo que sí queda pendiente del capítulo de migración es la serialización de flags como estructura determinista, ya resuelta en el codec actual, y el rastreo de impacto ante cada cambio de estado, que sigue siendo la disciplina vigente.

## `RunDescriptor` — presente y objetivo oficial

El descriptor inmutable del core ya está implementado. Admite `variantCatalogVersion?: string`, `planFingerprint?: string` y, desde STAGE-06, `scoreVersion?: string`. Los campos se omiten cuando la run no usa catálogo, plan compuesto o política competitiva respectivamente; una práctica sin score competitivo no inventa una versión.

La forma siguiente sigue siendo el **objetivo conceptual del descriptor oficial emitido por servidor**. `eventId`, `playerId`, asignaciones y emisión autoritativa todavía no son un contrato implementado; `scoreVersion` sí existe en el descriptor del core, aunque todavía no hay un evento oficial que lo emita o congele:

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
  variantCatalogVersion?: string
  slots: VariantAssignment[]
}
```

El [ejemplo](../07-reference/run-descriptor.example.json) muestra el contrato implementado del core, incluida la opcionalidad que una run competitiva concreta resuelve; no incluye los campos futuros del objetivo oficial y no se importa desde runtime.

Reglas asociadas:

- el servidor decide versiones, seed y asignación de variantes;
- el cliente no puede pedir un seed arbitrario ni una dificultad más fácil para modo con premios;
- el descriptor no cambia una vez emitido.
- una run oficial que consume catálogo debe declarar la versión congelada por el evento; una run curada que no consume catálogo puede omitirla.

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
| `scoreVersion` | **implementado** — versión de la calibración competitiva, opcional fuera de competencia |
| `variantCatalogVersion` | **implementado** como procedencia opcional del descriptor; su valor oficial de feria sigue futuro |

Los cinco ejes existen en los contratos actuales. `variantCatalogVersion` y `scoreVersion` son opcionales y `createRun` los comprueba contra las dependencias inyectadas cuando aparecen. Lo futuro es que un servidor de feria emita la identidad completa y que una configuración de evento congele el conjunto oficial permitido por igualdad exacta, no por rangos semver.

## Prohibiciones que siguen vigentes

- nada de `Math.random()`, `Date.now()`, `new Date()` ni `performance.now()` dentro de la transición o la evaluación autoritativas;
- la evaluación matemática no se muda a React;
- el dominio devuelve descripciones y efectos; el shell hace persistencia, analytics y UI;
- una constante de scoring recomendada no se escribe como número mágico: se escribe como política versionada.
