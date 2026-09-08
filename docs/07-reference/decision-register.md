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
| ADR-023 | [Política de score competitivo](../03-architecture/adr/ADR-023-competitive-score-policy.md) | Aceptado |
| ADR-024 | [Progresión, recuperación y egreso](../03-architecture/adr/ADR-024-progression-recovery-and-graduation.md) | Aceptado |

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
| D-005 | Sin game over global: el error cambia el camino, no termina la partida | PRODUCT DIRECTION | **implementado** en STAGE-07: recuperación fail-forward y egreso garantizado ([ADR-024](../03-architecture/adr/ADR-024-progression-recovery-and-graduation.md)) |
| D-006 | Jerarquía `ScenarioFamily → Template → Variant` | RECOMENDADA | **implementada** ([ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md)) y **ejercida en producción**: la familia `bus` aloja dos plantillas con razonamientos distintos ([ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md)); el inventario de contenido sigue abierto |
| D-007 | Variantes deterministas por seed | LOCKED como dirección de arquitectura | implementado ([ADR-003](../03-architecture/adr/ADR-003-deterministic-seeded-engine.md), [ADR-012](../03-architecture/adr/ADR-012-seeded-prng-and-substreams.md)) |
| D-008 | Catálogo de variantes prevalidado y desplegado para competencia | RECOMENDADA | **implementado y consumido por la partida** ([ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md), [ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md)); las versiones publicadas son inmutables y el catálogo oficial de la feria sigue sin congelar |
| D-009 | Intentos ilimitados con mejor resultado verificado | TG1 ACCEPTED · PRODUCT DIRECTION | no implementado; emisión autoritativa, persistencia y ranking pertenecen a STAGE-09 ([modo feria](../05-operations/fair-mode-and-competition-freeze.md)) |
| D-010 | `FairScore` separado de las stats de carrera | RECOMENDADA | **implementado** ([ADR-023](../03-architecture/adr/ADR-023-competitive-score-policy.md)): el score no recibe la carrera, así que no hay por dónde filtrarla |
| D-011 | La matemática domina el `FairScore` | TG1 ACCEPTED | **implementado como regla ejecutable**; el candidato post-Gate `fair-score-dev-2` usa 85/10/5 y sigue `official: false` |
| D-012 | Estilo no puntúa directamente | RECOMENDADA | **implementado**: Estilo y Promedio no son componentes de score, así que no existe el peso que alguien podría subir ([ADR-023](../03-architecture/adr/ADR-023-competitive-score-policy.md)) |
| D-013 | Criterio competitivo posterior a `FairScore DESC → PrestigeScore DESC` | OPEN tras TG1-11 `AJUSTAR` | no implementado; Hitos no dan bonus por aparecer y un empate legítimo puede compartir puesto |
| D-014 | Presupuesto de dificultad por run competitiva | RECOMENDADA; bandas aceptadas en TG1 | **implementado** ([ADR-022](../03-architecture/adr/ADR-022-difficulty-model-and-run-composer.md)); los costos/umbrales exactos siguen calibrables |
| D-015 | Diseño de tareas de piso bajo y techo alto | RECOMENDADA como principio | vigente en el contenido de 7.º, y ahora **ejecutable**: la banda de una plantilla se deriva de su estructura, no de sus números ([ADR-022](../03-architecture/adr/ADR-022-difficulty-model-and-run-composer.md)) |
| D-016 | No hay playtest real con estudiantes antes de la feria | RESTRICCIÓN EXTERNA | declarada ([ciclo de entrega real](../00-product/real-delivery-lifecycle.md)) |
| D-017 | Congelamiento de reglas y score durante el evento oficial | RECOMENDADA como regla de operación | política escrita, sin evento oficial todavía |
| D-TG1-01 | Accesibilidad matemática universal: cada etapa conserva piso de prerrequisitos aproximadamente de 7.º; el año expresa progresión narrativa/contextual, no gating curricular | TG1 ACCEPTED · PRODUCT DIRECTION | requisito canónico para STAGE-08; fuente TG1-01 |
| D-TG1-02 | `AcademicStage ≠ DifficultyBand`; cada etapa puede contener CORE/STANDARD/STRETCH y la dificultad sigue siendo estructural | TG1 ACCEPTED | mecanismo existente preservado; fuente TG1-01/TG1-03 |
| D-TG1-03 | Candidato post-Gate 85 Math / 10 Team / 5 Aura | TG1 ACCEPTED · IMPLEMENTED CANDIDATE | `fair-score-dev-2@2.0.0-post-tg1-candidate`, `official: false`; fuente TG1-04 |
| D-TG1-04 | Una escena puede evaluar varios ejes sólo con evidencia semánticamente independiente; el mismo hecho no se cobra dos veces | TG1 ACCEPTED · PRODUCT DIRECTION | guardrail de autoría; no se duplicó el F1 de May-25 en Aura; fuente TG1-05/TG1-06 |
| D-TG1-05 | Componentes competitivas ausentes salen y los pesos activos se normalizan | TG1 ACCEPTED · IMPLEMENTED | invariante y auditoría conservadas; fuente TG1-07 |
| D-TG1-06 | Una dificultad estructural mayor puede recibir una recompensa competitiva pequeña | TG1 ACCEPTED PRINCIPLE | factores 1,00/1,08/1,15 siguen calibración candidata; fuente TG1-08 |
| D-TG1-07 | Mapeo discreto óptimo/eficiente/funcional/inválido = 100/75/40/10 | TG1 ACCEPTED CANDIDATE | implementado en ambas policies; métricas continuas conservan su señal; fuente TG1-09 |
| D-TG1-08 | Intentos competitivos ilimitados y mejor resultado verificado | TG1 ACCEPTED · PRODUCT DIRECTION | STAGE-09; la infraestructura asigna seed/plan y evita selección manual; fuente TG1-10 |
| D-TG1-09 | Carrera completa con objetivo UX aproximado de 8–10 minutos | TG1 ACCEPTED TARGET | se medirá en STAGE-08; no es timeout ni input de score; fuente TG1-12 |
| D-TG1-10 | Toda run válida completada termina en `GRADUATED` | TG1 ACCEPTED · **IMPLEMENTED** | cerrada en STAGE-07 ([ADR-024](../03-architecture/adr/ADR-024-progression-recovery-and-graduation.md)): la convergencia es estructural, no configurada, y 20.000 carreras de seis años egresan sin hallazgos; fuente TG1-14 |
| D-018 | Un beat de recuperación no aporta evidencia competitiva | RECOMENDADA | **implementada** ([ADR-024](../03-architecture/adr/ADR-024-progression-recovery-and-graduation.md)): descartada por rol en el scorer, así que fallar a propósito no compra una oportunidad extra de puntuar |
| D-019 | Las previas son historia oculta, nunca deuda que bloquee | RECOMENDADA | **implementada**: un año que cierra con lo justo deja rastro para callbacks futuros y no puede impedir el egreso; los callbacks son contenido de STAGE-08 |

## Decisiones de STAGE-08 / Phase 0

Son decisiones de producto y contenido, no ADRs ni evidencia de implementación. La
[envolvente](../01-game-design/stage-08-product-design-envelope.md) y los documentos
especializados conservan el detalle; este registro sólo las indexa. `CANDIDATE` y
`DESIGN-CANDIDATE-APPROVED` preservan calibración/madurez y no equivalen a runtime
congelado.

| ID | Decisión | Madurez | Estado / fuente canónica |
|---|---|---|---|
| D-S08-001 | La carrera progresa adaptación → consolidación → pertenencia → autonomía → responsabilidad → cierre; 7.º y 1.º comparten escuela | LOCKED | [sistema narrativo](../01-game-design/narrative-system.md) |
| D-S08-002 | Año y dificultad son ejes independientes; el piso matemático sigue accesible desde aproximadamente 7.º | LOCKED | [envolvente](../01-game-design/stage-08-product-design-envelope.md) |
| D-S08-003 | Narrativa braided-linear con elenco relacional, voz argentina legible, callbacks medios y previas como memoria | ACCEPTED; previas LOCKED | callbacks multianuales no implementados; [sistema narrativo](../01-game-design/narrative-system.md) |
| D-S08-004 | Proyecto del Curso recurre narrativamente y su Template no es obligatoria en toda run | LOCKED | [envolvente](../01-game-design/stage-08-product-design-envelope.md) |
| D-S08-005 | Pacing 9–10 beats y QUICK/MEDIUM/DEEP son candidatos; primeras tres runs distintas es el goal | ACCEPTED CANDIDATE + LOCKED GOAL | duración sin validar; [envolvente](../01-game-design/stage-08-product-design-envelope.md) |
| D-S08-006 | Team/Aura/Estilo usan evidencia propia y una interacción nueva no se esconde como contenido | LOCKED | [envolvente](../01-game-design/stage-08-product-design-envelope.md) |
| D-S08-007 | RNG raro seeded se aplica después de elegibilidad; aparición no da Prestige ni aumenta techos competitivos | ACCEPTED + LOCKED GUARDRAILS | arquitectura no congelada; [eventos raros](../01-game-design/rare-events-and-prestige.md) |
| D-S08-008 | FairScore sigue primario; Prestige es segundo criterio lexicográfico sin doble conteo | ACCEPTED + LOCKED GUARDRAILS | runtime no implementado; 25×4/cap/premios son `CANDIDATE`; [Prestige](../01-game-design/rare-events-and-prestige.md) |
| D-S08-009 | Career Epilogue v1 y diseño de Milestones forman parte de STAGE-08 | ACCEPTED | no implementados; catálogo/elegibilidad abiertos |
| D-S08-010 | Matriz v0.2 de 25 Templates es la candidata auditada vigente | CANDIDATE_APPROVED_AFTER_CONTENT_AUDIT | 1.º detallado; 2.º–5.º esperan su pass; [matriz](../01-game-design/full-career-content-matrix.md) |
| D-S08-011 | Las cinco Templates de consolidación de 1.º, su placement, Team/Aura y pacing están aprobados a nivel de diseño | DESIGN-CANDIDATE-APPROVED | implementación no iniciada; [diseño de 1.º](../01-game-design/grade-1-template-design.md) |
| D-S08-012 | Rutas candidatas `rehearsal-schedule → schedule-review` y `classroom-layout → scale-fit-review` | ACCEPTED DESIGN | no implementadas; Aura ordinaria de 1.º ausente |
| D-S08-013 | La auditoría de ambas obligaciones bajo máximo un recovery es obligatoria después de implementar 1.º | LOCKED PROCESS | `REQUIRED · PLANNED`; [contrato](../04-quality/post-grade-1-scalability-audit.md) |

La semántica de eventos raros/Prestige todavía no justifica un ADR: es dirección
de producto con implementación abierta. Cuando se congele una arquitectura que
cruce RNG, replay, score, ranking o versionado deberá aplicarse la política de ADR.

La [integración post-Gate](../06-delivery/teacher-gate-1/12-integracion-post-gate.md) es la trazabilidad completa de TG1. Siguen abiertos la oficialización final del score, calibraciones exactas, tercer criterio de empate, catálogo de Hitos, vocabulario y triggers de recuperación, profundidad final de contenido y configuración de competencia.
