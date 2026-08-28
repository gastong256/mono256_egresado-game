# Etapa actual

Vista corta del estado de ejecución. El detalle completo, los contratos de todas las etapas y el protocolo de actualización están en el [roadmap de implementación](implementation-sequence.md), que es la autoridad.

---

## STAGE-03 — Generación, validación y catálogo de variantes

**Estado:** `READY` — dependencias satisfechas, nadie la empezó todavía.

## Por qué está activa

STAGE-02 está `DONE` con evidencia: el contenido ya se direcciona por familia de escenario, plantilla y variante; una variante tiene identidad estable y substream propio; el catálogo de contenido disponible está separado del plan de la run; la elegibilidad por etapa y los roles de colocación son declarativos; y agregar contenido nuevo no requiere tocar el motor. Ver [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md).

Lo que falta ahora es **producción y control de variantes en cantidad**. Hoy cada plantilla trae dos o tres casos escritos a mano. Eso alcanza para probar la arquitectura y no alcanza para una feria: sin generación por restricción, catálogo prevalidado y auditoría estadística, no hay forma de afirmar que ninguna variante desplegada es ambigua, imposible o trivial.

## Objetivo

Poder generar, validar y reproducir un conjunto grande de variantes sin depender de aleatoriedad ambiente, y desplegar sólo las aprobadas.

> Variabilidad no es aleatoriedad libre.

## Scope IN

- Generación por restricción, incluida generación inversa donde convenga.
- `VariantValidator` con invariantes genéricos y por plantilla, como contrato transversal.
- Tooling offline: `generador → N seeds candidatas → validación → análisis estadístico → catálogo aprobado`.
- Catálogo desplegado, versionado y reproducible, **distinto** del `ContentCatalog` autorado que ya existe.
- `variantCatalogVersion` en la identidad de la run.
- Selección determinista de variantes aprobadas por id.

## Scope OUT

**Nada de esto se implementa en esta etapa.**

- Bandas de dificultad, `difficultyCost`, presupuesto y compositor de runs → STAGE-05. El presupuesto ya está definido como contrato validable; **construir** planes no es de acá.
- `FairScore`, `MathPerformance`, `ScorePolicy` competitiva, `scoreVersion` → STAGE-06.
- Enriquecer 7.º con plantillas que aporten variación cognitiva real y preparar la Teacher Demo Candidate → STAGE-04. La migración estructural de los seis desafíos actuales ya está completa; mover contenido de año sigue abierto.
- Egreso, recuperaciones, contenido de 1.º–5.º → STAGE-07 y STAGE-08.
- Ranking, endpoints, persistencia, fair mode → STAGE-09.
- Cerrar el inventario de escenarios: sigue **OPEN**.
- Cualquier cambio al sistema de diseño, a los tokens o a la matemática existente.

## Criterios de aceptación

- [ ] Los generadores son deterministas y no consultan ninguna fuente ambiente.
- [ ] Los validadores rechazan efectivamente casos inválidos, con test que lo demuestre.
- [ ] Miles de seeds por plantilla donde el espacio paramétrico lo justifique.
- [ ] El tooling reporta fallas de forma legible por máquina.
- [ ] **Cero variantes inválidas en el catálogo desplegado.**
- [ ] Cero opciones duplicadas en el catálogo desplegado.
- [ ] El catálogo es reproducible y versionado: el mismo insumo produce el mismo catálogo.
- [ ] La auditoría estadística reporta sesgo de posición, distribución de dificultad, duplicados por fingerprint y tasa de invalidez.
- [ ] El runtime competitivo selecciona sólo variantes aprobadas.

## Lectura requerida antes de tocar código

1. `AGENTS.md` de la raíz.
2. Este documento y el [contrato de STAGE-03](implementation-sequence.md).
3. [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md) — el vocabulario sobre el que se construye.
4. [Familias, plantillas y variantes](../01-game-design/challenge-families-and-variants.md).
5. [Validación y auditoría de variantes](../04-quality/variant-validation-and-audit.md) y [validación de contenido](../04-quality/content-validation.md).
6. [Migración del modelo de contenido](../03-architecture/content-model-migration.md) — cómo se autora una plantilla hoy.
7. [Base teórica](../07-reference/research-basis.md) — por qué se pregeneran y se aprueban las variantes.
8. El código: `src/game/challenges/`, `src/game/content/`, `src/content/grade-7/challenges/`.

## Validación requerida

`pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm game:validate-content` · `pnpm game:simulate` · `pnpm verify`.

Con Node `24.19.0`, la versión que `pnpm toolchain:check` exige exacta.

## Bloqueos

Ninguno. La etapa puede empezar.

## Decisiones abiertas o de Teacher Gate relevantes ahora

- `RECOMENDADA` (D-008): catálogo prevalidado y desplegado para competencia. Es dirección de arquitectura, no contrato cerrado.
- `LOCKED` (D-007): variantes deterministas por seed. Ya implementado; no se reabre.
- `OPEN` ([preguntas 46 y 46-bis](../07-reference/open-questions.md)): cuántas familias, plantillas y variantes tiene Egresado, y qué pasa con los seis escenarios actuales. **No se cierra en esta etapa**: acá se construye la maquinaria de producción, no el inventario.

Ninguna decisión de Teacher Gate bloquea STAGE-03. El primer gate docente llega después de STAGE-04 y STAGE-06.

## Evidencia ya disponible

- Modelo de contenido — [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md), `src/game/challenges/content-model.ts`, `content-catalog.ts`, `src/game/content/run-plan.ts`.
- Direccionamiento determinista de variantes — `variantRngPath`, `deriveVariantSeed`, `tests/property/content-model.property.test.ts`.
- Catálogo ≠ plan de run, roles, elegibilidad y presupuesto — `tests/unit/content-model.test.ts`, 34 tests.
- Contenido nuevo sin tocar el motor — test de registro sintético en el mismo archivo.
- Equivalencia semántica de la migración — `tests/unit/engine-golden.test.ts`: mismo recorrido, score, perfil y comandos.
- Versionado — `ENGINE_VERSION 3.0.0`, `SNAPSHOT_SCHEMA_VERSION 3`, contenido `0.3.0-dev` y `0.4.0-grade-7`, ruleset sin cambios.
- Sistema de diseño v0.2 — [ADR-017](../03-architecture/adr/ADR-017-paper-visual-identity.md), `pnpm design:check`, E2E de diseño.
- Career Model v2 — [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md).
- Contratos de run, versiones y seed — `src/game/core/versioning.ts`, `src/game/random/seed.ts`.
- Precursor de verificación autoritativa — `src/server/game/validate-run.ts`.

## Siguiente etapa

Completar STAGE-03 destraba **STAGE-04 — enriquecimiento de 7.º y Demo Candidate**, que usa el pipeline de variantes en contenido real, suma estructuras cognitivas donde aporten y define la selección de la demo docente sin confundirla con una run normal. También destraba **STAGE-05 — dificultad y Run Composer**, que es quien empieza a *construir* planes en vez de sólo validarlos.

El primer gate externo es **Teacher Gate 1**, después de STAGE-04 y STAGE-06.

## Última reconciliación

28 de agosto de 2026, al cerrar STAGE-02, con `pnpm verify` en verde.
