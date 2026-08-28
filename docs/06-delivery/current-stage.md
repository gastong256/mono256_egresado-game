# Etapa actual

Vista corta del estado de ejecución. El detalle completo, los contratos de todas las etapas y el protocolo de actualización están en el [roadmap de implementación](implementation-sequence.md), que es la autoridad.

---

## STAGE-02 — ScenarioFamily → ChallengeTemplate → ChallengeVariant

**Estado:** `READY` — dependencias satisfechas, nadie la empezó todavía.

## Por qué está activa

STAGE-00 y STAGE-01 están `DONE` con evidencia: el motor ya tiene tripleta de versiones, ownership de seed con substreams, `RunDescriptor` inmutable, replay, snapshots versionados y separación entre resultado de desafío, carrera y score.

Lo que falla hoy es el nivel de contenido. Cada uno de los seis desafíos de 7.º es una definición monolítica con un array interno de parámetros: alcanza para que cambien los números, no para que cambie la pregunta. Sin familia y plantilla no se puede construir generación por restricción (STAGE-03), y sin eso no hay catálogo, ni dificultad equiparada, ni score competitivo defendible.

## Objetivo

Que dos plantillas de la misma familia de escenario puedan coexistir **sin duplicar la lógica completa del desafío**, y que una variante se pueda serializar y reconstruir desde su dirección determinista.

## Scope IN

- Tipos `ScenarioFamily`, `ChallengeTemplate` y `ChallengeVariant`, con identidad estable y serializable.
- Una plantilla representa una estructura de razonamiento, no otro juego de números.
- Extender `ChallengeInstanceRef` para direccionar familia y plantilla además de la definición.
- Derivación determinista del seed de variante.
- Documento de estrategia de migración del contenido existente.
- Tests de identidad, versionado y serialización.

## Scope OUT

**Nada de esto se implementa en esta etapa.**

- Generadores por restricción reutilizables → STAGE-03.
- Catálogo de variantes desplegado y `variantCatalogVersion` → STAGE-03.
- Migrar los cinco desafíos de 7.º → STAGE-04.
- Bandas de dificultad, `difficultyCost`, presupuesto, Run Composer → STAGE-05.
- `FairScore`, `MathPerformance`, `ScorePolicy` competitiva, `scoreVersion` → STAGE-06.
- Egreso, recuperaciones, contenido de 1.º–5.º → STAGE-07 y STAGE-08.
- Ranking, endpoints, persistencia, fair mode → STAGE-09.
- Cualquier cambio al sistema de diseño, a los tokens o a la matemática existente.

## Criterios de aceptación

- [ ] `ScenarioFamily`, `ChallengeTemplate` y `ChallengeVariant` tipados y expuestos por el registro sin `any` ni casts.
- [ ] Dos plantillas de la misma familia coexisten sin duplicar la lógica completa del desafío.
- [ ] Una variante se serializa y se reconstruye idéntica desde su dirección.
- [ ] La derivación de seed de variante es estable y está cubierta por property tests.
- [ ] `tests/unit/architecture-lint.test.ts` y `engine-modules.test.ts` siguen en verde: el motor no depende de React.
- [ ] Existe el documento de estrategia de migración del contenido legacy.
- [ ] Los seis desafíos de 7.º se siguen jugando igual: golden replays sin cambio, o bump de versión justificado y escrito.

## Lectura requerida antes de tocar código

1. `AGENTS.md` de la raíz.
2. Este documento y el [contrato de STAGE-02](implementation-sequence.md).
3. [Familias, plantillas y variantes](../01-game-design/challenge-families-and-variants.md).
4. [Sistema de desafíos](../01-game-design/challenge-system.md) — cuidado con las dos acepciones de «familia».
5. [Game engine](../03-architecture/game-engine.md) y [arquitectura objetivo del motor](../03-architecture/target-engine-architecture.md).
6. [ADR-007](../03-architecture/adr/ADR-007-content-as-data.md) y [ADR-012](../03-architecture/adr/ADR-012-seeded-prng-and-substreams.md).
7. El código: `src/game/challenges/`, `src/game/random/`, `src/content/grade-7/challenges/`.

## Validación requerida

`pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm game:validate-content` · `pnpm game:simulate -- --runs=400 --verify=10` · `pnpm verify`.

Con Node `24.19.0`, la versión que `pnpm toolchain:check` exige exacta.

## Bloqueos

Ninguno. La etapa puede empezar.

## Decisiones abiertas o de Teacher Gate relevantes ahora

- `RECOMENDADA` (D-006): la jerarquía familia/plantilla/variante es dirección de arquitectura, no contrato cerrado. Se implementa de forma ajustable.
- `LOCKED` (D-007): variantes deterministas por seed.
- `OPEN` ([pregunta 46](../07-reference/open-questions.md)): cuántas familias y plantillas por año. **No se cierra en esta etapa**; acá se construye el mecanismo, no el catálogo.

Ninguna decisión de Teacher Gate bloquea STAGE-02. El primer gate docente llega después de STAGE-04 y STAGE-06.

## Evidencia ya disponible

- Sistema de diseño v0.2 — [ADR-017](../03-architecture/adr/ADR-017-paper-visual-identity.md), `pnpm design:check`, E2E de diseño.
- Career Model v2 — [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md), `src/game/progression/career.ts`, `ENGINE_VERSION 2.0.0`.
- Acto del 25 de Mayo y Aura en juego — `src/content/grade-7/challenges/may-25-act.ts`, `src/game/math/classification.ts`, seis pruebas E2E.
- Contratos de run, versiones y seed — `src/game/core/versioning.ts`, `src/game/random/seed.ts`, `RunDescriptor` en `src/game/runs/state.ts`.
- Replay y snapshots — `tests/unit/engine-golden.test.ts`, E2E de reanudación.
- Precursor de verificación autoritativa — `src/server/game/validate-run.ts`, `tests/integration/server-run-validation.test.ts`.
- Blueprint integrado — [ADR-018](../03-architecture/adr/ADR-018-blueprint-v0-2-decision-authority.md).

## Siguiente etapa

Completar STAGE-02 pone `READY` a **STAGE-03 — generación, validación y catálogo de variantes**, y con ella se destraba la migración pendiente de STAGE-04.

El primer gate externo es **Teacher Gate 1**, después de STAGE-04 y STAGE-06.

## Última reconciliación

28 de agosto de 2026, contra `eb7fe8f`, con `pnpm verify` en verde.
