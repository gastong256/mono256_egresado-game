# Registro de decisiones

| ADR | Decisión | Estado |
|---|---|---|
| ADR-001 | Web-first Next.js/TypeScript | Aceptado |
| ADR-002 | Monolito modular + BFF | Aceptado |
| ADR-003 | Motor determinista seeded | Aceptado |
| ADR-004 | Scoring oficial server-side | Aceptado |
| ADR-005 | PostgreSQL/Supabase | Aceptado |
| ADR-006 | Gameplay local-first | Aceptado |
| ADR-007 | Content-as-data | Aceptado |
| ADR-008 | Identidad anónima/pseudónima | Aceptado |
| ADR-009 | Leaderboards por evento | Aceptado |
| ADR-010 | Toolchain Node.js/pnpm y artefacto Docker portable | Aceptado |
| ADR-011 | Núcleo funcional con función de transición explícita | Aceptado |
| ADR-012 | PRNG seeded, substreams y contrato de consumo | Aceptado |
| ADR-013 | Aritmética racional exacta para evaluación matemática | Aceptado |
| ADR-014 | Contenido de producto como paquete propio importable desde el cliente | Aceptado |
| ADR-015 | Sistema de diseño con tokens semánticos y paleta restringida | Aceptado (reemplazado parcialmente por ADR-017) |
| ADR-016 | Modelo de jugador de carrera: Promedio, Equipo, Aura y Estilo | Aceptado |
| ADR-017 | Identidad papel: la hoja cuadriculada como canvas del juego | Aceptado |
| ADR-018 | Autoridad y madurez de las decisiones del Project Blueprint v0.2 | Aceptado |
| ADR-019 | Modelo de contenido: familia de escenario, plantilla y variante | Aceptado |
| ADR-020 | Pipeline de variantes y catálogo aprobado | Aceptado |
| ADR-021 | [El catálogo aprobado dentro del juego, y el demo docente](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md) | Aceptado |
| ADR-022 | [Modelo de dificultad y compositor de runs](../03-architecture/adr/ADR-022-difficulty-model-and-run-composer.md) | Aceptado |

## Regla para ADR nuevo

Crear ADR cuando una decisión:
- afecta múltiples módulos;
- es difícil/costosa de revertir;
- cambia una propiedad no funcional significativa;
- cambia proveedor/plataforma principal;
- altera compatibilidad de runs o seguridad.

## Decisiones del Project Blueprint v0.2

Estas decisiones vienen del [Project Blueprint v0.2.0](blueprint-v0.2-integration.md) y **conservan su nivel de madurez**, que es parte de la decisión. [ADR-018](../03-architecture/adr/ADR-018-blueprint-v0-2-decision-authority.md) fija cómo se interpreta cada nivel.

| Nivel | Qué significa para quien implementa |
|---|---|
| **LOCKED** | fundación aceptada; se implementa salvo que una autoridad más nueva la supere |
| **PRODUCT DIRECTION** | dirección fuerte; la arquitectura debe poder sostenerla aunque hoy no exista |
| **RECOMENDADA** | propuesta senior; se implementa configurable, nunca como constante inmutable |
| **TEACHER GATE** | requiere validación del Departamento de Matemática antes del congelamiento |
| **OPEN** | deliberadamente sin resolver; no se cierra dentro del código |
| **DEFERRED** | fuera de alcance a propósito; no es deuda ni backlog urgente |

| ID | Decisión | Nivel | Estado de implementación |
|---|---|---|---|
| D-001 | Identidad visual UI-first: la identidad sale del sistema, no de cientos de assets | LOCKED | implementado ([sistema de diseño](../09-design-system/README.md)) |
| D-002 | Identidad papel v0.2 de Claude Design en lugar de la estética de carrera deportiva | LOCKED | implementado ([ADR-017](../03-architecture/adr/ADR-017-paper-visual-identity.md)) |
| D-003 | Sólo Promedio, Equipo, Aura y Estilo como dimensiones visibles | LOCKED | implementado ([ADR-016](../03-architecture/adr/ADR-016-career-player-model.md)) |
| D-004 | Dominio matemático oculto, nunca una barra de «Conocimiento» | LOCKED | implementado |
| D-005 | Sin game over global: el error cambia el camino, no termina la partida | PRODUCT DIRECTION | parcial; falta contenido de recuperación ([fail-forward](../01-game-design/graduation-and-fail-forward.md)) |
| D-006 | Jerarquía `ScenarioFamily → Template → Variant` | RECOMENDADA | **implementada** ([ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md)) y **ejercida en producción**: la familia `bus` aloja dos plantillas con razonamientos distintos ([ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md)); el inventario de contenido sigue abierto |
| D-007 | Variantes deterministas por seed | LOCKED como dirección de arquitectura | implementado ([ADR-003](../03-architecture/adr/ADR-003-deterministic-seeded-engine.md), [ADR-012](../03-architecture/adr/ADR-012-seeded-prng-and-substreams.md)) |
| D-008 | Catálogo de variantes prevalidado y desplegado para competencia | RECOMENDADA | **implementado y consumido por la partida** ([ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md), [ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md)); las versiones publicadas son inmutables y el catálogo oficial de la feria sigue sin congelar |
| D-009 | Intentos ilimitados con personal best en el ranking | RECOMENDADA · TEACHER GATE | no implementado ([modo feria](../05-operations/fair-mode-and-competition-freeze.md)) |
| D-010 | `FairScore` separado de las stats de carrera | RECOMENDADA | no implementado ([score competitivo](../01-game-design/competitive-scoring-and-ranking.md)) |
| D-011 | La matemática domina el `FairScore` | RECOMENDADA · TEACHER GATE | no implementado |
| D-012 | Estilo no puntúa directamente | RECOMENDADA | vigente como regla de diseño |
| D-013 | Desempate lexicográfico determinista y profundo | RECOMENDADA · TEACHER GATE | no implementado |
| D-014 | Presupuesto de dificultad por run competitiva | RECOMENDADA | **implementado** ([ADR-022](../03-architecture/adr/ADR-022-difficulty-model-and-run-composer.md)) como política versionada; la calibración sigue en Teacher Gate |
| D-015 | Diseño de tareas de piso bajo y techo alto | RECOMENDADA como principio | vigente en el contenido de 7.º, y ahora **ejecutable**: la banda de una plantilla se deriva de su estructura, no de sus números ([ADR-022](../03-architecture/adr/ADR-022-difficulty-model-and-run-composer.md)) |
| D-016 | No hay playtest real con estudiantes antes de la feria | RESTRICCIÓN EXTERNA | declarada ([ciclo de entrega real](../00-product/real-delivery-lifecycle.md)) |
| D-017 | Congelamiento de reglas y score durante el evento oficial | RECOMENDADA como regla de operación | política escrita, sin evento oficial todavía |

Los valores exactos de D-009, D-011 y D-013 —coeficientes, topes, política de intentos y de empate— siguen en [preguntas abiertas](open-questions.md). Cerrar uno de esos ítems en una sesión docente actualiza **esta tabla**, no un registro nuevo.
