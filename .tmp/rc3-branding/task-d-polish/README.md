# Egresado RC3 — TASK-D · Polish transversal + QA visual/técnica

Implementación sobre `main` / `70759f8` (TASK-C, 2026-09-23). Runtime sigue
en `1.0.0-rc.2`; RC3 no se corta. Estado y evidencia en
[verification.md](verification.md).

| Campo | Valor |
|---|---|
| Scope | B21 responsive · B22 accesibilidad · B23 metadata parcial · RC3-X1 empty states · RC3-X2 estado de competencia · RC3-X3 mejor marca personal · RC3-X4 motion · consistencia DS · performance · personalización con alias · QA integral |
| Motor / matemática / ScorePolicy / ranking / RunPlan / recovery / DB / privacidad / seguridad | **UNCHANGED** |
| Dependencias nuevas | NINGUNA (motion en CSS con los keyframes existentes) |
| Migraciones / env / APIs | NINGUNA |
| Persistencia nueva | NINGUNA (el alias se lee de la sesión que ya existía) |

## Archivos

| Archivo | Contenido |
|---|---|
| [surface-matrix.md](surface-matrix.md) | Superficies × estados × viewports con overflow, primarios, consola y red |
| [responsive-review.md](responsive-review.md) | Comportamiento por ancho y zoom; qué se corrigió |
| [accessibility-review.md](accessibility-review.md) | Teclado, foco, encabezados, landmarks, reloj, color, reduced motion, imágenes, alias |
| [performance-review.md](performance-review.md) | LCP/CLS medidos, islas cliente, imágenes, bundle, riesgos |
| [motion-review.md](motion-review.md) | Comparación CSS / WAAPI / librería y decisión; micro-polish RC3-X4 |
| [personalization-review.md](personalization-review.md) | Fuente del alias, matriz de superficies, dónde sí y dónde no |
| [metadata-review.md](metadata-review.md) | Título, descripción, OG textual, `lang`, viewport; diferidos de marca |
| [issues-fixed.md](issues-fixed.md) · [issues-deferred.md](issues-deferred.md) | Hallazgos corregidos y diferidos |
| [verification.md](verification.md) | Comandos, gates, playthrough |
| `evidence/` | Capturas de la barrida final y de los cierres con alias |

## Código

- `src/components/competition/event-countdown.tsx` — `countdownUrgency` (4 escalones por tiempo real), rótulo con palabra + color, filete y pop en los segundos bajo 10 min.
- `src/components/competition/competition-experience.tsx` — CTA lima con entrada y hover; práctica como primario en UPCOMING/CLOSED; «Ver resultados» en CLOSED; alias y snapshot al juego.
- `src/components/competition/attempt-run.tsx`, `src/components/game/run-view.tsx`, `src/components/game/progression-copy.ts` (`personalizedName`), `year-milestone.tsx`, `ending/career-ending.tsx` — alias en 7.º, 5.º y egreso.
- `src/components/game/ending/ending-result.tsx`, `achievement-cabinet.tsx` — motion de resultado e hitos.
- `src/components/game/interactions/numeric-answer.tsx` — overflow a 320 px.
- `src/app/page.tsx` (`generateMetadata`), `src/app/test/page.tsx`, `src/app/layout.tsx` — metadata textual; `src/app/not-found.tsx`, `src/app/error.tsx` — páginas de framework en el sistema.
- `docs/09-design-system/foundations.md`, `game-components.md` — notas de motion y alias; master spec regenerado.
- Tests: urgencia del reloj (unit + render), práctica como primario en UPCOMING, alias en hitos y cierre, E2E de egreso tolerante al alias.

## Lo que TASK-D no hizo a propósito

Ni librería de motion (tres efectos de entrada no la justifican), ni tokens
nuevos (los escalones de urgencia usan `text-red`, `border-ink`, `border-red`
existentes), ni cambios de reglas, ni assets de marca.
