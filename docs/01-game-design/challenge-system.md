# Sistema de desafíos

## Objetivo

Evitar que Egresado se transforme en una secuencia de multiple-choice. El contenido se construye sobre un conjunto limitado de **patrones de interacción reutilizables**.

## Cinco motores reutilizables de interacción v1

**LOCKED en producto; soporte runtime parcial.** Esta taxonomía supersede la
lista histórica de diez familias y los nombres de tableros como primitivas
independientes. `ScenarioFamily` sigue siendo escenario; los ocho
`InteractionKind` actuales son contratos técnicos, no ocho motores de producto.

| Motor | Modos / componentes, no motores adicionales | Templates de referencia |
|---|---|---|
| Choice / Compare | cards, tabla + claim, escenarios, input numérico acotado | g7.notebook-offer; y2.course-project-survey, standings-claim; y3.transport-pass; y5.final-trip-or-event, next-step-options |
| Allocate / Constrain | Allocation/Constraint Builder, cantidades, recursos, turnos, contingencia, páginas | g7.group-tasks, stand-supplies; y1.course-project-expo, mobile-data; y2.intercurso-plan, team-kit-order; y3.course-project-tech; y4.shift-coverage, course-project-fundraiser; y5.course-project-final, yearbook |
| Timeline / Schedule | deadline, salida inversa, secuencia, disponibilidad, agenda semanal | g7.bus-timing, bus-latest-departure; y1.rehearsal-schedule; y3.friend-day, week-planner |
| Spatial / Graph Canvas | fit/scale, regiones, Route Builder, Flow Board, capacidad, ratio/crop | g7.mural-paint; y1.classroom-layout; y2.court-zones; y3.route-plan; y4.school-event-flow, event-floor-plan; y5.stage-screen |
| Grid / Select / Classify | Number Grid, conteos/distribución, Spinner Builder | g7.may-25-act; y1.student-day-challenge-wheel |

Los modos compuestos conservan un motor principal para contar diversidad.
Intercurso puede combinar Allocate con Timeline; Project Final combina asignación,
tiempo y contingencia; `represent-class` usa comparación/construcción acotada y
comunicación separada, cuya composición concreta se cierra al autorarlo.
Estas correspondencias son diseño: el mural actual usa BudgetBuilder y el
timeline actual compara opciones; no se declara implementado un canvas o planner.

Sin sexto motor en Phase 1 salvo evidencia de que los cinco distorsionan la acción
matemática y revisión explícita de diseño. Sliders, tablas, inputs, pedir información
y animación de rueda son componentes/modos, no frameworks nuevos.

La primera exposición a cada motor ofrece una pista contextual de un paso sobre
la interacción, no sobre la solución matemática; después se reduce. Teacher Demo
futura expone los cinco deliberadamente, separada de la carrera normal. Cada motor
define teclado, tap/touch, foco, errores, labels y reduced motion según [UX](ux-interaction-design.md).
La frontera técnica y las extensiones futuras están en [ADR-025](../03-architecture/adr/ADR-025-full-career-contract-evolution.md).

## Taxonomía matemática

- Cantidad.
- Proporciones y porcentajes.
- Tiempo y tasas.
- Espacio y forma.
- Patrones y relaciones.
- Datos y estadística.
- Probabilidad e incertidumbre.
- Optimización y restricciones.

## Ejemplos canónicos

### Mural
Pared 6 × 2,4 m; cobertura 8 m²/L; elegir pack suficiente/óptimo.

### Notebook
Comparar 20% de descuento vs descuento fijo/cuotas y restricción de efectivo.

### Encuesta
Interpretar 41/38/21 con muestra 90/600 y decidir nivel de confianza.

### Colectivo
28 min con 25% de demora desde 07:10 y entrada 07:45.

### Trabajo grupal
Asignar integrantes con habilidades y horas limitadas.

### Plan de datos
600 MB/día durante 12 días; comparar packs.

### Interacción de redes
Comparar engagement relativo, no likes absolutos.

## Dificultad

La dificultad no depende sólo de números grandes.

Factores:
- cantidad de variables;
- necesidad de múltiples pasos;
- decimales/fracciones;
- información irrelevante;
- información faltante;
- número de restricciones;
- incertidumbre;
- cantidad de soluciones válidas;
- necesidad de optimización y no sólo factibilidad.

## Generación procedural

Patrón recomendado:

1. Generar parámetros desde seed.
2. Resolver el problema internamente.
3. Verificar invariantes.
4. Calcular conjunto de soluciones válidas.
5. Clasificar dificultad.
6. Renderizar narrativa.

Nunca generar opciones al azar y asumir que una es correcta.

## Regla de contenido

Cada desafío debe documentar explícitamente:
- concepto matemático;
- competencia requerida;
- interacción;
- solución/es;
- función de evaluación;
- explicación de feedback;
- parámetros válidos;
- edge cases.

## Variación estructural, no sólo numérica

El patrón de generación de arriba evita que una variante salga rota. No evita que el jugador memorice la respuesta: si el mismo escenario siempre pregunta lo mismo, cambiar `25 %` por `15 %` compra una partida más y nada más.

La arquitectura vigente agrega un nivel intermedio —**plantillas**: estructuras de razonamiento distintas dentro del mismo escenario— y un catálogo aprobado de variantes prevalidado. Ver [familias, plantillas y variantes](challenge-families-and-variants.md) para la jerarquía, la generación por restricción y los controles anti-memorización, y [validación y auditoría de variantes](../04-quality/variant-validation-and-audit.md) para los invariantes que una variante aprobada debe cumplir.

La jerarquía y el pipeline están **implementados** por [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md) y [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md): siete plantillas de producción tienen fuente generada y `g7.group-tasks` conserva deliberadamente una fuente autorada, todas validadas. Desde [ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md), el catálogo aprobado alimenta la partida real; el vigente es `grade-7-dev-5`, con 185 direcciones: las 159 de `dev-4` intactas más 26 de `g7.bus-travel-review`. La familia `bus` demuestra variación cognitiva con `g7.bus-timing` y `g7.bus-latest-departure`, que preguntan y se responden de maneras distintas. Es la primera prueba de producción; ampliar esa profundidad al resto del catálogo sigue siendo trabajo futuro de contenido.

## Bandas de dificultad

Además de `DifficultyLevel` 1–5, la autoría y la competencia usan tres bandas —`CORE`, `STANDARD`, `STRETCH`— que describen estructura de razonamiento en vez de intensidad. La correspondencia entre ambas escalas y el presupuesto de dificultad están en [dificultad y jugabilidad universal](difficulty-and-playability.md).
