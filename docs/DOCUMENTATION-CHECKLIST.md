# Checklist de completitud documental

## Producto
- [x] Visión y propuesta de valor.
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

## Calidad
- [x] Unit/integration/E2E.
- [x] Property tests.
- [x] Validación de contenido.
- [x] NFR.
- [x] Threat model.
- [x] Gates reales de la base, cobertura acotada y checks contextuales de DB/Docker.

## Operación
- [x] Runbook de feria.
- [x] Ranking/moderación.
- [x] Fallback/incidentes.

## Delivery
- [x] Backlog priorizado.
- [x] Definition of Done.
- [x] Convenciones de repo.
- [x] CI reproducible, Dependabot y bloqueo de release por dependencia.

## Referencia
- [x] Investigación y fuentes.
- [x] Glosario.
- [x] Decisiones.
- [x] Preguntas abiertas.
- [x] Ejemplo de schema de contenido; schema ejecutable diferido a P0.

## Ingeniería asistida
- [x] Instrucciones raíz y scoped para documentación.
- [x] Mapa de contexto y workflow de desarrollo.
- [x] Política de dependencias/decisiones y estrategia MCP.
- [x] Skills de proyecto acotadas y validables.
- [x] Checks de links, manifest y sincronización del master.
- [x] Entorno de desarrollo nativo/contenedorizado y operación local de Supabase.

## Bloqueo técnico temporal

- [x] Next.js `16.3.1` identificado como base exclusivamente local.
- [ ] Release público habilitado: requiere Next.js `>=16.3.2`, lockfile regenerado, `pnpm release:check` y `pnpm verify` verdes.

## Gaps intencionales que requieren evidencia del proyecto

No son omisiones documentales; son decisiones que no deben fijarse sin playtest o datos:
- duración exacta de run;
- fórmula final de scoring;
- distribución final de eventos por año;
- política final de dificultad/adaptación;
- cantidad esperada de concurrentes;
- política legal/retención aplicable a la institución anfitriona;
- diseño visual definitivo;
- proveedor final de analytics/error tracking.

Estas preguntas están registradas y deben cerrarse en la fuente autoritativa correspondiente cuando exista evidencia, actualizando trazabilidad y ADR cuando aplique.
