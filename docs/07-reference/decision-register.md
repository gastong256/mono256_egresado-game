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
| ADR-025 | [Evolución acotada de contratos de carrera completa](../03-architecture/adr/ADR-025-full-career-contract-evolution.md) | Aceptado; implementación futura |

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
| D-012 | Estilo sólo Career/Narrative, sin FairScore ni Prestige competitivo | LOCKED v1, Product Pass | FairScore ya lo excluye; track STYLE de Prestige supersedido; [Prestige](../01-game-design/rare-events-and-prestige.md) |
| D-013 | FairScore DESC → Prestige DESC → puesto compartido; ningún criterio temporal | LOCKED v1, supersede candidato post-TG1 | implementación STAGE-09; [ranking](../01-game-design/competitive-scoring-and-ranking.md#desempate) |
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
| D-S08-004 | Recurring Arc: presencia narrativa no exige desafío puntuable | LOCKED | [arco](../01-game-design/full-career-content-matrix.md#recurring-arc-policy); frecuencia en D-S08-019 |
| D-S08-005 | Normal/Fair exactamente nueve beats; envolvente de pacing/diversidad y novedad en Practice | LOCKED cantidad; PRODUCT DIRECTION envolvente | supersede target 9–10; [matriz](../01-game-design/full-career-content-matrix.md#envolvente-normalfair-v1); sin runtime |
| D-S08-006 | Team/Aura/Estilo usan evidencia propia y una interacción nueva no se esconde como contenido | LOCKED | [envolvente](../01-game-design/stage-08-product-design-envelope.md) |
| D-S08-007 | Rareza seeded acotada; aparición cero; Fair fija presencia por edición | LOCKED guardrails; RECOMENDADA calibración v1 | [eventos raros](../01-game-design/rare-events-and-prestige.md); ADR-025 futuro |
| D-S08-008 | Prestige secundario 40/40/20, máximo 100, evidencia independiente | LOCKED v1 | supersede 25×4/STYLE; [Prestige](../01-game-design/rare-events-and-prestige.md); sin runtime |
| D-S08-009 | Career Epilogue v1 y estructura de Milestones cerrados | LOCKED v1 | [narrativa](../01-game-design/narrative-system.md); logros por autorar, sin runtime |
| D-S08-010 | Matriz conserva 25 Templates y 6/13/6 auditadas sin reemplazos adicionales | DESIGN-CANDIDATE-APPROVED | [matriz](../01-game-design/full-career-content-matrix.md); no producción ni validación empírica |
| D-S08-011 | Las cinco Templates de consolidación de 1.º, su placement, Team/Aura y pacing están aprobados a nivel de diseño | DESIGN-CANDIDATE-APPROVED | implementación no iniciada; [diseño de 1.º](../01-game-design/grade-1-template-design.md) |
| D-S08-012 | Rutas candidatas `rehearsal-schedule → schedule-review` y `classroom-layout → scale-fit-review` | ACCEPTED DESIGN | no implementadas; Aura ordinaria de 1.º ausente |
| D-S08-013 | La auditoría de ambas obligaciones bajo máximo un recovery es obligatoria después de implementar 1.º | LOCKED PROCESS | `REQUIRED · PLANNED`; [contrato](../04-quality/post-grade-1-scalability-audit.md) |
| D-S08-014 | Pase de 2.º aprobado: pertenencia, placement, pacing, señales y ruta de encuesta | DESIGN-CANDIDATE-APPROVED | no implementado; [diseño de 2.º](../01-game-design/grade-2-template-design.md) |
| D-S08-015 | Pase de 3.º aprobado: autonomía, riqueza de Estilo y dos rutas de recuperación | DESIGN-CANDIDATE-APPROVED | no implementado; [diseño de 3.º](../01-game-design/grade-3-template-design.md) |
| D-S08-016 | Pase de 4.º aprobado: responsabilidad, cluster, reemplazo raro y dos rutas | DESIGN-CANDIDATE-APPROVED | no implementado; [diseño de 4.º](../01-game-design/grade-4-template-design.md) |
| D-S08-017 | Pase de 5.º aprobado: cierre/futuro, síntesis, señales y dos rutas | DESIGN-CANDIDATE-APPROVED | no implementado; [diseño de 5.º](../01-game-design/grade-5-template-design.md) |
| D-S08-018 | Event Cluster Policy: Intercurso de 2.º, School Event de 4.º y Egreso de 5.º admiten máximo una Template puntuable de cada cluster por run normal | LOCKED | política de producto, sin campos/runtime nuevos; [clusters](../01-game-design/full-career-content-matrix.md#event-cluster-policy) |
| D-S08-019 | Project hard max 2; target 1–2 y preferencia no consecutiva | LOCKED v1 máximo; SOFT target/separación | supersede máximo candidato; [frecuencia](../01-game-design/full-career-content-matrix.md#frecuencia-del-project-arc) |
| D-S08-020 | Callback Independence: historia enriquece contexto sin condicionar comprensión, resolución ni techo de FairScore | LOCKED | [callbacks](../01-game-design/narrative-system.md#callback-independence) |
| D-S08-021 | Responsibility Externality: 4.º muestra efectos sobre terceros/sistemas sin Equipo automático | LOCKED | [externalidad](../01-game-design/narrative-system.md#responsibility-externality) |
| D-S08-022 | Career Convergence: 5.º recupera historia visiblemente manteniendo Templates autocontenidas | LOCKED | [convergencia](../01-game-design/narrative-system.md#career-convergence) |
| D-S08-023 | Saliencia determinista 3–5 por segmentos y prioridad autorada/ID | LOCKED v1 | supersede algoritmo diferido; [saliencia](../01-game-design/narrative-system.md#narrative-salience); sin runtime |
| D-S08-024 | `represent-class`: Math, acción pública de Aura y logro histórico de Prestige usan evidencia distinta; aparición vale 0 | LOCKED | [diseño de 4.º](../01-game-design/grade-4-template-design.md#y4represent-class) |
| D-S08-025 | `next-step-options`: FairScore de viabilidad, preferencia opcional sólo Estilo/epílogo, sin orientación vocacional | LOCKED | [diseño de 5.º](../01-game-design/grade-5-template-design.md#y5next-step-options) |
| D-S08-026 | Product Pass y conformidad aceptados; reconciliación cierra Phase 0; siguiente Phase 1 G1 | LOCKED proceso | [integración](full-career-product-audit-integration.md), [etapa actual](../06-delivery/current-stage.md); sin implementación en este commit |
| D-S08-027 | Preferir diversidad cognitiva entre planes válidos; evitar semana + recorrido de 3.º sólo cuando haya alternativa equivalente más diversa | ACCEPTED · SOFT | [composición](../01-game-design/full-career-content-matrix.md#diversidad-cognitiva); no exclusión dura |

## Cierre del Product Pass — 2026-09-10

El [registro de integración](full-career-product-audit-integration.md) relaciona
FC-001…FC-030 con fuentes únicas y conserva las supersesiones. Son decisiones de
producto, no flags `official` ni evidencia de implementación.

| ID | Decisión | Madurez | Fuente / estado |
|---|---|---|---|
| D-S08-028 | Cinco motores reutilizables; los nombres de tableros son modos | LOCKED v1 | [taxonomía](../01-game-design/challenge-system.md); soporte runtime parcial |
| D-S08-029 | REPASO visible; INVALID en fuentes recovery-capable; FUNCTIONAL no | LOCKED v1 | [fail-forward](../01-game-design/graduation-and-fail-forward.md); label global pendiente |
| D-S08-030 | Una selección determinista, debrief del resto y cierre de todas | LOCKED producto | [fail-forward](../01-game-design/graduation-and-fail-forward.md); deltas ADR-025, gate post-G1 pendiente |
| D-S08-031 | Competition Seed compartida server-issued por edición; reintentos iguales; Practice no oficial | LOCKED v1 | [modo feria](../05-operations/fair-mode-and-competition-freeze.md); STAGE-09 |
| D-S08-032 | Probabilidades y límites por banda de rareza | RECOMENDADA, calibración v1 aceptada | [defaults](../01-game-design/rare-events-and-prestige.md#defaults-de-practice-v1); no constantes ni freeze |
| D-S08-033 | Top 3 público pseudónimo; puesto propio privado; sin exposición infinita inferior | LOCKED v1 | [leaderboard](../05-operations/leaderboard-and-moderation.md); no implementado |
| D-S08-034 | Intrinsic Math Gate IM-1…IM-5 y legitimidad de estrategias | LOCKED | [autoría](../01-game-design/content-authoring-guide.md#intrinsic-math-gate) |
| D-S08-035 | Formas semánticas y materializaciones son distintas; targets 3/4, 12/16, 8 | LOCKED distinción; RECOMENDADA targets | [profundidad](../01-game-design/content-authoring-guide.md#profundidad-de-variantes); no límite de schema |
| D-S08-036 | Estilo no se infiere de azar, INVALID o calidad matemática sola | LOCKED dirección | [autoría](../01-game-design/content-authoring-guide.md#estilo-y-evidencia-de-identidad); revisar contenido al implementar, sin cambios runtime actuales |
| D-S08-037 | Acceso teclado/tap sin drag, color redundante, reduced motion; 44 px target interno | LOCKED acceso; PRODUCT DIRECTION target | [UX](../01-game-design/ux-interaction-design.md); walkthroughs antes de feria |
| D-S08-038 | Sin LLM en gameplay, score, materialización o epílogo competitivo v1 | LOCKED | [autoría](../01-game-design/content-authoring-guide.md#sin-llm-en-runtime-competitivo-v1) |
| D-S08-039 | Contratos futuros acotados: composición global, Repaso, hechos, rareza y replay | Aceptado, NOT IMPLEMENTED | [ADR-025](../03-architecture/adr/ADR-025-full-career-contract-evolution.md) |
| D-S08-040 | Conservar los 25 diseños; no ampliar antes de G1 salvo BLOCKER genuino; Teacher Demo separado | LOCKED alcance | [matriz](../01-game-design/full-career-content-matrix.md) y roadmap |
| D-S08-041 | Mitigar ausencia de playtest con docentes, walkthroughs y simulación, sin llamarlos validación estudiantil | PRODUCT DIRECTION | [validación de contenido](../04-quality/content-validation.md); riesgo residual |
| D-S08-042 | Montos ficticios/relativos y tono argentino legible, sin juicios de poder adquisitivo ni marcas necesarias | LOCKED guardrail | [autoría](../01-game-design/content-authoring-guide.md) |
| D-S08-043 | Rueda y datos móviles conservan CORE por factibilidad constructiva, sin optimización estructural; thresholds y bandas de 7.º intactos | ACCEPTED · precisión autorizada de Phase 1 | [traits y envolvente](../01-game-design/grade-1-template-design.md#difficulty-reconciliation-precisión-de-phase-1); no reapertura de Phase 0 |

## STAGE-08 / Phase 1 — implementación de 1.º (2026-09-11)

Decisiones técnicas y de autoría tomadas al implementar; no reabren producto.

| ID | Decisión | Madurez | Fuente / estado |
|---|---|---|---|
| D-S08-044 | Engine `7.0.0` y action log `5` por composición global, respuestas constructivas y fail-closed; snapshot `7` sin campos nuevos; 7.º conserva ruleset, contenido, catálogo y score | ACCEPTED · implementado | [ADR-025](../03-architecture/adr/ADR-025-full-career-contract-evolution.md#implementación-de-phase-1-2026-09-11) |
| D-S08-045 | Metadata de composición tipada y `CareerConstraints` con alcance `partial-development`/`full-career`; búsqueda acotada con validador independiente; una carrera parcial nunca es oficial | ACCEPTED · implementado | ADR-025; `7.º → 1.º` es práctica local |
| D-S08-046 | Repaso practicado/debriefeado derivado de obligaciones y ruteo; approved-only fail-closed en creación y en el borde del beat | ACCEPTED · implementado | ADR-024/ADR-025; gate post-G1 pendiente |
| D-S08-047 | Estilo de 1.º desde rasgos estratégicos independientes de la calidad; gate: óptimo alcanzable con ≥2 estilos y ningún estilo atado a un solo nivel | ACCEPTED · autoría; pesos candidatos | [implementación de 1.º](../01-game-design/grade-1-template-design.md#implementación-runtime-phase-1); pregunta 47 sigue para freeze |
| D-S08-048 | Expo: robustez del óptimo = reemplazo posible para presentar; dependencia real «presenta quien investigó o construyó»; nota de Promedio por ser el proyecto evaluado del curso | ACCEPTED · autoría | ídem; FairScore sin cambios |
| D-S08-049 | Catálogo `grade-1-dev-1` con la política de build de 7.º; sign-off manual de la rueda y revisión del Departamento quedan como gates de producción | ACCEPTED · desarrollo | [variantes](../04-quality/variant-validation-and-audit.md#catálogo-de-1º-grade-1-dev-1) |
| D-S08-050 | `rare.y1.power-outage` diferido: hechos registrados y hook `implemented: false`; sin orquestación de rareza antes de ADR-025 completo | ACCEPTED · diferido | [eventos raros](../01-game-design/rare-events-and-prestige.md) |
| D-S08-051 | El encabezado de etapa cuenta la etapa con la duración del plan; sus celdas se angostan antes de desbordar | ACCEPTED · UI | [primitivas de juego](../09-design-system/game-components.md) |

## STAGE-08 / Post-Grade-1 Scalability Audit (2026-09-14)

Ejecución del gate sobre 1.º real. Ninguna decisión de producto se reabrió.

| ID | Decisión | Madurez | Fuente / estado |
|---|---|---|---|
| D-S08-052 | El gate post-G1 pasa como `PASS WITH REQUIRED HARDENING — RESOLVED`: un Repaso que practica una obligación y debriefea el resto se sostiene con contenido real, y 2.º–5.º quedan desbloqueados | ACCEPTED · gate ejecutado | [audit post-G1](../04-quality/post-grade-1-scalability-audit.md#resultado-de-la-ejecución-2026-09-14) |
| D-S08-053 | La celda del plano corta el texto: varios objetos en una celda no pueden ensanchar la tabla ni sacar la pantalla del viewport a 360 px | ACCEPTED · hardening | E2E `layout-invalid`, que falla sin el arreglo |
| D-S08-054 | El reflow se mide también con la respuesta ya construida, no sólo con la interacción vacía | ACCEPTED · cobertura | `tests/e2e/grade-1.spec.ts` |
| D-S08-055 | ~~El piso declarado es 360 px; bajar el piso queda como decisión de producto abierta~~ **Superada por D-S08-057 el 2026-09-15** | SUPERSEDED | [accesibilidad](../09-design-system/accessibility.md) |
| D-S08-056 | El costo de composición global —unos 2,7 s con 36 Templates— se vuelve a medir con el catálogo real antes de componer la carrera oficial | ACCEPTED · riesgo registrado | [audit post-G1](../04-quality/post-grade-1-scalability-audit.md#resultado-de-la-ejecución-2026-09-14); `tests/unit/post-g1-composer-audit.test.ts` |

## STAGE-08 / Piso de reflow (2026-09-15)

| ID | Decisión | Madurez | Fuente / estado |
|---|---|---|---|
| D-S08-057 | El piso de reflow de la experiencia general es **320 px**: sin scroll horizontal de página, sin pérdida de información ni de funcionalidad, con teclado y alternativas sin arrastre intactas. `html` declara `min-width: 320px` | PRODUCT DECISION · implementada | [accesibilidad](../09-design-system/accessibility.md); [cierre de F-03](../04-quality/post-grade-1-scalability-audit.md#cierre-de-f-03-2026-09-15) |
| D-S08-058 | Una representación que necesita dos dimensiones por significado puede scrollear **dentro de su propia región**, alcanzable por teclado; nunca la página, y nunca como única vía para completar el desafío | PRODUCT DECISION · implementada | plano de 1.º: los controles X/Y/orientación completan la respuesta |

La integración de TG1 permanece histórica en [su acta y trazabilidad](../06-delivery/teacher-gate-1/12-integracion-post-gate.md).
Siguen pendientes la oficialización/freeze, validación empírica, autoría ejecutable,
catálogo concreto de logros, operación/auth/retención y el gate post-G1. Label,
trigger v1, multiobligación, seed común, tracks Prestige, puesto compartido y
saliencia ya no son aperturas de prediseño.
