# Matriz de contenido de carrera completa v0.2

- **Alcance:** 1.º–5.º
- **Estado:** `CANDIDATE_APPROVED_AFTER_CONTENT_AUDIT`
- **Detalle de 1.º:** `DESIGN-CANDIDATE-APPROVED`
- **Detalle de 2.º–5.º:** candidatos de matriz; falta el Template Design Pass de cada año

Esta es la arquitectura de contenido candidata vigente para los cinco años que
faltan. Contiene 25 Templates —cinco por año— porque hoy dan cobertura y margen
de composición suficientes, no porque 25 sea una cuota contractual. El diseño
detallado de 1.º está en [su ficha canónica](grade-1-template-design.md); ningún
ítem de esta matriz es todavía contenido runtime.

## Matriz auditada

| Año | Template | Banda | Interacción principal | Matemática principal | Señal secundaria | Recovery candidato | Pacing | Estado |
|---|---|---|---|---|---|---|---|---|
| 1.º | `student-day-challenge-wheel` | CORE | Grid / Spinner Builder | fracciones, proporciones, probabilidad intuitiva | ninguna | `none` | QUICK | `DESIGN-CANDIDATE-APPROVED` |
| 1.º | `course-project-expo` | STANDARD | Allocation Board | asignación, capacidad, restricciones | Equipo + Estilo | `none` | MEDIUM | `DESIGN-CANDIDATE-APPROVED` |
| 1.º | `mobile-data` | CORE | Constraint Builder | tasas, capacidad, planificación proporcional | Estilo | `none` | QUICK | `DESIGN-CANDIDATE-APPROVED` |
| 1.º | `rehearsal-schedule` | STANDARD | Timeline / Schedule | ventanas, secuencia, planificación hacia atrás | Estilo | `schedule-review` | MEDIUM | `DESIGN-CANDIDATE-APPROVED` |
| 1.º | `classroom-layout` | STRETCH | Geometry / Spatial | escala, encastre, área, restricciones espaciales | ninguna | `scale-fit-review` | DEEP | `DESIGN-CANDIDATE-APPROVED` |
| 2.º | `intercurso-plan` | STANDARD | Timeline + Allocation | agenda, asignación, optimización | Equipo | a decidir | a decidir | `MATRIX-CANDIDATE` |
| 2.º | `course-project-survey` | STANDARD | Selection / Data | muestra, porcentajes, inferencia válida | ninguna | sí, candidato | a decidir | `MATRIX-CANDIDATE` |
| 2.º | `team-kit-order` | CORE | Constraint Builder | proporciones, porcentajes, redondeo, stock | ninguna | `none`, candidato | a decidir | `MATRIX-CANDIDATE` |
| 2.º | `standings-claim` | STANDARD | Comparison / Selection | puntos, cotas, resultados restantes, incertidumbre | Aura candidata | `none`, candidato | a decidir | `MATRIX-CANDIDATE` |
| 2.º | `court-zones` | STRETCH | Geometry / Spatial | zonas, coordenadas/distancias, restricciones | ninguna | `none`, candidato | a decidir | `MATRIX-CANDIDATE` |
| 3.º | `friend-day` | STANDARD | Constraint Builder | preferencias, disponibilidad, optimización pequeña | Equipo + Estilo | `none`, candidato | a decidir | `MATRIX-CANDIDATE` |
| 3.º | `course-project-tech` | STANDARD | Allocation + Constraint Builder | tasas, capacidad, recursos | Equipo | sí, candidato | a decidir | `MATRIX-CANDIDATE` |
| 3.º | `week-planner` | STANDARD | Timeline | tiempo, secuencia, deadlines | Estilo | `none` | a decidir | `MATRIX-CANDIDATE` |
| 3.º | `transport-pass` | CORE | Comparison / Constraint Builder | costo fijo/variable, relación lineal simple | Estilo | sí, candidato | a decidir | `MATRIX-CANDIDATE` |
| 3.º | `route-plan` | STRETCH | Map / Timeline | distancia, tiempo, optimización de recorrido | ninguna | `none`, candidato | a decidir | `MATRIX-CANDIDATE` |
| 4.º | `school-event-flow` | STANDARD | Constraint Builder | tasas, capacidad, cuellos de botella | Aura sólo con evidencia pública independiente | `none`, candidato | a decidir | `MATRIX-CANDIDATE` |
| 4.º | `course-project-fundraiser` | STANDARD | Constraint Builder | costo, margen, objetivo, equilibrio intuitivo | Estilo posible | sí, candidato | a decidir | `MATRIX-CANDIDATE` |
| 4.º | `shift-coverage` | CORE | Allocation Board | cobertura, horarios, restricciones | Equipo + Estilo | `none`, candidato | a decidir | `MATRIX-CANDIDATE` |
| 4.º | `event-floor-plan` | STRETCH | Geometry / Spatial | área, capacidad, densidad, circulación | ninguna | sí, candidato | a decidir | `MATRIX-CANDIDATE` |
| 4.º | `represent-class` | STANDARD / RARE | a decidir | planificación de presentación, datos, tiempo | Aura + Prestige candidatos si son independientes | no asumido | a decidir | `MATRIX-CANDIDATE / RARE` |
| 5.º | `final-trip-or-event` | STRETCH | Comparison + Constraint Builder | costo total, porcentajes, restricciones múltiples | Equipo sólo si es independiente | sí, candidato | a decidir | `MATRIX-CANDIDATE` |
| 5.º | `course-project-final` | STANDARD | Allocation + Timeline / contingencia | síntesis de restricciones, planificación, optimización | Equipo + Aura candidatos con evidencia estrictamente independiente | `none`, candidato | a decidir | `MATRIX-CANDIDATE` |
| 5.º | `stage-screen` | STRETCH | Geometry / Spatial | razón, escala, dimensiones, recorte/encastre | ninguna | `none` | a decidir | `MATRIX-CANDIDATE` |
| 5.º | `yearbook` | STANDARD | Allocation / Constraint Builder | proporciones, capacidad, páginas, datos | Equipo sólo si es independiente | sí, candidato | a decidir | `MATRIX-CANDIDATE` |
| 5.º | `next-step-options` | CORE | Comparison / Constraint Builder | viabilidad multicriterio con tiempo/viaje | Estilo | `none` | a decidir | `MATRIX-CANDIDATE` |

## Resultado cuantitativo de la auditoría

```text
CORE       6 / 25 = 24 %
STANDARD  13 / 25 = 52 %
STRETCH    6 / 25 = 24 %
```

La presencia de STRETCH en 1.º y CORE en 5.º hace visible que año académico y
dificultad son ejes distintos.

## Cobertura matemática

- **Probabilidad/incertidumbre:** `student-day-challenge-wheel`, `standings-claim`.
- **Datos/estadística:** `course-project-survey`, `standings-claim`.
- **Proporciones/tasas/capacidad:** `mobile-data`, `team-kit-order`, `course-project-tech`, `school-event-flow`, `yearbook`.
- **Tiempo/agenda:** `rehearsal-schedule`, `week-planner` y partes de `intercurso-plan`, `shift-coverage`, `course-project-final`.
- **Asignación/restricciones:** `course-project-expo`, `intercurso-plan`, `friend-day`, `shift-coverage`, `course-project-final`.
- **Geometría/espacio:** `classroom-layout`, `court-zones`, `route-plan`, `event-floor-plan`, `stage-screen`.
- **Economía/costos:** `transport-pass`, `course-project-fundraiser`, `final-trip-or-event`.
- **Decisión multicriterio:** `friend-day`, `course-project-final`, `next-step-options`.

## Diversidad geométrica — requisito

La familia espacial no puede repetir cinco veces “encastrar rectángulos en un
salón”. La progresión semántica vigente es:

```text
1.º classroom-layout → FIT / SCALE / construcción espacial
2.º court-zones      → ZONES / POSITION / distancia
3.º route-plan       → ROUTE / DISTANCE / razonamiento espacial tipo grafo
4.º event-floor-plan → AREA / CAPACITY / densidad / circulación
5.º stage-screen     → RATIO / SCALE / encastre y recorte visual
```

La primitiva de UI puede repetirse; el razonamiento no.

## Cobertura inicial de Equipo y Aura

Los candidatos fuertes de **Equipo** son `y1.course-project-expo`,
`y2.intercurso-plan`, `y3.friend-day`, `y3.course-project-tech`,
`y4.shift-coverage` y `y5.course-project-final`: aproximadamente 6/25. Un séptimo
caso sólo entra con evidencia semántica independiente; un contexto grupal no
alcanza.

Los candidatos fuertes de **Aura** son `y2.standings-claim`,
`y4.represent-class` y `y5.course-project-final`. `y4.school-event-flow` es
condicional a encontrar una decisión pública independiente. El contenido ordinario
de 1.º no tiene Aura competitiva; no es un hueco a rellenar.

## Cobertura candidata de recuperación

| Año | Templates candidatas |
|---|---|
| 1.º | `rehearsal-schedule → schedule-review`; `classroom-layout → scale-fit-review` |
| 2.º | `course-project-survey` |
| 3.º | `course-project-tech`; `transport-pass` |
| 4.º | `course-project-fundraiser`; `event-floor-plan` |
| 5.º | `final-trip-or-event`; `yearbook` |

Total: `9 / 25 = 36 %`. La asimetría es deliberada. Durante autoría, cada Template
restante debe declarar `none` y su razón; no se inventa recuperación para completar
una cuota. Las dos de 1.º alimentan el
[caso obligatorio de auditoría](../04-quality/post-grade-1-scalability-audit.md).

## Pacing

1.º ya tiene pacing de diseño fijado: QUICK para `student-day-challenge-wheel` y
`mobile-data`; MEDIUM para `course-project-expo` y `rehearsal-schedule`; DEEP para
`classroom-layout`. 2.º–5.º lo definirán en sus pases detallados.

La composición candidata de carrera usa 3–4 QUICK, 4–5 MEDIUM y 1–2 DEEP. No se
debe componer una carrera de 9–10 beats todos profundos.

## Riesgos de autoría

- `student-day-challenge-wheel`: debe construir/evaluar una distribución; no preguntar un porcentaje aislado.
- `mobile-data`: debe construir un plan sostenible con demandas obligatorias/opcionales; no ser regla de tres.
- `course-project-survey`: selección de información e inferencia defendible, no examen de estadística.
- `transport-pass`: incluir supuestos de uso y viabilidad; no sólo comparar dos precios.
- `next-step-options`: matemática sobre viabilidad bajo prioridades explícitas, nunca orientación vocacional ni juicio sobre una vida correcta.

## Línea del Proyecto del Curso

```text
1.º Exposición       → asignación / restricciones
2.º Encuesta         → estadística / inferencia
3.º Proyecto técnico → tasas / capacidad / recursos
4.º Recaudación      → economía / optimización
5.º Proyecto final   → síntesis / callbacks / contingencia
```

La línea persiste narrativamente, pero ninguna de estas Templates es obligatoria
en toda run.

## Reemplazos de la auditoría — historia preservada

No reintroducir estas propuestas sin nueva evidencia:

| Propuesta anterior | Reemplazo vigente | Motivo |
|---|---|---|
| `student-day-merienda` | `student-day-challenge-wheel` | Duplicaba packs, mínimo y presupuesto de `g7.stand-supplies`; el reemplazo agrega distribución/probabilidad. |
| `poll-post` | `standings-claim` | Duplicaba encuesta/comunicación dentro de 2.º; el reemplazo suma puntos, cotas e incertidumbre. |
| `team-shirts` | `team-kit-order` | Reduce otro problema de precio/descuento/packs y prioriza stock, redondeo y cantidades. |
| `patio-layout` | `court-zones` | Evita otro layout de muebles; pasa a zonas, posición y distancia. |
| `tech-purchase` | `transport-pass` | Duplicaba `g7.notebook-offer`; introduce costo fijo/variable. |
| `school-event` | `school-event-flow` | Evita duplicar recaudación/presupuesto; usa tasas, capacidad y cuellos de botella. |
| `team-allocation` | `shift-coverage` | Evoluciona la asignación de 1.º hacia cobertura horaria, roles, descanso y equidad. |
| `graduation-layout` | `stage-screen` | Evita otra geometría de salón; cambia a razón, escala, encastre y recorte. |
| `future-week` | `next-step-options` | Evita repetir `week-planner`; compara escenarios futuros viables sin aconsejar una vocación. |

El [catálogo semilla](challenge-catalog.md) conserva propuestas aún más tempranas
como antecedente explícitamente supersedido; esta matriz es la candidata vigente.

## Pool raro v0.1 — contexto candidato

- 1.º: corte de luz antes de presentar.
- 2.º: falta alguien antes del intercurso.
- 3.º: se cae internet durante el proyecto tecnológico.
- 4.º: el jugador debe representar al curso.
- 5.º: algo falla poco antes del evento final o egreso.

La mayoría debe ser `NARRATIVE_ONLY` o `PRESTIGE_REPLACEMENT`, no beats ordinarios
extra. `represent-class` es el primer gran candidato condicional/raro para ejercer
el futuro sistema.
