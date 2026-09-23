# Checklist de completitud documental

## Producto
- [x] Visión y propuesta de valor.
- [x] Ciclo de entrega real, gates docentes y ausencia de playtest previo a la feria.
- [x] Objetivos/no objetivos.
- [x] Personas y contextos.
- [x] Métricas de éxito.
- [x] Alcance y roadmap.
- [x] Riesgos y supuestos.

## Game design
- [x] Core/meta loop.
- [x] Reglas.
- [x] Scoring.
- [x] Progresión.
- [x] Narrativa/storylets.
- [x] Perfiles finales.
- [x] Taxonomía de desafíos.
- [x] Dificultad matemática.
- [x] Feedback y error.
- [x] Guía de autoría.
- [x] UX/interacciones.
- [x] Familias de escenario, plantillas y variantes deterministas.
- [x] Dificultad de piso bajo y techo alto, bandas y presupuesto.
- [x] Score competitivo post-TG1 85/10/5 como candidato no oficial, con historia dev-1 preservada.
- [x] Egreso garantizado **implementado** en STAGE-07: la recuperación converge por construcción y no puntúa ([ADR-024](03-architecture/adr/ADR-024-progression-recovery-and-graduation.md)); Repaso/INVALID cerrados como producto, debrief futuro.
- [x] Envolvente de producto de STAGE-08 / Phase 0 completa, sin confundir diseño con runtime.
- [x] Matriz de carrera v0.3 con 25 diseños candidatos aprobados, cobertura 6/13/6 y reemplazos históricos trazables.
- [x] Sistema narrativo de carrera reconciliado: consolidación en 1.º, elenco relacional, callbacks, Proyecto del Curso y epílogo.
- [x] Eventos raros y Prestige documentados con diseño v1 cerrado, calibración versionada y arquitectura futura en ADR-025.
- [x] Cinco pases de 1.º–5.º completos: 25 Templates `DESIGN-CANDIDATE-APPROVED`.
- [x] Políticas de clusters, arco recurrente, máximo 2 locked del Proyecto y diversidad cognitiva soft.
- [x] Callback Independence, Responsibility Externality, Career Convergence y dirección de Narrative Salience.
- [x] Nueve rutas futuras de recuperación, manteniendo un único gate de escalabilidad posterior a 1.º.

## Funcional
- [x] Requisitos funcionales.
- [x] Flujos.
- [x] Historias + aceptación.
- [x] Trazabilidad.

## Arquitectura
- [x] Context/container architecture.
- [x] Game engine.
- [x] RNG/replay/versionado.
- [x] Modelo de datos.
- [x] API.
- [x] Seguridad/privacidad.
- [x] Analytics/observabilidad.
- [x] Ambientes/deploy.
- [x] ADRs.
- [x] Fronteras del monolito modular y dirección de dependencias ejecutable.
- [x] Toolchain reproducible con gate de consistencia e imagen standalone sin cambiar la topología Vercel.
- [x] Arquitectura objetivo del motor con el estado real de cada capacidad.
- [x] Modelo de contenido: familia de escenario, plantilla y variante, con catálogo separado del plan de la run.
- [x] Pipeline de variantes: generación por restricción, validación con oráculos independientes, huella, deduplicación, auditoría y catálogo aprobado versionado.
- [x] Identidad de participante y privacidad de menores en competencia (ADR-026): qué se pide, qué es público, por qué el documento se deriva y no se guarda, y qué implica rotar el secreto.
- [x] Esquema de competencia implementado, con las restricciones de la base que hacen el trabajo de una transacción.
- [x] Contrato HTTP vigente de participante y organizador, separado del antecedente histórico no normativo.

## Calidad
- [x] Unit/integration/E2E.
- [x] Property tests.
- [x] Validación de contenido.
- [x] NFR.
- [x] Threat model.
- [x] Gates reales de la base, cobertura acotada y checks contextuales de DB/Docker.
- [x] Invariantes y auditoría estadística de variantes desplegadas.
- [x] Auditoría de equidad competitiva.
- [x] Contrato de auditoría de escalabilidad posterior a 1.º, marcado requerido y todavía no ejecutado.
- [x] Full-Career Product Audit integrado y conformidad técnica PASS con deltas entendidos, sin confundirlos con validación empírica.
- [x] Departamento de Matemática provisional (IA): pre-revisión, adjudicación independiente con tres revisores y Chair, y especificación de remediación; revisión humana diferida a la entrega final, sin presentarla como hecha.
- [x] Implementación de la remediación matemática documentada con veredicto `BLOCKED`, evidencia por contrato, inventario de feedback y los dos STOP como puntos de decisión abiertos, sin presentar re-auditoría ni sign-off como hechos.
- [x] Adjudicación de los conflictos de contrato: qué enmienda se probó factible, cuál no, y qué decisión queda abierta, sin relajar ningún techo en silencio.
- [x] Techo de estrategia ciega de la pantalla del acto: el mínimo factible, probado y alcanzado, con la remediación matemática cerrada en catorce contratos.
- [x] Matriz de ataque de la competencia, con el resultado caso por caso y la propiedad común: el servidor falla cerrado y el ranking nunca queda contaminado.
- [x] Amenazas de privacidad del dato de un menor, suplantación en el reingreso y purga prematura, con sus mitigaciones y lo que queda declarado como parcial.
- [x] Estrategia de tests de competencia: contrato de persistencia contra dos implementaciones, carreras jugadas y no inventadas, y qué se saltea cuando no hay base.

## Operación
- [x] Runbook de feria.
- [x] Modo feria, política de intentos, congelamiento y control de cambios.
- [x] Ranking/moderación.
- [x] Fallback/incidentes.
- [x] Operación de la competencia implementada: bootstrap, apertura y cierre, verificación de un ganador y purga, con el orden en que se usan y la advertencia de no purgar antes de entregar premios.

## Delivery
- [x] Backlog priorizado.
- [x] Definition of Done.
- [x] Convenciones de repo.
- [x] CI reproducible, Dependabot y bloqueo de release por dependencia.
- [x] Roadmap canónico con contrato por etapa: estado, alcance IN/OUT, dependencias, criterios de aceptación, validación, evidencia y exit gate.
- [x] Vista corta de la etapa activa, siempre en contexto.
- [x] Phase 0, Phase 1 y gate post-G1 cerrados; 2.º–5.º habilitados como siguiente tarea.
- [x] Protocolo de actualización del roadmap para agentes futuros.
- [x] Checklists de Teacher Gate 1 y 2 y de congelamiento de fundaciones.
- [x] Cierre de STAGE-09: producto público unificado, decisiones de identificación y privacidad, modelo de datos, autoridad del servidor, ranking, herramienta del organizador, matriz de ataque, escala medida y riesgos reales.

## Referencia
- [x] Investigación y fuentes.
- [x] Glosario.
- [x] Decisiones.
- [x] Preguntas abiertas.
- [x] Ejemplo de schema de contenido; schema ejecutable diferido a P0.
- [x] Fórmulas y algoritmos, etiquetados como normativos, candidatos o ilustrativos.
- [x] Ejemplos de contrato de run, score, evento y autoría, marcados como documentación.
- [x] Integración, procedencia y trazabilidad del Project Blueprint v0.2.
- [x] Product Audit: 30 hallazgos, ocho supersesiones, inventario/hashes de insumos y fuentes únicas.
- [x] ADR-025 registra deltas futuros sin cambios ejecutables.

## Ingeniería asistida
- [x] Instrucciones raíz y scoped para documentación.
- [x] Mapa de contexto y workflow de desarrollo.
- [x] Política de dependencias/decisiones y estrategia MCP.
- [x] Skills de proyecto acotadas y validables.
- [x] Checks de links, manifest y sincronización del master.
- [x] Entorno de desarrollo nativo/contenedorizado y operación local de Supabase.

## Sistema de diseño
- [x] Tokens primitivos y semánticos.
- [x] Tipografía y tratamiento de datos numéricos.
- [x] Espaciado, layout, radio, elevación, movimiento y foco.
- [x] Primitivas de UI documentadas.
- [x] Primitivas de juego e interacciones documentadas.
- [x] Reglas de accesibilidad y su automatización.
- [x] Reglas de crecimiento del sistema.
- [x] Migración del slice de 7.º grado.
- [ ] Tema oscuro (diferido a una versión posterior).

## Bloqueo técnico temporal

- [x] Next.js `16.3.1` identificado como base exclusivamente local.
- [ ] Release público habilitado: requiere Next.js `>=16.3.2`, lockfile regenerado, `pnpm release:check` y `pnpm verify` verdes.

## Gaps intencionales que requieren evidencia del proyecto

No son omisiones documentales; son decisiones que no deben fijarse sin evidencia, y varias sólo las puede cerrar el Departamento de Matemática. El playtest con estudiantes **no está garantizado antes de la feria**; ver [ciclo de entrega real](00-product/real-delivery-lifecycle.md):
- calibración empírica del target de run 8–10 minutos;
- fórmula final de scoring;
- validación real de composición bajo cuotas v1;
- implementación conjunta de 7.º + 25 diseños futuros y validación real de su pacing;
- política final de dificultad/adaptación;
- cantidad esperada de concurrentes;
- política legal/retención aplicable a la institución anfitriona;
- validación de accesibilidad de los modos futuros, sin rediseñar la identidad;
- proveedor final de analytics/error tracking.

Se agregan, desde la integración del Project Blueprint v0.2:
- oficialización/freeze de los coeficientes y topes del score competitivo;
- operación de premios compartidos y catálogo autorado de Hitos;
- factores exactos de recompensa por dificultad;
- qué desafíos ofrecen fórmula o calculadora;
- materializaciones aprobadas concretas y revisión de los diseños conservados;
- implementación y validación del Repaso/debrief ante dos obligaciones en el audit post-G1;
- calibración empírica de rareza; no queda un tercer criterio de empate abierto;
- catálogo exacto de Career Milestones y posible Aura rara de 1.º;
- implementación de Narrative Salience y epílogo bajo el contrato cerrado;
- acento visual por año y producción del pack raster, ambos diferidos al sistema de diseño.

Estas preguntas están registradas en [preguntas abiertas](07-reference/open-questions.md) y deben cerrarse en la fuente autoritativa correspondiente cuando exista evidencia o decisión docente, actualizando el [registro de decisiones](07-reference/decision-register.md), la trazabilidad y el ADR cuando aplique.

- [x] Ronda 2: implementación, matriz 42/42 y verificación completa en [el reporte](04-quality/targeted-post-reaudit-mathematics-remediation.md); re-audit independiente separado.
- [x] Re-auditoría independiente de ronda 2: los cinco contratos verificados desde afuera y el veredicto `FAILED` con sus tres bloqueantes, en [la re-auditoría de ronda 2](04-quality/independent-mathematics-reaudit-round-2.md).
- [x] Sprint de cierre matemático de STAGE-08: la familia finita de ocho atajos de baja complejidad, el rediseño de `y3.course-project-tech` y de `y4.course-project-fundraiser`, los tres atajos cerrados dentro del sprint y la matriz final de exposición, en [el informe de cierre](04-quality/stage-08-mathematics-final-closure-sprint.md); la auditoría final de cierre queda pendiente.

## Release Candidate v1

- [x] ADR-027 y registro de decisiones: gobernanza v1 y revisión humana amplia no bloqueante.
- [x] Manifiesto y candado verificables con `pnpm release:verify`.
- [x] [Reporte del RC](06-delivery/production-v1-release-candidate.md), [checklist](06-delivery/release-checklist.md) y [runbook operativo](05-operations/fair-operations-runbook.md).
- [x] STAGE-10 conserva los ensayos remotos y GO/NO-GO.


## STAGE-10A — preparación Vercel Hobby + Supabase Free

- [x] [ADR-028](03-architecture/adr/ADR-028-zero-cost-fair-deployment.md) y registro: regiones, Git, secretos y ensayo local.
- [x] [Handoff A–I](05-operations/vercel-supabase-production-deployment.md), plantilla pública y operación sin tercer proyecto remoto.
- [x] [Reporte de adaptación](06-delivery/stage-10a-deployment-adaptation.md), con procedencia RC.1 y evidencia RC.2 separadas.
- [x] Etapa actual, roadmap, arquitectura, runbooks e índices reconciliados; GO remoto pendiente.

## Práctica pública RC3

- [x] FR-021 y trazabilidad de `/test`, reanudación y resultado no competitivo.
- [x] [ADR-029](03-architecture/adr/ADR-029-public-practice-mode.md), API, frontera de persistencia y amenazas.
- [x] [Handoff y verificación](../.tmp/rc3-branding/practice-mode/README.md).
