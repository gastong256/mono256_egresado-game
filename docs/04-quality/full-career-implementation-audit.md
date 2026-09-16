# Auditoría de implementación de carrera completa

- **Estado:** `REQUIRED · EXECUTED` — ejecutado el 2026-09-16 sobre la carrera
  real 7.º → 5.º, con el catálogo aprobado `grade-5-dev-2`
- **Cuándo:** al terminar la integración de carrera completa, antes de declarar
  cerrada cualquier obligación de STAGE-08
- **Veredicto:** `PASS WITH REQUIRED HARDENING — RESOLVED`

Un único veredicto, y es éste. Cuatro defectos técnicos acotados aparecieron
durante el gate y se corrigieron dentro de él; ninguna decisión de producto
cerrada se reabrió y ninguna calibración de score, dificultad u oportunidad
competitiva se movió.

## Qué se auditó

La carrera real, no un fixture: `createFullCareerRunDescriptor` compone los
nueve beats del presupuesto sobre las seis etapas usando las 42 Templates
publicadas, y `createFullCareerDependencies` las juega con eventos raros,
Prestige, hitos, callbacks y epílogo.

| Frontera | Cómo se comprobó |
|---|---|
| Composición | nueve beats en seis etapas, un anchor por año, cluster máximo 1, arco Proyecto 0–2 y no consecutivo, cuotas de banda y pacing, validador independiente sobre cada plan |
| Costo | 300 carreras: p50 384 ms, p95 404 ms, peor caso 434 ms, 0 fallas, 0 planes inválidos |
| Variedad | las 28 Templates elegibles aparecen a lo largo del barrido; seeds distintas dan planes distintos |
| Evidencia separada | Math, Equipo y Aura se leen de campos distintos de la respuesta; una carrera perfecta llega a **10 000** exactos |
| Estilo | cada Template con estilo deja ≥ 2 ejes con la matemática óptima en **todas** sus variantes aprobadas; jugar siempre óptimo produce estilos dominantes distintos |
| Rareza | presupuesto de 2 apariciones respetado, elegibilidad contextual y no por rendimiento, un evento raro no mueve el puntaje |
| Prestige | techo ofrecido 0 declarado; el servidor recompone el mismo desglose; aparecer no otorga nada |
| Repaso | máximo uno por etapa, fuera de FairScore, egreso garantizado incluso con todo mal |
| Epílogo | orden canónico, saliencia determinista, dimensiones ausentes no dibujadas como ceros |
| Replay y servidor | log → replay → `validateSubmittedRun` reproduce puntaje, Prestige y cierre bajo seis políticas de juego |
| Accesibilidad | los nueve beats y el epílogo a 320 px, teclado puro, objetivos de 44 px, axe `wcag22aa` sin violaciones |

## Hallazgos y resolución

| # | Hallazgo | Impacto | Resolución |
|---|---|---|---|
| 1 | La carrera perfecta puntuaba 9085–9096, no 10 000: ninguna variante garantizaba que una respuesta óptima dejara además el Equipo máximo, ni que alguna postura llegara al máximo de Aura | Alto · el techo de FairScore era inalcanzable por construcción | Gates de autoría nuevos en las Templates con Equipo y con Aura; los catálogos se republicaron como `-dev-2`. No se tocó la ScorePolicy (D-S08-088) |
| 2 | Con la lista completa de objetivos blandos, los criterios lexicográficos producían un ganador único: 300 carreras usaban 12 de 28 Templates y las tres primeras runs eran el mismo contenido | Alto · rejugabilidad | La carrera usa sólo `template-freshness`; las restricciones duras ya llevan los pisos de variedad (D-S08-082) |
| 3 | `createRuleset` descartaba silenciosamente la política de rareza: 400 carreras daban 0 eventos raros | Medio · la capacidad existía y no corría | La política se copia al ruleset devuelto y entra en su huella |
| 4 | El detalle de una opción no podía encogerse y empujaba la fila fuera de una pantalla de 320 px en las tarjetas de decisión | Medio · piso de reflow `LOCKED` | El detalle baja a su propio renglón cuando no entra (D-S08-089) |

Además, dentro del gate: el epílogo dejó de dibujar `Prestige 0` cuando la
edición no ofreció ninguna oportunidad —presentar una ausencia como un cero es
exactamente lo que la regla de `null ≠ 0` prohíbe— y los callbacks de carrera se
implementaron leyendo sólo flags grabados en su año de origen.

## Asimetría conocida, no corregida

Las Templates de 7.º son anteriores al gate de autoría de Estilo y atan algunos
ejes a su nivel Math: en `g7.bus-timing`, por ejemplo, el nivel óptimo siempre
es `estratega`. A nivel carrera el efecto no se propaga —jugar siempre óptimo
produce estilos dominantes distintos según la seed— y ningún eje es mejor que
otro, que es lo que el producto cierra. Reatribuir los ejes de 7.º sería
recalibrar contenido validado sin una decisión de producto que lo pida, así que
se registra y no se toca.

## Lo que esta auditoría no dice

No dice que exista una carrera oficial: la edición es `official: false` y la
emisión de seeds, el ranking y el servidor competitivo son STAGE-09. No dice que
la calibración sea la correcta: el pacing empírico con jugadores reales y la
revisión del Departamento de Matemática siguen pendientes, y son gates de
producción de STAGE-08 que ningún test sustituye. No dice que el contenido esté
fuera de `draft`.

## Evidencia

`pnpm verify` en verde sobre `main`: 93 archivos y 1663 tests de Vitest, 146 E2E
de Playwright en desktop y mobile. Las pruebas específicas de este gate están en
`tests/integration/full-career.test.ts`,
`tests/integration/full-career-simulation.test.ts`,
`tests/integration/style-audit.test.ts`,
`tests/integration/career-callbacks.test.ts`,
`tests/unit/post-g1-composer-audit.test.ts` y `tests/e2e/full-career.spec.ts`.
