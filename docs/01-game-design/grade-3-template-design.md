# Diseño de Templates de 3.º — Autonomía

- **Etapa académica:** 3.º
- **Función narrativa:** autonomía
- **Estado:** `DESIGN-CANDIDATE-APPROVED` · checkpoint #2, 9 de septiembre de 2026
- **Implementación:** `NOT_STARTED`; aprobación de diseño, no de contenido ejecutable

La pregunta del año es **«¿Cómo organizo mis propias decisiones?»**. El jugador
organiza tiempo, recursos, movilidad y compromisos. Es deliberadamente el año más
rico en Estilo hasta este punto del recorrido; ninguna estrategia vital recibe
superioridad moral. Rige la [envolvente](stage-08-product-design-envelope.md).

## Taxonomía reconciliada

El Product Pass del 9 de septiembre normaliza las interacciones a los
[cinco motores reutilizables](challenge-system.md#cinco-motores-reutilizables-de-interacción-v1).
Los nombres específicos de esta ficha son modos/presentaciones, no frameworks
nuevos ni capacidades runtime ya implementadas. Estilo sólo usa evidencia
estratégica significativa para Career/Narrative; no aporta FairScore, Prestige
ni oportunidades competitivas. Aplican la composición y el DoR canónicos.

## Colocación y composición

Anchors: `y3.friend-day`, `y3.course-project-tech` y `y3.route-plan`.
Secundarias: `y3.week-planner` y `y3.transport-pass`.

La preferencia por diversidad cognitiva es **soft**: evitar
`week-planner + route-plan` cuando existe una composición igualmente válida y
más diversa. No es una exclusión dura. `course-project-tech` pertenece al
Proyecto del Curso según las
[políticas de composición](full-career-content-matrix.md#políticas-de-composición).

## `y3.friend-day`

**STANDARD · MEDIUM · anchor.** Organizar una salida del Día del Amigo mediante
disponibilidades, traslados, duraciones, restricciones y una optimización pequeña.
La interacción de diseño es `Timeline / Schedule` (modo disponibilidades).

Math evalúa viabilidad del plan. Equipo evalúa preferencias e inconvenientes
repartidos entre planes Math-valid; Estilo tiene una señal fuerte.

**Invariante `LOCKED`:** deben existir varios planes Math-valid con consecuencias
distintas de Equipo/Estilo. No alcanza encontrar la única franja libre común.

```text
Math = yes · Team = yes · Aura = none · Recovery = none
```

## `y3.course-project-tech`

**STANDARD · MEDIUM · anchor.** Organizar recursos compartidos del proyecto
tecnológico: almacenamiento, tasas, fechas límite y dependencias. La dirección de
interacción es `Allocate / Constrain` (modo recursos/dependencias).

**Invariante `LOCKED`:** cada variante utiliza más de un recurso o dependencia;
no puede resolverse como un único cálculo de tasa. El problema trata recursos
compartidos y dependencias del proyecto, no consumo personal de datos como en 1.º.

```text
Math = yes · Team = yes · Aura = none
Recovery = y3.rate-capacity-review
```

La contribución de Equipo debe declarar evidencia propia, separada de la
factibilidad matemática, bajo las reglas comunes de autoría.

## `y3.week-planner`

**STANDARD · MEDIUM · secondary.** Construir una organización de varios días
con capacidad temporal, deadlines y bloques flexibles, mediante `Timeline / Schedule` (modo varios días).
Tiene Math y Estilo fuerte, sin Equipo, Aura ni recuperación.

La escala de varios días y bloques flexibles la distingue del ensayo de una
tarde de 1.º. No es una app de productividad ni moraliza trabajo o descanso.

## `y3.transport-pass`

**CORE · QUICK · secondary.** Comparar costos fijos y variables según la
cantidad de usos; el umbral entre alternativas debe cambiar la decisión.
La interacción es `Choice / Compare` (modo umbral entre alternativas).

**Invariante `LOCKED`:** el umbral de cantidad de usos es estructuralmente
necesario. Comparar dos descuentos como en 7.º no cumple el diseño.

```text
Math = yes · Team = none · Aura = none
Recovery = y3.fixed-variable-review
```

Estilo sólo puede aparecer si varias elecciones siguen siendo racionales bajo
incertidumbre explícita; elegir la alternativa matemáticamente viable por sí
solo no define Estilo.

## `y3.route-plan`

**STRETCH · DEEP · anchor.** Construir un recorrido sobre mapa/red con **3–4
puntos relevantes**, razonando sobre distancia, tiempo y orden de visita.
Interacción de diseño: `Spatial / Graph Canvas` (modo recorrido en red).

**Invariante `LOCKED`:** cambiar el orden del recorrido modifica materialmente
la viabilidad o eficiencia. Es Math-only y no tiene recuperación.

## Evento raro y continuidad

`rare.y3.offline-project` es un modificador condicional y seeded del proyecto
tecnológico, neutral en oportunidades: no agrega beat, FairScore ni Prestige.
El contexto puede cambiar sin ampliar el techo competitivo. Su contrato está en
[eventos raros](rare-events-and-prestige.md#diseños-raros-aprobados-por-año).

La historia del Proyecto del Curso puede reaparecer aunque no se hayan jugado
sus Templates anteriores. Rige
[Callback Independence](narrative-system.md#callback-independence).

## Estado editorial

Equipo aparece sólo en `friend-day` y `course-project-tech`. No hay oportunidad
ordinaria de Aura en 3.º. Las rutas aprobadas de diseño son
`course-project-tech → rate-capacity-review` y
`transport-pass → fixed-variable-review`; las otras tres Templates declaran
`none`.

La [matriz](full-career-content-matrix.md) reúne la cobertura. Parámetros,
evaluadores, feedback y variantes ejecutables siguen sin producirse; aplican los
[requisitos editoriales de Phase 0](content-authoring-guide.md#diseño-aprobado-en-phase-0).
