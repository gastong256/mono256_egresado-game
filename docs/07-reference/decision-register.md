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
| D-S08-056 | ~~El costo de composición global —unos 2,7 s con 36 Templates— se vuelve a medir con el catálogo real antes de componer la carrera oficial~~ **CERRADA el 2026-09-16 con evidencia**: con las 42 Templates reales, 300 carreras compuestas dan p50 **384 ms**, p95 **404 ms** y peor caso **434 ms**, 0 fallas y 0 planes inválidos. Los 2,7 s eran un artefacto del catálogo sintético, no del algoritmo | CLOSED · aceptada con evidencia | `tests/integration/full-career.test.ts`; [audit post-G1](../04-quality/post-grade-1-scalability-audit.md#resultado-de-la-ejecución-2026-09-14) |

## STAGE-08 / Piso de reflow (2026-09-15)

| ID | Decisión | Madurez | Fuente / estado |
|---|---|---|---|
| D-S08-057 | El piso de reflow de la experiencia general es **320 px**: sin scroll horizontal de página, sin pérdida de información ni de funcionalidad, con teclado y alternativas sin arrastre intactas. `html` declara `min-width: 320px` | PRODUCT DECISION · implementada | [accesibilidad](../09-design-system/accessibility.md); [cierre de F-03](../04-quality/post-grade-1-scalability-audit.md#cierre-de-f-03-2026-09-15) |
| D-S08-058 | Una representación que necesita dos dimensiones por significado puede scrollear **dentro de su propia región**, alcanzable por teclado; nunca la página, y nunca como única vía para completar el desafío | PRODUCT DECISION · implementada | plano de 1.º: los controles X/Y/orientación completan la respuesta |

## STAGE-08 / Implementación de 2.º y 3.º (2026-09-15)

| ID | Decisión | Madurez | Fuente / estado |
|---|---|---|---|
| D-S08-059 | La autoría deja de ser de 1.º: las mecánicas compartidas —ejes de candidato, escalera 100/75/40/10, gates de Estilo y witness— viven en `src/content/authoring.ts` y 1.º las re-exporta sin cambiar una línea | ACCEPTED · arquitectura | `src/content/authoring.ts`; `src/content/grade-1/authoring.ts` |
| D-S08-060 | El motor contrata una sexta respuesta semántica, `classification`: enunciados etiquetados contra un conjunto común, con la acción pública en su propio campo para que Math y Aura no puedan pagarse dos veces. Engine `8.0.0`, action log `6` | ACCEPTED · contrato | `interactions.ts`, `commands.ts`, `y2.standings-claim` |
| D-S08-061 | 2.º queda implementado sobre `grade-2-dev-1`: cinco Templates, un Repaso y práctica parcial `7.º → 2.º`, con evidencia Math/Equipo separada en el plan del Intercurso y Math/Aura separada en la tabla | ACCEPTED · implementación | [diseño de 2.º](../01-game-design/grade-2-template-design.md#implementación-runtime) |
| D-S08-062 | El motor contrata una séptima respuesta, `route-builder` —el orden de las paradas—, y un modo de varios días para la agenda, con minutos absolutos desde el primer día. Engine `9.0.0`, action log `7`; snapshot `7` sin cambios | ACCEPTED · contrato | `interactions.ts`, `commands.ts`, `y3.route-plan`, `y3.week-planner` |
| D-S08-063 | Una política de composición **congela** sus objetivos blandos: agregar uno al vocabulario no puede cambiar en silencio qué plan gana en un content set ya publicado. 7.º y los fixtures declaran `PUBLISHED_OBJECTIVES_V1` | ACCEPTED · hardening | `composition-policy.ts`; `tests/unit/run-composer.test.ts` |
| D-S08-064 | La preferencia blanda de diversidad cognitiva de 3.º se implementa como objetivo `cognitive-variety`: **cuenta** las parejas de la etapa cuyos perfiles difieren en un rasgo o menos, y prefiere menos. Contar en vez de maximizar la distancia es lo que evita fijar una sola pareja en todas las runs. Ordena planes válidos, nunca filtra, y el compositor sigue sin conocer un solo id de desafío | ACCEPTED · composición | `composer.ts` (`NEAR_PROFILE_DISTANCE`); `tests/unit/grade-3-composition.test.ts` |
| D-S08-065 | `y3.transport-pass` no declara Estilo: con cuatro formas de pagar, cada elección tiene un solo nivel y una etiqueta de estrategia sería el resultado dicho de nuevo | ACCEPTED · autoría | [diseño de 3.º](../01-game-design/grade-3-template-design.md#implementación-runtime) |
| D-S08-066 | 3.º queda implementado sobre `grade-3-dev-1`: cinco Templates, dos Repasos y práctica parcial `7.º → 3.º`, con Math/Equipo separada en el Día del Amigo y en la feria de tecnología | ACCEPTED · implementación | ídem |
| D-S08-067 | La orquestación de rareza, los slots de Prestige y el epílogo se implementan una sola vez en la integración de carrera completa, no por año: `rare.y2.missing-player` y `rare.y3.offline-project` siguen siendo hooks sin runtime | ACCEPTED · secuencia | [eventos raros](../01-game-design/rare-events-and-prestige.md); [roadmap](../06-delivery/implementation-sequence.md#stage-08-contenido-incremental-de-1º-a-5º) |

## STAGE-08 / Implementación de 4.º (2026-09-16)

| ID | Decisión | Madurez | Fuente / estado |
|---|---|---|---|
| D-S08-068 | 4.º queda implementado sobre `grade-4-dev-1`: cinco Templates, dos Repasos y práctica parcial `7.º → 4.º`, con el cluster del evento escolar aportando como máximo una Template puntuable | ACCEPTED · implementación | [diseño de 4.º](../01-game-design/grade-4-template-design.md#implementación-runtime) |
| D-S08-069 | La externalidad de 4.º se muestra en la consecuencia y en la matemática —un puesto vacío, una cola en la vereda, gente parada— pero **no** se cobra como Equipo. Equipo aparece sólo donde hay preferencias de otras personas que medir, que es `shift-coverage` | ACCEPTED · autoría | ídem; `tests/unit/grade-4-event-flow.test.ts` |
| D-S08-070 | `y4.school-event-flow` usa el motor `Allocate / Constrain` en vez del `Spatial / Graph Canvas` que sugiere la ficha: la respuesta es un reparto de ayudantes y un lienzo de red distorsionaría la matemática. Estrena la familia de razonamiento `SYSTEMS_OPTIMIZATION` | ACCEPTED · autoría | la ficha declara que sus nombres de interacción son modos, no capacidades runtime |
| D-S08-071 | `y4.represent-class` se agenda con el rol `special`, que la composición usa **en lugar de** una secundaria compatible: el año conserva dos beats ordinarios y el techo de FairScore no se mueve. No otorga Prestige y aparecer vale cero | ACCEPTED · composición | `tests/integration/grade-4-run.test.ts`; `tests/unit/grade-4-represent-class.test.ts` |
| D-S08-072 | La elegibilidad condicional de `y4.represent-class` y su evidencia de Prestige quedan para la integración de carrera completa, junto con el resto de la orquestación de rareza (D-S08-067); hoy la Template existe y es neutral en oportunidades | ACCEPTED · diferido | [roadmap](../06-delivery/implementation-sequence.md#stage-08-contenido-incremental-de-1º-a-5º) |
| D-S08-073 | Los niveles de `y4.event-floor-plan` se leen de hechos del salón —que sobre lugar para una mesa más, que entre la barra— y no de cuántas zonas se pusieron: con la capacidad decidiendo cuántas mesas hacen falta, contar zonas haría inalcanzable un nivel en la mitad de los salones | ACCEPTED · autoría | `tests/unit/grade-4-floor-plan.test.ts` |
| D-S08-074 | La búsqueda de witnesses del salón tiene presupuesto de nodos y **rechaza** la variante si se agota, en vez de aprobarla a medias | ACCEPTED · fail-closed | `floorSearch`, `floorGates` |

## STAGE-08 / Implementación de 5.º (2026-09-16)

| ID | Decisión | Madurez | Fuente / estado |
|---|---|---|---|
| D-S08-075 | 5.º queda implementado sobre `grade-5-dev-1`: cinco Templates, dos Repasos y el primer set con los seis años, `7.º → 5.º`, todavía `official: false` | ACCEPTED · implementación | [diseño de 5.º](../01-game-design/grade-5-template-design.md#implementación-runtime) |
| D-S08-076 | El guardrail socioeconómico del viaje se implementa por construcción: entre los parámetros no existe ningún dato por persona, sólo el fondo del curso, los días y los lugares. El precio por persona que sí aparece es el del micro, un costo del paquete | ACCEPTED · autoría | `tests/unit/grade-5-final-trip.test.ts` |
| D-S08-077 | En `y5.next-step-options` la preferencia personal no alimenta **nada** puntuable ni descriptivo: ni FairScore, ni Equipo, ni Aura, ni Estilo. Queda registrada como hecho de carrera para el cierre y la pantalla lo dice. Mapear una elección de vida a un eje de Estilo habría insinuado una jerarquía que el diseño prohíbe | ACCEPTED · autoría | ídem; `tests/unit/grade-5-screen-yearbook-next.test.ts` |
| D-S08-078 | `y5.stage-screen` usa el motor `Choice / Compare` en vez del `Spatial / Graph Canvas` que sugiere la ficha: la decisión es elegir entre formas de proyectar y toda la geometría está escrita. La familia de razonamiento declarada sigue siendo `SPATIAL` | ACCEPTED · autoría | misma regla que D-S08-070 |
| D-S08-079 | Los niveles de `y5.yearbook` se miden contra **cuántas secciones se podían completar** con esas páginas, no contra completarlas todas: el material nunca entra entero, así que exigir todo dejaría el nivel máximo fuera de alcance | ACCEPTED · autoría | `bestCoverage`; `tests/unit/grade-5-screen-yearbook-next.test.ts` |
| D-S08-080 | El viaje y la pantalla construyen sus variantes por papeles —cuál no se puede hacer, cuál no trae lo pedido, cuál lo trae justo— en vez de combinar medidas al azar: con cuatro o cinco opciones, los cuatro niveles no aparecen por combinatoria y rotar los papeles es lo que impide que la respuesta sea siempre la misma | ACCEPTED · autoría | `tests/unit/grade-5-final-trip.test.ts` |

## STAGE-08 / Integración de carrera completa (2026-09-16)

La carrera real 7.º → 5.º: composición de nueve beats sobre el catálogo
aprobado, eventos raros, Prestige, hitos, epílogo y su pantalla. Ninguna
decisión de producto cerrada se reabrió.

| ID | Decisión | Madurez | Fuente / estado |
|---|---|---|---|
| D-S08-081 | La carrera completa es una edición propia —ruleset `1.0.0-full-career`, contenido `5.1.0-grade-5`, catálogo `grade-5-dev-2`— con `official: false`: compone los **nueve** beats del presupuesto, no los doce de la práctica parcial, y convive con los recorridos parciales sin reemplazarlos | ACCEPTED · implementación | `src/content/full-career.ts`; `tests/integration/full-career.test.ts` |
| D-S08-082 | La carrera usa **sólo** `template-freshness` como objetivo blando. Con la lista completa de objetivos los criterios lexicográficos producen un ganador único: 300 carreras usaban 12 de 28 Templates y las tres primeras runs eran el mismo contenido. Las restricciones duras ya llevan los pisos de variedad, así que sacar los objetivos no afloja ninguna cuota — y con el cambio aparecen las 28 | ACCEPTED · medida | medición de 300 carreras; `fullCareerCompositionPolicy` |
| D-S08-083 | Los cuatro eventos raros son contextuales, nunca por rendimiento: se sortean por seed sobre la carrera y respetan el presupuesto de 2 apariciones, 1 con efecto y 1 muy rara. Dos son `narrative-only` y dos `variant-modifier`, que sólo re-eligen otra variante aprobada del mismo Template | ACCEPTED · implementación | `src/content/rare-events.ts`; `tests/unit/rare-events.test.ts` |
| D-S08-084 | La edición declara un techo de Prestige **ofrecido de 0**. La maquinaria existe y el servidor la recomputa, pero autorar una oportunidad competitiva hoy exigiría inventar acciones de jugador que ninguna Template tiene, y eso es una decisión de producto que esta tarea no toma. El contrato canónico admite explícitamente una edición sin oportunidad competitiva | ACCEPTED · fail-closed | `careerPrestigeOpportunities`; [eventos raros y Prestige](../01-game-design/rare-events-and-prestige.md) |
| D-S08-085 | El epílogo se implementa con su pantalla, en el orden que fija el sistema narrativo: EGRESASTE primero, perfil autorado, recorrido, registro con `null ≠ 0`, hitos display-only y cierre de modo. `closeCareer` es puro y el servidor lo recompone desde el log | ACCEPTED · implementación | `src/components/game/career-epilogue.tsx`; `tests/e2e/full-career.spec.ts` |
| D-S08-086 | Los callbacks de carrera leen **sólo** flags grabados en el año de origen y devuelven texto vacío sin causa rastreable. Entran en el `setup`, así que la instancia matemática y la evaluación no cambian: recordar nunca modifica la cuenta | ACCEPTED · autoría | `src/content/career-facts.ts`; `tests/integration/career-callbacks.test.ts` |
| D-S08-087 | Estilo queda auditado a nivel carrera sin recalibrar nada: cada Template con estilo deja al menos dos ejes disponibles con la matemática óptima en **todas** sus variantes aprobadas, y jugar siempre óptimo produce estilos dominantes distintos según la seed. Las Templates de 7.º, anteriores al gate de autoría, atan algunos ejes a su nivel Math; se registra como asimetría conocida y no se toca | ACCEPTED · auditoría | `tests/integration/style-audit.test.ts` |
| D-S08-088 | Para que la carrera perfecta llegue a 10 000 se agregaron gates de autoría —que alguna respuesta óptima deje el Equipo máximo y que alguna postura llegue al máximo de Aura—, no se recalibró el score. Al cambiar la población aprobada, los catálogos se **republicaron** como `-dev-2`: un artefacto publicado no se edita en el lugar | ACCEPTED · autoría | `tests/integration/full-career.test.ts` |
| D-S08-089 | El detalle de una opción baja a su propio renglón cuando no entra, en vez de empujar la fila fuera de la pantalla: un detalle con prosa rompía el piso de reflow de 320 px en las tarjetas de decisión | ACCEPTED · hardening | `src/components/ui/choice-card.tsx`; `tests/e2e/full-career.spec.ts` |

## STAGE-08 / Pre-revisión de Matemática (2026-09-16)

Pre-revisión asistida por IA previa al gate humano. No aprueba nada y no
modificó contenido: su producto son hallazgos y un paquete de revisión.

| ID | Decisión | Madurez | Fuente / estado |
|---|---|---|---|
| D-S08-090 | La pre-revisión de Matemática es **review-first**: documenta hallazgos y propone correcciones precisas, pero **no toca** consignas, evaluadores, oráculos, niveles ni catálogos. El Departamento humano tiene que poder comparar implementación, pre-revisión y propuesta sobre el mismo objeto | ACCEPTED · método | [pre-revisión](../04-quality/mathematics-department-pre-review.md) |
| D-S08-091 | El marco curricular de contraste es el **nacional (NAP)**, no un diseño provincial: la guía de autoría pide lenguaje argentino neutral y el juego no se ata a una jurisdicción. Un mapeo provincial es posible como decisión institucional, no como requisito | ACCEPTED · alcance | NAP Matemática, Ciclo Básico; [guía de autoría](../01-game-design/content-authoring-guide.md) |
| D-S08-092 | El hallazgo principal no es aritmético sino de **validez de evaluación**: en `y3.transport-pass`, `g7.mural-paint` y `y5.stage-screen` una estrategia ciega rinde entre 75 y 78 sobre 100 sin hacer ninguna cuenta. Queda registrado como MAT-001, MAT-006 y MAT-008 y **no se corrige** en esta tarea | ACCEPTED · hallazgo | [registro de hallazgos](../04-quality/mathematics-department-pre-review.md#o-registro-de-hallazgos) |
| D-S08-093 | El techo de la escalera 100/75/40/10 no está garantizado por variante: `g7.mural-paint` no alcanza `efficient` en ninguna, `y4.represent-class` no alcanza `functional` en 13 de 25 y `g7.notebook-offer` es binaria. Se documenta; decidir si la escalera debe tener cuatro niveles siempre es una decisión de producto que este gate no toma | ACCEPTED · diferido | MAT-006, MAT-007, MAT-010 |
| D-S08-094 | La revisión del Departamento de Matemática **sigue `PENDING`** al terminar esta tarea, y la pre-revisión lo declara explícitamente. Ninguna firma humana se simuló | ACCEPTED · gate | [paquete de revisión humana](../04-quality/mathematics-department-human-review-packet.md) |

## STAGE-08 / Adjudicación de Matemática (2026-09-16)

Departamento de Matemática provisional asistido por IA: tres revisores
independientes y un Chair. Sólo documentación y gobernanza; no se tocó runtime,
contenido, catálogos ni tests.

| ID | Decisión | Madurez | Fuente / estado |
|---|---|---|---|
| D-S08-095 | **Decisión del Product Owner.** La revisión del Departamento de Matemática humano **no se elimina: se difiere a Final Delivery / Pre-Release Acceptance**. El gate matemático vigente es el **AI Mathematics Department**: Pre-Review → Independent Adjudication → Mathematics Remediation → Independent Re-Audit → **AI Mathematics Department Provisional Sign-Off**. Actualiza el estado `PENDING` de D-S08-094 a `DEFERRED` | PRODUCT OWNER DECISION · gate | [adjudicación](../04-quality/mathematics-department-ai-adjudication.md#c-gobernanza) |
| D-S08-096 | `AI provisional judgment != human final approval`. El sign-off provisional no pasa contenido a `math_reviewed`, no cumple los sign-offs manuales explícitos que exige la guía de autoría y no autoriza a afirmar que el Departamento humano aprobó algo. El sign-off manual de la rueda y el pacing empírico siguen como gates humanos de STAGE-08 | ACCEPTED · gate | [guía de autoría](../01-game-design/content-authoring-guide.md) |
| D-S08-097 | La adjudicación separa cuatro roles —Revisor A matemática, B didáctica, C validez de evaluación, y Chair— con aislamiento **lógico, no físico**: un solo agente, informes congelados en orden, sin usar conclusiones previas como premisa. El Chair no decide por mayoría | ACCEPTED · método | [A](../04-quality/mathematics-department-ai-reviewer-a.md), [B](../04-quality/mathematics-department-ai-reviewer-b.md), [C](../04-quality/mathematics-department-ai-reviewer-c.md) |
| D-S08-098 | Veredicto `ADJUDICATION COMPLETE — REMEDIATION REQUIRED`. Sobre MAT-001…013: 9 `REQUIRED_CORRECTION`, 1 `REQUIRED_CLARIFICATION` (MAT-011), 1 `ACCEPT_AS_DESIGNED` (MAT-010), 2 `ACCEPT_WITH_DOCUMENTED_RISK` (MAT-012, MAT-013), 0 diferidos, 0 bloqueados. Siete hallazgos nuevos `MAT-AJ-NEW-001…007`, todos `REQUIRED_CORRECTION`. La [especificación de remediación](../04-quality/mathematics-remediation-spec.md) es el contrato canónico de la siguiente tarea | ACCEPTED · provisional IA | [matriz de acuerdo](../04-quality/mathematics-department-ai-adjudication.md#h-matriz-de-acuerdo) |
| D-S08-099 | **Resuelve D-S08-093.** No se exige que cada Template tenga los cuatro niveles. Un nivel ausente se acepta cuando el espacio matemático no tiene ese estado —notebook binaria, mural sin `efficient`—; no se fabrica crédito parcial. Lo que sí se corrige es la abstención premiada (`y4.represent-class`) | ACCEPTED · provisional IA | MAT-006, MAT-007, MAT-010 |
| D-S08-100 | La estrategia ciega se mide con **R** (azar), **K** (mejor respuesta constante sobre el catálogo) y **S** (mayor proporción de variantes con la misma respuesta óptima). Es evidencia, no ley: los techos son por Template, justificados contra `y5.final-trip-or-event` y contra prototipos factibles, y quedan como test permanente | ACCEPTED · método | [especificación, sección 3](../04-quality/mathematics-remediation-spec.md#3-auditoría-permanente-de-estrategia-ciega-wp-audit) |
| D-S08-101 | En Fair v1 los reintentos repiten las mismas variantes por diseño `LOCKED`: la memorización dentro de una edición es posible en toda Template y no se corrige con catálogo. Lo corregible es el atajo transferible entre seeds. MAT-013 queda como riesgo documentado para la revisión humana final | ACCEPTED · riesgo documentado | MAT-013; [modo feria](../05-operations/fair-mode-and-competition-freeze.md) |
| D-S08-102 | Los gaps de probabilidad de sucesos y de representación explícita de funciones **no** comprometen los objetivos propios del juego —el año no es barrera curricular— y no se ordenan Templates nuevas. Riesgo documentado para uso institucional | ACCEPTED · riesgo documentado | MAT-012 |
| D-S08-103 | Correcciones al pre-review: existía feedback que afirma algo falso (MAT-AJ-NEW-002, 003); `y5.course-project-final` no es modelo a imitar (MAT-AJ-NEW-001); MAT-009 no es LOW; el argumento de error estándar de MAT-003 no aplica a respuesta voluntaria. El pre-review se conserva como registro ejecutado | ACCEPTED · registro | [adjudicación, sección R](../04-quality/mathematics-department-ai-adjudication.md#r-correcciones-al-pre-review) |

La integración de TG1 permanece histórica en [su acta y trazabilidad](../06-delivery/teacher-gate-1/12-integracion-post-gate.md).
Siguen pendientes la oficialización/freeze, validación empírica, autoría ejecutable,
catálogo concreto de logros, operación/auth/retención y el gate post-G1. Label,
trigger v1, multiobligación, seed común, tracks Prestige, puesto compartido y
saliencia ya no son aperturas de prediseño.
