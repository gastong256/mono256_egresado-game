# Matriz de contenido de carrera completa v0.3

- **Alcance:** 1.º–5.º
- **Estado de las 25 Templates:** `DESIGN-CANDIDATE-APPROVED`
- **Auditoría inicial de contenido:** completada en v0.2; preserva su trazabilidad
- **Full-Career Cross-Content Audit:** completada; Product Pass integrado el 10 de septiembre de 2026
- **Revisión documental:** inventario v0.3 del checkpoint #2, reconciliado con el Product Pass; sin cambio de versión runtime

Esta es la arquitectura de contenido candidata vigente para los cinco años que
faltan. Contiene 25 Templates —cinco por año— porque hoy dan cobertura y margen
de composición suficientes, no porque 25 sea una cuota contractual. El diseño
detallado de los cinco años está aprobado a nivel candidato; ningún ítem de esta
matriz es todavía contenido runtime. El Product Pass conserva las 25 Templates sin
reemplazos nuevos; la [conformidad técnica](../04-quality/full-career-technical-conformance.md)
aprobó viabilidad con deltas entendidos, no autoría ejecutada.

Fuentes de intención matemática, interacción, evidencia e invariantes:
[1.º — Consolidación](grade-1-template-design.md),
[2.º — Pertenencia](grade-2-template-design.md),
[3.º — Autonomía](grade-3-template-design.md),
[4.º — Responsabilidad](grade-4-template-design.md) y
[5.º — Cierre y futuro](grade-5-template-design.md).

## Matriz auditada

Todas las filas tienen estado `DESIGN-CANDIDATE-APPROVED`. Los IDs se completan
con `y1.`…`y5.` según el año; un recovery usa el mismo prefijo de su fuente.
`—` indica que no hay pertenencia declarada al cluster/arco de composición;
compartir un contexto narrativo no crea automáticamente un cluster.

| Año | Template | Colocación | Banda | Pacing | Equipo | Aura | Recovery de diseño | Cluster / arco |
|---|---|---|---|---|---|---|---|---|
| 1.º | `student-day-challenge-wheel` | anchor | CORE | QUICK | no | no | `none` | — |
| 1.º | `course-project-expo` | anchor | STANDARD | MEDIUM | sí | no | `none` | Project Arc |
| 1.º | `mobile-data` | secondary | CORE | QUICK | no | no | `none` | — |
| 1.º | `rehearsal-schedule` | secondary | STANDARD | MEDIUM | no | no | `schedule-review` | — |
| 1.º | `classroom-layout` | anchor | STRETCH | DEEP | no | no | `scale-fit-review` | — |
| 2.º | `intercurso-plan` | anchor | STANDARD | MEDIUM | sí | no | `none` | Intercurso |
| 2.º | `course-project-survey` | anchor | STANDARD | MEDIUM | no | no | `data-claim-review` | Project Arc |
| 2.º | `team-kit-order` | secondary | CORE | QUICK | no | no | `none` | — |
| 2.º | `standings-claim` | secondary | STANDARD | QUICK | no | sí | `none` | Intercurso |
| 2.º | `court-zones` | anchor | STRETCH | DEEP | no | no | `none` | Intercurso |
| 3.º | `friend-day` | anchor | STANDARD | MEDIUM | sí | no | `none` | — |
| 3.º | `course-project-tech` | anchor | STANDARD | MEDIUM | sí | no | `rate-capacity-review` | Project Arc |
| 3.º | `week-planner` | secondary | STANDARD | MEDIUM | no | no | `none` | — |
| 3.º | `transport-pass` | secondary | CORE | QUICK | no | no | `fixed-variable-review` | — |
| 3.º | `route-plan` | anchor | STRETCH | DEEP | no | no | `none` | — |
| 4.º | `school-event-flow` | anchor | STANDARD | MEDIUM | no | no | `none` | School Event |
| 4.º | `course-project-fundraiser` | anchor | STANDARD | MEDIUM | no | no | `margin-review` | Project Arc |
| 4.º | `shift-coverage` | secondary | CORE | QUICK | sí | no | `none` | School Event |
| 4.º | `event-floor-plan` | anchor | STRETCH | DEEP | no | no | `spatial-capacity-review` | School Event |
| 4.º | `represent-class` | rare replacement | STANDARD | MEDIUM | no | sí, si aparece | `none` | — |
| 5.º | `final-trip-or-event` | anchor | STRETCH | MEDIUM | no | no | `multi-option-comparison-review` | Egreso |
| 5.º | `course-project-final` | anchor | STANDARD | DEEP | sí | sí | `none` | Project Arc |
| 5.º | `stage-screen` | anchor | STRETCH | QUICK | no | no | `none` | Egreso |
| 5.º | `yearbook` | secondary | STANDARD | MEDIUM | no | no | `proportion-capacity-review` | Egreso |
| 5.º | `next-step-options` | secondary | CORE | MEDIUM | no | no | `none` | — |

La rareza de `represent-class` es distinta de su banda STANDARD. Cuenta entre
las 25 Templates del inventario y reemplaza una oportunidad equivalente; no es
un beat extra ni una oportunidad presente en toda run.

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

## Cobertura aprobada de Equipo, Aura y Estilo

Las oportunidades de **Equipo** aprobadas son `y1.course-project-expo`,
`y2.intercurso-plan`, `y3.friend-day`, `y3.course-project-tech`,
`y4.shift-coverage` y `y5.course-project-final`: **6/25**. Las demás declaran
ausencia de Equipo en este diseño; un contexto grupal o una externalidad de 4.º
no son evidencia social por sí mismos.

Las oportunidades de **Aura** son `y2.standings-claim`, `y4.represent-class`
cuando aparece y `y5.course-project-final`. `school-event-flow` es Math-only.
1.º y 3.º no tienen Aura ordinaria; no se fuerza cuota por año.

**Estilo** tiene evidencia fuerte/candidata en `mobile-data`, `rehearsal-schedule`
y en planes válidos de `course-project-expo`; diferencias de planes en
`intercurso-plan`; señal fuerte en `friend-day`, `week-planner` y
`course-project-final`; consecuencias de reparto en `shift-coverage`.
`transport-pass` sólo admite Estilo entre elecciones racionales bajo incertidumbre
explícita; `course-project-fundraiser` conserva una posibilidad candidata.
`next-step-options` puede registrar una preferencia opcional para Estilo/epílogo,
sin puntuarla. `course-project-survey` no usa Estilo. El detalle y los límites
de cada señal están en las fichas de año; no son pesos congelados.

## Cobertura futura de recuperación

| Año | Rutas aprobadas a nivel de diseño |
|---|---|
| 1.º | `rehearsal-schedule → schedule-review`; `classroom-layout → scale-fit-review` |
| 2.º | `course-project-survey → data-claim-review` |
| 3.º | `course-project-tech → rate-capacity-review`; `transport-pass → fixed-variable-review` |
| 4.º | `course-project-fundraiser → margin-review`; `event-floor-plan → spatial-capacity-review` |
| 5.º | `final-trip-or-event → multi-option-comparison-review`; `yearbook → proportion-capacity-review` |

Total: `9 / 25 = 36 %`. Son nueve Templates fuente futuras, no nueve beats de
repaso por run. Las restantes declaran `none` y deben conservar su justificación
editorial; no se inventa recuperación para completar una cuota. Ninguna de estas
rutas está implementada. ADR-024 mantiene **un recovery máximo por etapa**, fuera
del presupuesto ordinario y del score. El único gate de escalabilidad sigue
siendo el [audit posterior a 1.º](../04-quality/post-grade-1-scalability-audit.md),
con ambas obligaciones de ese año; no se agrega un gate por cada año o ruta.

## Pacing

Los cinco pases aprobaron las clases de pacing que muestra la tabla. STRETCH no
equivale a DEEP: `stage-screen` es STRETCH/QUICK y `course-project-final` es
STANDARD/DEEP. Son intenciones de diseño pendientes de validación real.

La envolvente Normal/Fair v1 está en las políticas siguientes. Pacing no equivale
a dificultad ni a un timer. Objetivo UX: mediana 8–10 minutos y p75 ≤12 minutos,
todavía sin validación empírica. Si no se cumple, reducir copy/fricción antes de
recortar sustancia matemática. Teacher Demo conserva densidad de inspección.

## Riesgos de autoría

- `student-day-challenge-wheel`: debe construir/evaluar una distribución; no preguntar un porcentaje aislado.
- `mobile-data`: debe construir un plan sostenible con demandas obligatorias/opcionales; no ser regla de tres.
- `course-project-survey`: selección de información e inferencia defendible, no examen de estadística.
- `transport-pass`: el umbral de usos tiene que cambiar la decisión; no sólo comparar dos precios.
- `course-project-final` — **VERY HIGH**: contingencia real y separación Math/Equipo/Aura, con callbacks que no alteren el techo competitivo.
- `next-step-options` — **VERY HIGH**: FairScore sólo de viabilidad de escenarios; preferencia personal opcional sólo en Estilo/epílogo, nunca orientación vocacional ni juicio sobre una vida correcta.

Los demás invariantes duros —múltiples soluciones, cuellos de botella,
capacidad/flujo, recorrido, márgenes, información geométrica completa— se
conservan en las fichas. La auditoría conjunta los confirmó; la producción debe
aplicar el [Intrinsic Math Gate](content-authoring-guide.md#intrinsic-math-gate).

## Línea del Proyecto del Curso

```text
1.º Exposición       → asignación / restricciones
2.º Encuesta         → estadística / inferencia
3.º Proyecto técnico → tasas / capacidad / recursos
4.º Recaudación      → economía / optimización
5.º Proyecto final   → síntesis / callbacks / contingencia
```

La línea persiste narrativamente en cada año, según el
[sistema narrativo](narrative-system.md).
Su frecuencia puntuable se rige por las políticas siguientes.

## Políticas de composición

Son políticas de **producto/contenido**, todavía sin implementación de clusters
ni frecuencia del arco en el RunComposer. No agregan campos al schema ni cambian
el presupuesto estructural de uno o dos beats ordinarios y un anchor por etapa.
La evolución técnica futura está en [ADR-025](../03-architecture/adr/ADR-025-full-career-contract-evolution.md).

### Envolvente Normal/Fair v1

**Cantidad: LOCKED v1.** Exactamente **9 beats ordinarios puntuables** entre
7.º y 5.º: seis anchors y tres slots secundarios. Supersede el target candidato
9–10/rango preferido 8–10. Recovery, storylets y epílogo no suman beats ordinarios;
un reemplazo raro ocupa un slot existente compatible. La capacidad genérica de
6–12 y las carreras parciales de desarrollo no son el producto oficial v1.

| Eje | Contrato de diseño para una carrera válida | Madurez |
|---|---|---|
| Bandas | CORE 2–3; STANDARD 4–5; STRETCH 1–2 | PRODUCT DIRECTION v1; restricciones de composición versionadas |
| Pacing | QUICK 2–4; MEDIUM 4–5; DEEP 1–2; máximo 2 DEEP | PRODUCT DIRECTION v1; presupuesto de autoría, no reloj |
| Razonamiento | ≥4 familias primarias; máximo 3 TEMPORAL y 2 ECONOMIC_PROPORTIONAL | PRODUCT DIRECTION v1; restricciones globales |
| Datos/lógica | ≥1 primaria DATA_UNCERTAINTY o LOGIC_CLASSIFICATION | PRODUCT DIRECTION v1; mínimo global |
| Interacción | ≥3 de los cinco motores; preferir 4 entre planes válidos | mínimo de producto; preferencia soft adicional |

Los mínimos/máximos no son penalizaciones que otra preferencia pueda compensar.
Su madurez no los convierte en constantes inmutables del core ni en políticas
oficiales desplegadas. No se fuerza una cuota de Equipo/Aura.

### Taxonomía primaria y contexto

Cada Template declara exactamente una familia primaria y tags secundarios
opcionales. Vocabulario v1: TEMPORAL, ALLOCATION, DATA_UNCERTAINTY,
ECONOMIC_PROPORTIONAL, SPATIAL, LOGIC_CLASSIFICATION, SYSTEMS_OPTIMIZATION.
Se cuenta la primaria, no cada tema mencionado; una familia narrativa no equivale
a una familia de razonamiento. Su asignación por Template se valida en la
Definition of Ready, sin inventar enums runtime en documentación.

Contextos secundarios recomendados: SCHOOL_ROUTINE, SOCIAL_GROUP, EVENT_COMPETITION,
PROJECT, MOBILITY, ECONOMIC_RESOURCE, TECHNOLOGY, SPATIAL_ENVIRONMENT,
GRADUATION_FUTURE. Favorecen variedad sin convertir todos los tags en límites duros.
La taxonomía y los modos de interacción viven en [sistema de desafíos](challenge-system.md).

### Event Cluster Policy

**Madurez: `LOCKED`.**

Un evento narrativo puede ofrecer varias lecturas matemáticas. Una run normal
juega como máximo **una Template puntuable de cada cluster** para conservar
variedad. Las membresías son explícitas:

| Año / cluster | Miembros | Máximo puntuable por run normal |
|---|---|---|
| 2.º / Intercurso | `intercurso-plan`, `standings-claim`, `court-zones` | 1 |
| 4.º / School Event | `school-event-flow`, `shift-coverage`, `event-floor-plan` | 1 |
| 5.º / Egreso | `final-trip-or-event`, `stage-screen`, `yearbook` | 1 |

### Recurring Arc Policy

**Madurez: `LOCKED`.**

Presencia narrativa recurrente no equivale a desafío puntuable obligatorio. El
Proyecto del Curso puede mantenerse mediante storylets aun si no se seleccionó
su Template matemática ese año.

### Frecuencia del Project Arc

**Madurez: máximo `LOCKED v1`; target y separación `PRODUCT DIRECTION / SOFT`.**

- Target de diseño aceptado: **1–2 Templates puntuables por carrera completa**.
- Máximo duro **2**: cerrado para v1; supersede explícitamente el máximo candidato del checkpoint #2. Todavía no está implementado.
- Preferir años no consecutivos cuando las composiciones sean igualmente válidas.

### Callback Independence

**Madurez: `LOCKED`.**

El contexto previo enriquece texto/opciones limitadas sin condicionar comprensión,
posibilidad de resolver la situación ni el máximo de FairScore. Ninguna Template
exige haber jugado un Proyecto puntuable previo. Autoridad narrativa:
[independencia de callbacks](narrative-system.md#callback-independence).

### Diversidad cognitiva

**Madurez: mínimos globales de la envolvente v1; preferencias adicionales `SOFT`.**

Entre planes válidos, preferir el más diverso cognitivamente. En particular,
evitar `y3.week-planner + y3.route-plan` si existe una alternativa igualmente
válida y más diversa. No convertir la preferencia en una exclusión dura.

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

## Pool raro de diseño

Los contratos de `rare.y1.power-outage`, `rare.y2.missing-player`,
`rare.y3.offline-project`, `y4.represent-class` y
`rare.y5.five-minutes-before-act` están en
[eventos raros y Prestige](rare-events-and-prestige.md#diseños-raros-aprobados-por-año).
Incluyen narrativa, modificadores y reemplazo puntuable neutral; no son todos
narrativos ni agregan beats. Probabilidades por banda y presupuestos ya tienen
calibración v1 documentada. Los logros concretos y la implementación de
normalización siguen como autoría/contratos futuros, no otro pase de prediseño.
