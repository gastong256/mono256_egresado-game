# Diseño de Templates de 4.º — Responsabilidad

- **Etapa académica:** 4.º
- **Función narrativa:** responsabilidad
- **Estado:** `DESIGN-CANDIDATE-APPROVED` · checkpoint #2, 9 de septiembre de 2026
- **Implementación:** `NOT_STARTED`; aprobación de diseño, no de contenido ejecutable

La pregunta del año es **«¿Qué pasa cuando otras personas dependen de mis
decisiones?»**. El principio **Responsibility Externality — `LOCKED`** exige
mostrar consecuencias sobre personas o sistemas sin convertir esa externalidad
en evidencia automática de Equipo. Su autoridad narrativa está en el
[sistema narrativo](narrative-system.md#responsibility-externality).

## Taxonomía reconciliada

El Product Pass del 9 de septiembre normaliza las interacciones a los
[cinco motores reutilizables](challenge-system.md#cinco-motores-reutilizables-de-interacción-v1).
Los nombres específicos de esta ficha son modos/presentaciones, no frameworks
nuevos ni capacidades runtime ya implementadas. Estilo sólo usa evidencia
estratégica significativa para Career/Narrative; no aporta FairScore, Prestige
ni oportunidades competitivas. Aplican la composición y el DoR canónicos.

## Colocación y composición

Anchors: `y4.school-event-flow`, `y4.course-project-fundraiser` y
`y4.event-floor-plan`. Secundaria: `y4.shift-coverage`.
Oportunidad rara/especial: `y4.represent-class`, como reemplazo neutral.

El **cluster School Event** agrupa `school-event-flow`, `shift-coverage` y
`event-floor-plan`: máximo **una** Template puntuable por run normal (`LOCKED`).
La recaudación pertenece al arco Proyecto del Curso. Ver
[políticas de composición](full-career-content-matrix.md#políticas-de-composición).

## `y4.school-event-flow`

**STANDARD · MEDIUM · anchor.** Intervenir en el flujo del evento escolar usando
tasas, throughput, capacidad y cuellos de botella. La interacción de diseño es
`Spatial / Graph Canvas` (modo red de flujo/cuellos de botella).

**Invariante `LOCKED`:** toda variante contiene un cuello de botella material
cuya identificación cambia la intervención. Se rechazan cálculos aislados de
tasa. El efecto sobre otras personas es visible, pero la evaluación es
**Math-only**: sin Equipo, Aura ni recuperación.

## `y4.course-project-fundraiser`

**STANDARD · MEDIUM · anchor.** Organizar una recaudación con costos fijos y
variables, ingresos, margen, objetivo y capacidad, mediante `Allocate / Constrain` (modo ingresos/capacidad). Es la evolución económica del Proyecto del Curso.

**Invariante `LOCKED`:** cubrir costos y alcanzar el objetivo deben ser
condiciones distintas. No alcanza calcular un margen unitario. El objetivo
colectivo y la capacidad la distinguen del umbral de consumo de `transport-pass`
de 3.º.

```text
Math = yes · Team = none · Aura = none
Recovery = y4.margin-review
```

Estilo conserva sólo la posibilidad candidata de la matriz anterior, sujeta a
evidencia de estrategias diferentes; no agrega otra contribución competitiva.

## `y4.shift-coverage`

**CORE · QUICK · secondary.** Asignar turnos, roles y personas con varias
franjas, continuidad y descansos. Math evalúa la factibilidad de cobertura;
Equipo usa carga social y preferencias entre cronogramas Math-valid.

**Invariante `LOCKED`:** múltiples soluciones Math-valid con consecuencias
distintas de Equipo/Estilo. Cumplir cobertura no otorga automáticamente el
crédito social. La dirección de interacción es `Allocate / Constrain` (modo turnos/cobertura, con representación temporal).

```text
Math = yes · Team = yes · Aura = none · Recovery = none
```

## `y4.event-floor-plan`

**STRETCH · DEEP · anchor.** Diseñar un espacio donde área, capacidad,
circulación y despejes explícitos se afectan entre sí.

**Invariante `LOCKED`:** capacidad y flujo son estructuralmente necesarios.
Una variante de encastre simple, como cambiar muebles del aula de 1.º, se
rechaza. `Spatial / Graph Canvas` (modo capacidad/circulación) expresa flujo, no sólo área.

```text
Math = yes · Team = none · Aura = none
Recovery = y4.spatial-capacity-review
```

## `y4.represent-class`

**STANDARD · MEDIUM · reemplazo raro condicional.** Representar al curso con una
propuesta viable bajo restricciones explícitas y una acción pública separada.
En Practice la elegibilidad admite varios caminos, no sólo buenos resultados.
En Fair la Competition Seed fija elegibilidad/presencia común antes de jugar; el
historial individual no desbloquea oportunidades competitivas extra. La interacción
es `Choice / Compare`, con respuesta Math/comunicación semánticamente separada.

**Invariante `LOCKED`:** `Math action != Aura action != Prestige evidence`.

- Math: viabilidad de la propuesta.
- Aura: acción de comunicación pública distinta de la solución matemática.
- Prestige raro: sólo un logro independiente del historial de carrera, dentro
  del presupuesto normalizado; aparecer concede **0**.

```text
Team = none · Aura = yes, cuando aparece · Recovery = none
```

El reemplazo no añade beat puntuable ni techo de FairScore/Prestige. No asigna
Prestige a la corrección matemática ni a la misma acción pública que ya paga
Aura. Los slots y la independencia de evidencia están cerrados como producto;
el detalle autorado de cada logro y la implementación bajo
[ADR-025](../03-architecture/adr/ADR-025-full-career-contract-evolution.md) siguen pendientes. Ver [eventos raros y Prestige](rare-events-and-prestige.md).

## Estado editorial

Equipo aparece sólo en `shift-coverage`; Aura sólo en `represent-class` cuando
aparece. Las rutas de diseño son `course-project-fundraiser → margin-review` y
`event-floor-plan → spatial-capacity-review`. Las otras Templates declaran
`none`, incluido el reemplazo raro.

La [matriz](full-career-content-matrix.md) conserva placement y cobertura.
Evaluadores, parámetros, feedback y variantes ejecutables siguen pendientes de
producción bajo los
[requisitos editoriales de Phase 0](content-authoring-guide.md#diseño-aprobado-en-phase-0).
