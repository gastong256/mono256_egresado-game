# Egresado RC3 — TASK-C · Ending + posición + feedback competitivo

Implementación sobre `main` / `afe9fd8` (TASK-B, 2026-09-23). Runtime sigue
en `1.0.0-rc.2`; RC3 no se corta. Estado y evidencia en
[verification.md](verification.md).

| Campo | Valor |
|---|---|
| Scope | B17 rediseño del ending · B18 títulos/frases determinísticas · B19 resultado con puesto · B20 primer puesto / récord con evidencia · recap 7.º→5.º · medallero · estilo de juego · feedback por franja · práctica |
| Matemática / FairScore / Prestige / ranking / empates / RunPlan / recovery / DB / privacidad / seguridad / lifecycle | **UNCHANGED** |
| Migraciones / env / APIs / dependencias | NINGUNA |
| Estados o acciones nuevas del motor | NINGUNO |
| Persistencia nueva | NINGUNA (estilo, franja, frases y hitos se derivan al renderizar) |

## Archivos

| Archivo | Contenido |
|---|---|
| [ending-information-model.md](ending-information-model.md) | Qué datos existen, de dónde salen, qué se muestra, deriva u omite |
| [achievement-mapping.md](achievement-mapping.md) | Hito → hecho → derivación → etiqueta → ¿puede aparecer?; propuestas del PO diferidas |
| [performance-feedback.md](performance-feedback.md) | Franjas, umbrales, catálogo de frases, reglas de tono |
| [competitive-feedback.md](competitive-feedback.md) | Evidencia exigida por cada afirmación competitiva; acciones por estado |
| [ux-decisions.md](ux-decisions.md) | Jerarquía, responsive, medallero, recorrido, motion, accesibilidad |
| [source-notes.md](source-notes.md) | Fuentes externas que cambiaron una decisión |
| [verification.md](verification.md) | Comandos, resultados, QA visual, límites |
| `evidence/` | Capturas: práctica baja/alta, competencia 1.º compartido y fuera del podio, red caída, 320/390/412/1280 y zoom 200 % |

## Código

- `src/components/game/ending/ending-model.ts` — derivaciones puras: `performanceBand`, `PERFORMANCE_FEEDBACK`, `derivePlayStyle`, `deriveAchievements`, `deriveCareerRecap`, `deriveCompetitivePlacement`, `placementCopy`.
- `src/components/game/ending/career-ending.tsx` — composición y acciones; `ending-result.tsx` (resultado competencia/práctica, puesto); `career-profile.tsx`; `achievement-cabinet.tsx`; `career-recap.tsx`.
- `src/components/game/career-epilogue.tsx` — entrada `CareerEpilogueView` (mismo nombre, nuevas props).
- `src/components/game/milestone.tsx` — `headingLevel` para que el egreso sea el `h1`.
- `src/components/competition/attempt-run.tsx` + `competition-experience.tsx` — snapshot `before` (puesto, mejor puntaje, top del podio) al emitir; el estado público de la respuesta viaja al cierre.
- `src/components/competition/verification-panel.tsx` — capa fina sobre el bloque de resultado (compatibilidad de tests).
- `src/components/practice/practice-run.tsx` — usa el cierre compartido con resultado de práctica.
- `src/content/full-career.ts` — `closeCareer` expone también `memories` (ya derivadas por el motor).
- Tests: `tests/unit/ending-model.test.ts` (39), `tests/component/career-ending.test.tsx` (13); E2E extendidos en `practice.spec.ts` (franja baja, sin claims) y `competition.spec.ts` (franja alta, puesto = servidor).

## Diferido

- **Récord contra todo el historial** (incluidos intentos ya superados): requiere backend. El récord implementado compara con el podio visible al emitir y exige 1.º sin compartir después.
- Abanderado / Escolta / Capitán / medallas por año: sin hecho en el dominio → diseño de juego/contenido.
- Empate fuera del podio: el servidor publica Top 3 completo, no la fila propia; fuera del podio no se afirma nada sobre empate (ni exclusividad).
- Prestige: techo ofrecido 0 en v1; el bloque lo muestra sólo si es > 0.
