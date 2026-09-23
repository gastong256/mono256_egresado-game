# Egresado RC3 — TASK-B · UX writing + localización + progresión

Implementación sobre `main` / `7ea70d7` (2026-09-23). Runtime sigue en
`1.0.0-rc.2`; RC3 no se corta. Estado, huella y evidencia en
[verification.md](verification.md).

| Campo | Valor |
|---|---|
| Scope | B11 copy de home/onboarding · B12 copy de situaciones · B13 localización · revisión de CTAs, progresión, transiciones, recovery, cierre de 5.º y egreso |
| Matemática / reglas / datos / respuestas / scoring / recovery / RNG / RunPlan / ranking / DB / seguridad | **UNCHANGED** (`release:verify` 57 comprobaciones, huella RC.2 `0ea3c1de…` intacta) |
| Estados nuevos del motor | NINGUNO |
| Acciones nuevas del log | NINGUNA |
| Dependencias nuevas | NINGUNA |
| Migraciones / APIs | NINGUNA |

## Archivos

| Archivo | Contenido |
|---|---|
| [copy-audit.md](copy-audit.md) | Inventario clasificado (FREE / SEMI / LOCKED), 137 registros, hallazgos de TASK-01 verificados |
| [writing-principles.md](writing-principles.md) | Guía breve y reusable |
| [semantic-diff.md](semantic-diff.md) | Cambios de riesgo medio/alto con antes/después, datos afectados y rationale |
| [progression-ux.md](progression-ux.md) | Arquitectura de intención de CTA, hito de año, labels canónicos, conflicto de orden de cierres |
| [localization-decisions.md](localization-decisions.md) | Colectivo, Repaso, notación de años, referencias removidas |
| [source-notes.md](source-notes.md) | Fuentes externas que cambiaron una decisión |
| [verification.md](verification.md) | Comandos, resultados, playthrough, diferidos |
| `evidence/` | Capturas del playthrough (320/360/390/412), portada, identificación y práctica |

## Qué cambió, en una pantalla

```text
ANTES                                  DESPUÉS
Arranca séptimo → [Seguir]             Arranca séptimo → [Empezar 7.º]
resultado → [Seguir] → 1.º intro       resultado → «Año completado · 7.º ✓ · línea» → [Pasar a 1.º]
Insuficiente → [Seguir] → Repaso       Insuficiente → [Ir al Repaso]
Repaso resuelto → [Seguir]             Repaso resuelto → «…lo cerraste igual» → [Pasar a 2.º]
5.º: Cuarto año (texto de 4.º)         5.º: El último año (texto propio)
1.º: «segundo todavía no está…»        1.º: cierre sin falso final
último resultado → [Seguir] → Egresado último resultado → «Fin de la secundaria · 5.º ✓» → [Ver mi egreso]
«El 60 viene con demora»               «El colectivo viene con demora»
«Proyecto del Curso: la peña»          «La peña» (eyebrow: Proyecto del Curso IV)
```

## Código

- `src/components/game/progression-copy.ts` — `continueIntent`, `continueLabel`, `completesYear`, `yearMilestoneCopy` (presentación pura sobre selectores del motor).
- `src/components/game/year-milestone.tsx` — el hito de cierre de año.
- `src/components/game/run-view.tsx` — botón con `data-intent`, hito en el slot de acción, copy del Repaso, rechazo en lenguaje de jugador.
- `src/components/game/stage-label.ts` — `stageNumeral` compartido (antes privado en `year-result.tsx`).
- `src/content/grade-*/storylets.ts` — intro/cierre/repaso: sólo `eyebrow`/`title`/`text`.
- `src/content/grade-{7,1,3,4,5}/challenges/*.ts` — 9 ediciones de `title`/`setup`, ningún dato.
- `src/components/competition/*`, `src/components/practice/*`, `career-epilogue.tsx` — copy.
- `docs/09-design-system/game-components.md` — sección YearMilestone.
- Tests: `tests/unit/progression-copy.test.ts` (intención contra el motor en dos carreras reales), `tests/component/year-milestone.test.tsx`; ajustes de label en `grade-7-ui`, `grade-7-slice`, `gameplay.ts`, `competition-ui`.

## Diferido

- **Orden de `y2–y5.closing`** (prioridad 90, aparece tras la intro): requiere bump de contenido; ver `progression-ux.md`.
- **«Jugar de nuevo» duplicado** (epílogo + panel de verificación) y jerarquía del ending: TASK-C.
- **`course-project-tech`**: comentario de cabecera todavía dice «una hora de laboratorio»; las variantes aprobadas usan 8–16 min. Prosa corregida; revisión de autor pendiente (CONTENT REVIEW).
- `YearResult` (`/dev/grade-7`) conserva «Los años siguientes están en construcción»: superficie de desarrollo, no pública.
