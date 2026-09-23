# Egresado — Paquete documental del producto

Este directorio define la referencia funcional, lúdica, pedagógica y técnica de **Egresado**, un videojuego web de decisiones y desafíos matemáticos contextualizados en la vida escolar. La documentación está pensada para vivir junto al código y guiar diseño, desarrollo, QA, contenido, despliegue y operación en feria.

## Principios que gobiernan el proyecto

1. **La matemática es gameplay.** Los números y relaciones deben afectar decisiones; no se agregan ejercicios desconectados como “peaje educativo”.
2. **La secundaria es la narrativa.** El jugador recorre desde 7.º grado hasta 5.º año y construye una historia personal de egreso.
3. **Consecuencias antes que “correcto/incorrecto”.** El feedback explica qué ocurrió y por qué.
4. **Partidas cortas y repetibles.** TG1-12 fijó un objetivo UX de aproximadamente 8–10 minutos para la carrera completa; no es timeout ni señal de score.
5. **Mobile-first y browser-first.** Debe funcionar sin instalación en teléfono, tablet y desktop.
6. **Motor determinista y desacoplado de UI.** La lógica del juego debe poder reproducirse por `seed` y ejecutarse en cliente, servidor y tests.
7. **Contenido como datos.** Nuevos desafíos no deben requerir nuevos componentes salvo que introduzcan una interacción nueva.
8. **Ranking autoritativo en servidor.** El navegador no define el score oficial.
9. **Privacidad por minimización.** El MVP no requiere email, contraseña, apellido ni fecha de nacimiento.
10. **Escalar por evidencia.** Primero se valida diversión, comprensión y duración; luego se agrega complejidad.

## Por dónde empezar

Un ingeniero o un agente que llega por primera vez lee en este orden y se detiene cuando ya tiene lo que su tarea necesita.

1. `AGENTS.md` en la raíz — reglas del repositorio e invariantes no negociables.
2. Este README — mapa y autoridad documental.
3. [mapa de contexto](08-engineering/context-map.md) — qué fuentes leer para **esta** tarea.
4. [registro de decisiones](07-reference/decision-register.md) — qué está cerrado, qué es recomendación y qué requiere aprobación docente.
5. [visión de producto](00-product/product-vision.md) y [ciclo de entrega real](00-product/real-delivery-lifecycle.md) — qué es el juego y cómo se entrega de verdad.
6. [vertical slice de 7.º](06-delivery/vertical-slice-grade-7.md) — el alcance de la demo candidata.
7. [GDD](01-game-design/game-design-document.md) — core loop y modelo de carrera.
8. [familias y variantes](01-game-design/challenge-families-and-variants.md) y [dificultad](01-game-design/difficulty-and-playability.md) — por qué el contenido se repite sin memorizarse.
9. [envolvente de STAGE-08](01-game-design/stage-08-product-design-envelope.md) y [matriz de carrera](01-game-design/full-career-content-matrix.md) — dirección de Phase 0 e inventario candidato vigente.
10. [score competitivo y ranking](01-game-design/competitive-scoring-and-ranking.md) — la dirección de la competencia de feria.
11. [game engine](03-architecture/game-engine.md) — el motor que existe.
12. [arquitectura objetivo del motor](03-architecture/target-engine-architecture.md) — lo que falta y en qué estado está.
13. [sistema de diseño](09-design-system/README.md) — la autoridad visual.
14. [testing](04-quality/testing-strategy.md) y [modo feria y congelamiento](05-operations/fair-mode-and-competition-freeze.md) — calidad y operación.
15. [preguntas abiertas](07-reference/open-questions.md) — lo que **no** se decide desde el código.
16. [etapa actual](06-delivery/current-stage.md) — dónde estamos y qué se puede implementar ahora.
17. [roadmap de implementación](06-delivery/implementation-sequence.md) — el contrato completo de cada etapa.

## Mapa documental

### 00-product
- `product-vision.md`: visión, problema, propuesta de valor y objetivos.
- `real-delivery-lifecycle.md`: fases reales de entrega, gates docentes y la ausencia de playtest previo a la feria.
- `scope-and-roadmap.md`: alcance MVP, versiones y límites.
- `personas-and-contexts.md`: jugadores, docentes, organizadores y contexto de feria.
- `risks-and-assumptions.md`: supuestos, riesgos y mitigaciones.
- `success-metrics.md`: métricas de producto, aprendizaje y operación.

### 01-game-design
- `game-design-document.md`: GDD principal.
- `challenge-families-and-variants.md`: familias de escenario, plantillas y variantes deterministas.
- `competitive-scoring-and-ranking.md`: dirección propuesta del score competitivo y del ranking de feria.
- `difficulty-and-playability.md`: piso bajo y techo alto, bandas y presupuesto de dificultad.
- `stage-08-product-design-envelope.md`: decisiones de producto y frontera de Phase 0 para la carrera completa.
- `full-career-content-matrix.md`: matriz v0.3 de 25 diseños aprobados candidatos, cobertura y políticas de composición para 1.º–5.º.
- `grade-1-template-design.md`: diseño detallado candidato de las cinco Templates de consolidación de 1.º.
- `grade-2-template-design.md`: cinco diseños aprobados de pertenencia, cluster Intercurso y ruta de encuesta.
- `grade-3-template-design.md`: cinco diseños aprobados de autonomía, Estilo, recursos y movilidad.
- `grade-4-template-design.md`: cinco diseños aprobados de responsabilidad, cluster School Event y reemplazo raro.
- `grade-5-template-design.md`: cinco diseños aprobados de cierre/futuro, cluster Egreso y convergencia.
- `rare-events-and-prestige.md`: semántica aceptada, calibración candidata y guardrails de eventos raros/Prestige.
- `graduation-and-fail-forward.md`: egreso, recuperación y por qué el error no expulsa al jugador.
- `rules-scoring-and-progression.md`: reglas, estados, scoring y progresión.
- `narrative-system.md`: carrera escolar, storylets, eventos y perfiles finales.
- `challenge-system.md`: taxonomía de minijuegos y desafíos matemáticos.
- `challenge-catalog.md`: backlog semilla de escenarios, no compromiso de alcance.
- `math-design-framework.md`: marco matemático por edad, dificultad y validación.
- `content-authoring-guide.md`: cómo escribir, parametrizar y revisar contenido.
- `ux-interaction-design.md`: patrones de interacción, feedback y responsive.

### 02-functional
- `functional-specification.md`: requisitos funcionales del producto.
- `user-flows.md`: flujos principales y alternativos.
- `user-stories.md`: historias de usuario con criterios de aceptación.
- `traceability-matrix.md`: trazabilidad entre objetivos, features y requisitos.

### 03-architecture
- `architecture-overview.md`: arquitectura lógica y física.
- `game-engine.md`: diseño del motor determinista.
- `content-model-migration.md`: cómo el contenido se mueve al modelo de familia, plantilla y variante, y la matriz de sondas.
- `target-engine-architecture.md`: capacidades objetivo del motor y estado real de cada una.
- `data-model.md`: modelo de datos inicial y evolución.
- `api-contracts.md`: contratos HTTP del MVP online.
- `security-privacy.md`: seguridad, privacidad y anti-cheat.
- `analytics-observability.md`: eventos, métricas y observabilidad.
- `deployment-and-environments.md`: ambientes, CI/CD y despliegue.
- `adr/`: decisiones arquitectónicas formales; [ADR-025](03-architecture/adr/ADR-025-full-career-contract-evolution.md) gobierna contratos futuros de carrera completa y [ADR-026](03-architecture/adr/ADR-026-participant-identity-and-minor-privacy.md) la identidad de participante y la privacidad de menores en competencia; [ADR-027](03-architecture/adr/ADR-027-release-freeze-and-v1-governance.md) gobierna el release y los gates de v1; [ADR-028](03-architecture/adr/ADR-028-zero-cost-fair-deployment.md) fija la topología gratuita y el ensayo local de la feria.

### 04-quality
- `ai-mathematics-department-provisional-signoff.md`: el gate que cierra la fase del Departamento de Matemática de IA: la cadena de evidencia completa, el endurecimiento acotado de la instrumentación —identidad semántica de magnitudes y profundidad de cobertura declarada— y las banderas que quedan para la revisión humana.
- `content-validation.md`: pipeline de schema, matemática, generación, UI y playtest.
- `final-mathematics-closure-audit.md`: la auditoría final de sólo lectura del cierre matemático, con la re-derivación independiente de las ocho familias congeladas, la adjudicación de la peña y de los datos móviles, y los dos defectos del instrumento que el producto sobrevive.
- `competition-fairness-audit.md`: preguntas de equidad que un ranking con premios debe poder contestar.
- `post-reaudit-mathematics-findings-adjudication.md`: adjudicación de los diez hallazgos de la re-auditoría, con la causa raíz real de los dos atajos constantes, los estudios de factibilidad que fijan sus techos y el erratum contractual 13/14.
- `targeted-post-reaudit-mathematics-remediation.md`: implementación y evidencia de la ronda 2; siguiente gate independiente separado.
- `post-reaudit-mathematics-remediation-spec.md`: contrato ejecutable de la ronda 2, con la auditoría permanente por capacidad primero y los cuatro contratos P0.
- `post-teacher-gate-1-score-audit.md`: barrida reproducible de `fair-score-dev-2` sobre 23.000 planes y comparación histórica.
- `full-career-technical-conformance.md`: reporte técnico read-only de Phase 0, evidencia y deltas futuros.
- `post-grade-1-scalability-audit.md`: contrato obligatorio para dos obligaciones conceptuales bajo un recovery máximo después de implementar 1.º.
- `full-career-implementation-audit.md`: auditoría de la carrera real 7.º → 5.º con su veredicto único, hallazgos y lo que no afirma.
- `mathematics-department-pre-review.md`: pre-revisión matemática y didáctica asistida por IA, con registro de hallazgos y bibliografía; no reemplaza al gate humano.
- `mathematics-department-human-review-packet.md`: paquete operativo para que el Departamento de Matemática revise el juego sin leer código; la revisión humana está diferida a la entrega final.
- `mathematics-department-ai-reviewer-a.md`: opinión independiente y congelada del Revisor A del Departamento de Matemática provisional, sobre matemática y corrección formal.
- `mathematics-department-ai-reviewer-b.md`: opinión independiente y congelada del Revisor B, sobre didáctica, secundaria y currículo.
- `mathematics-department-ai-reviewer-c.md`: opinión independiente y congelada del Revisor C, sobre validez de evaluación y diseño de juegos educativos.
- `mathematics-department-ai-adjudication.md`: adjudicación del Chair sobre MAT-001…MAT-013 y los hallazgos nuevos, con gobernanza, evidencia y banderas para la revisión humana final.
- `mathematics-remediation-spec.md`: contrato canónico de la remediación matemática, con criterios de aceptación, tests, mediciones y superficie de versión por hallazgo.
- `independent-mathematics-reaudit.md`: re-auditoría matemática independiente de la remediación completa, con la re-derivación del techo de la pantalla del acto, la tabla R/K/S propia y los diez hallazgos nuevos.
- `independent-mathematics-reaudit-round-2.md`: re-auditoría independiente de la ronda 2, con los cinco contratos verificados desde afuera y las estrategias de reemplazo que hacen fallar el gate igual.
- `stage-08-mathematics-final-closure-sprint.md`: el sprint que cierra la clase entera de atajos de baja complejidad —ocho familias finitas sobre las 42 Templates—, con el rediseño de la feria de tecnología y de la peña, los tres atajos que la auditoría ampliada hizo visibles y la matriz final de exposición.
- `rs-mat-008-blind-ceiling-final-adjudication.md`: prueba del menor techo de estrategia ciega factible para la pantalla del acto, con el catálogo testigo que lo alcanza y la enmienda que cierra la remediación.
- `mathematics-remediation-contract-conflict-adjudication.md`: adjudicación de los dos conflictos internos del contrato de remediación, con el prototipo que mide la factibilidad, la enmienda del criterio 3 y el punto de decisión que sigue abierto.
- `mathematics-remediation-implementation.md`: implementación de la remediación matemática, con veredicto `BLOCKED`, evidencia por contrato, estrategia ciega antes y después, versiones y los dos STOP con su punto de decisión.
- `mathematics-remediation-feedback-inventory.md`: inventario de los textos fijos de feedback que afirman una comparación, una dirección o una causa, probados o calculados, con las correcciones.
- `variant-validation-and-audit.md`: invariantes de variante, auditoría estadística del catálogo y auditoría de estrategia ciega.
- `testing-strategy.md`: unit, property-based, integration, E2E y pruebas de contenido.
- `non-functional-requirements.md`: performance, resiliencia, accesibilidad y compatibilidad.
- `threat-model.md`: amenazas y mitigaciones.

### 05-operations
- `vercel-supabase-production-deployment.md`: handoff manual para Feria del Libro 2026, Vercel Hobby y Supabase Free.
- `fair-operations-runbook.md`: operación del RC v1, respaldo, restauración y rollback; ensayos remotos en STAGE-10.
- `fair-runbook.md`: operación durante la feria.
- `fair-mode-and-competition-freeze.md`: intentos, congelamiento de versiones, control de cambios, cierre y privacidad.
- `leaderboard-and-moderation.md`: rankings, nicknames y moderación.
- `fallback-and-incident-plan.md`: funcionamiento degradado y recuperación.

### 06-delivery
- `stage-10a-deployment-adaptation.md`: adaptación del deploy y evidencia local de RC.2, sin deploy ni GO.
- `production-v1-release-candidate.md`: identidad congelada, contratos y evidencia del RC v1.
- `release-checklist.md`: checklist local y ensayos pendientes de STAGE-10.
- `mvp-backlog.md`: backlog priorizado.
- `implementation-sequence.md`: roadmap canónico — etapas, estado, alcance, dependencias, gates y criterios de aceptación.
- `current-stage.md`: vista corta de la etapa activa, su alcance y qué no implementar todavía.
- `teacher-gates.md`: qué decide el Departamento de Matemática en cada gate.
- `teacher-gate-1/`: pack histórico, evidencia docente original, acta y trazabilidad de integración del Teacher Gate 1 ejecutado.
- `definition-of-done.md`: DoD global y por tipo de cambio.
- `stage-08-final-integration-pacing-closure.md`: el cierre de STAGE-08 como producto integrado —carrera completa, reanudación, idempotencia, motores, accesibilidad y build de producción— y la primera medición del ritmo de la carrera, con sus supuestos y su límite.
- `stage-09-fair-mode-server-ranking.md`: el cierre de STAGE-09 —producto público unificado, identificación con privacidad por diseño, emisión e idempotencia del servidor, verificación por replay, ranking por mejor intento, herramienta del organizador, matriz de ataque y escala medida.
- `repository-conventions.md`: estructura implementada, fronteras, comandos y reglas de dependencia.
- `vertical-slice-grade-7.md`: alcance, contenido y criterios del primer slice jugable (7.º grado).

### 07-reference
- `research-basis.md`: teoría, referencias y decisiones derivadas.
- `full-career-product-audit-integration.md`: procedencia, FC-001–030, supersesiones y cierre de Phase 0.
- `blueprint-v0.2-integration.md`: qué entró del Project Blueprint v0.2, dónde quedó y qué conflictos hubo.
- `formulas-and-algorithms.md`: fórmulas normativas, candidatas e ilustrativas, etiquetadas.
- `glossary.md`: vocabulario oficial.
- `open-questions.md`: preguntas abiertas antes de producción.
- `decision-register.md`: índice de decisiones y ADRs.
- `content-schema.example.json`: ejemplo de definición de desafío.
- `challenge-authoring.example.yaml`: ficha de autoría de una plantilla antes de que exista código.
- `event-config.example.json`: objetivo futuro de configuración de un evento de feria; no es contrato de runtime actual.
- `event-effects.example.json`: ejemplo de efectos de evento: carrera, ocultos y competencia por separado.
- `run-descriptor.example.json`: ejemplo del `RunDescriptor` implementado para una run competitiva de desarrollo.
- `score-breakdown.example.json`: ejemplo actual del claim serializable de `FairScore`.
- `score-policy.example.json`: política candidata implementada, marcada `official: false` y pendiente de gate docente.

### 08-engineering
- `context-map.md`: qué fuentes leer para cada tipo de tarea.
- `ai-development-workflow.md`: ciclo de trabajo asistido, evidencia y criterio de ADR.
- `dependency-and-decision-policy.md`: selección de dependencias y clasificación de decisiones.
- `mcp-strategy.md`: integraciones justificadas, trust y diferimientos.
- `agent-setup.md`: arquitectura del workspace, discovery, skills y fuentes oficiales.
- `development-environment.md`: quickstart nativo/Docker, Supabase local, gates y troubleshooting.
- `game-engine-development.md`: comandos, harness, invariantes y cómo extender el motor.

### 09-design-system
- `README.md`: qué es el sistema de diseño, su versión y por dónde entrar.
- `decision-history.md`: por qué Egresado se ve así y qué decisiones no se reabren.
- `colors.md`: los cuatro colores con cuatro trabajos y las tres superficies.
- `typography.md`: las dos familias, los roles y cómo se escriben los números en es-AR.
- `foundations.md`: cuadrícula, geometría, la marca de corrección, layout y movimiento.
- `ui-components.md`: primitivas de UI, cuándo usarlas y cuándo no.
- `game-components.md`: primitivas de juego y renderers de interacción.
- `accessibility.md`: cómo el sistema sostiene el objetivo WCAG 2.2 AA.
- `contribution.md`: cuándo promover un patrón y cómo se hace cumplir.
- `migration-7-grade.md`: qué cambió al migrar el slice a v0.2, y qué no.
- `assets.md`: qué arte existe, qué está briefeado sin producir y qué es texto a propósito.
- `reference/`: capturas de referencia visual — apertura, una situación sin resolver y resuelta, una académica en Óptimo, la grilla del acto y el cierre de etapa.

### audits

Auditorías de ingeniería ejecutadas sobre el código real. Documentan hallazgos con evidencia, el plan de remediación y su verificación; no reemplazan a la documentación canónica, que describe el estado actual.

- `game-engine-2026-08-21/`: auditoría completa del motor y sus fronteras de integración.

### sources

Paquetes documentales recibidos desde afuera, congelados **tal como llegaron**. No son documentación canónica: son el insumo verificable del que salió la canónica. No se editan. Ver [su README](sources/README.md).

- `egresado-project-blueprint-v0.2.0/`: Project Blueprint & Technical Handoff v0.2.0, integrado el 28 de agosto de 2026. Qué entró y dónde quedó está en [la integración del blueprint](07-reference/blueprint-v0.2-integration.md).

`EGRESADO-MASTER-SPEC.md` consolida la baseline de producto (`00-` a `07-`, checklist y este README). La infraestructura de ingeniería de `08-engineering/` y el sistema de diseño de `09-design-system/` se mantienen por separado: describen cómo se construye el producto, no qué es.

## Autoridad documental

En caso de contradicción:

1. ADR aceptado para decisiones técnicas.
2. `functional-specification.md` para comportamiento visible del producto.
3. `game-design-document.md` y documentos de reglas para comportamiento lúdico.
4. `math-design-framework.md` para intención pedagógica y dificultad.
5. Backlog e historias de usuario para orden de implementación.

Los documentos especializados gobiernan su área mientras no contradigan una fuente de mayor autoridad. Si dos documentos del mismo nivel siguen en conflicto o la lista no define precedencia entre ellos, la discrepancia se mantiene explícita en `07-reference/open-questions.md` hasta que exista evidencia o una decisión autorizada.

### Autoridad por dominio

La lista de arriba resuelve precedencia entre documentos. Esta tabla dice, para cada dominio, **qué artefacto manda**. Está fijada por [ADR-018](03-architecture/adr/ADR-018-blueprint-v0-2-decision-authority.md).

| Dominio | Autoridad |
|---|---|
| Comportamiento de juego, matemática, transiciones | estos documentos + el motor + los tests |
| Identidad visual, tokens, presentación de Game UI | [sistema de diseño](09-design-system/README.md) y el handoff de Claude Design v0.2 |
| Decisiones de producto y su madurez | [registro de decisiones](07-reference/decision-register.md) |
| Estado real actual | el código |
| Configuración oficial de la competencia | configuración de evento versionada, después de la aprobación docente |

Cuatro reglas de conflicto: una captura de pantalla no cambia una regla matemática; un estilo heredado del frontend no supera el handoff de diseño aprobado; documentación vieja no supera una decisión más nueva sin dejar el conflicto escrito; y una regla marcada `TEACHER GATE` u `OPEN` se implementa detrás de política versionada, nunca como supuesto irreversible.

### Madurez de una decisión

Una decisión integrada declara su nivel, y **el nivel es parte de la decisión**: `LOCKED`, `PRODUCT DIRECTION`, `RECOMENDADA`, `TEACHER GATE`, `OPEN` o `DEFERRED`. La tabla que los define está en el [registro de decisiones](07-reference/decision-register.md). Aplanar una recomendación a requisito es un error de documentación, no una simplificación.

### Presente y objetivo

Un documento no describe en presente una capacidad que no existe. Lo implementado vive en los documentos de arquitectura actuales; lo que falta, en [arquitectura objetivo del motor](03-architecture/target-engine-architecture.md), con el estado real de cada capacidad.

Los documentos describen la **baseline de código post-Teacher-Gate-1** al 4 de
septiembre de 2026, el **cierre documental de STAGE-08 / Phase 0** al 10 de
septiembre, tras Product Audit y conformidad técnica con deltas entendidos, y el
**cierre de STAGE-08 / Phase 1** al 11 de septiembre. Lo implementado incluye el shell Next.js, toolchain reproducible,
fronteras de módulos, Supabase opcional, Docker, gates de calidad, motor
determinista con replay/snapshots, `Promedio · Equipo · Aura · Estilo`, slice de
7.º, composición por presupuesto, egreso garantizado con recuperación fail-forward,
`FairScore` candidato con recomputación server-only y 1.º real —cinco Templates y
dos Repasos— como práctica de desarrollo `7.º → 1.º`. `fair-score-dev-2` es
teacher-informed pero no oficial. La envolvente, matriz v0.3, narrativa de carrera,
eventos raros/Prestige y las 20 Templates de 2.º–5.º son **diseño**, no runtime.
Phase 0 y Phase 1 están `DONE` y el **audit post-G1** se ejecutó el 14 de
septiembre de 2026 con `PASS WITH REQUIRED HARDENING — RESOLVED`; sigue
implementar 2.º–5.º, y STAGE-08 no terminó. Todavía no existen los años
2.º–5.º, la carrera oficial, callbacks multianuales, Prestige, Auth, schema de
producto, endpoints/sesión/persistencia de competencia, ranking ni despliegue
público.

Las versiones exactas están fijadas en `package.json` y `pnpm-lock.yaml` bajo [ADR-010](03-architecture/adr/ADR-010-reproducible-node-pnpm-container-toolchain.md). Next.js `16.3.1` se conserva sólo como base local transitoria: `pnpm release:check` bloquea cualquier release público hasta actualizar a `>=16.3.2`, regenerar el lockfile y verificar el cambio completo.

## Práctica pública RC3

[ADR-029](03-architecture/adr/ADR-029-public-practice-mode.md) define `/test`, su API anónima y la separación respecto de participantes, intentos y ranking. Comportamiento en FR-021 de la [especificación funcional](02-functional/functional-specification.md); evidencia en el [handoff de práctica](../.tmp/rc3-branding/practice-mode/README.md).

## Privacidad UX RC3

[ADR-030](03-architecture/adr/ADR-030-privacy-page-and-action-acknowledgement.md) centraliza el aviso v1 en `/privacidad` y vincula la aceptación al CTA del formulario. Comportamiento en FR-001, evidencia en `tests/e2e/privacy.spec.ts` y `tests/e2e/competition.spec.ts`.
