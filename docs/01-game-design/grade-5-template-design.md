# Diseño de Templates de 5.º — Cierre y futuro

- **Etapa académica:** 5.º
- **Función narrativa:** cierre y futuro
- **Estado:** `DESIGN-CANDIDATE-APPROVED` · checkpoint #2, 9 de septiembre de 2026
- **Implementación:** `NOT_STARTED`; aprobación de diseño, no de contenido ejecutable

La pregunta del año es **«¿Qué dice de mí todo el recorrido que hice?»**.
**Career Convergence — `LOCKED`** exige reutilizar visiblemente una selección
del historial manteniendo cada situación comprensible y resoluble por sí sola.
**Narrative Salience v1 — `LOCKED`** selecciona **3–5 hechos significativos**
con cobertura temporal y desempate deterministas; la implementación sigue pendiente. Ambas
decisiones viven en el [sistema narrativo](narrative-system.md).

## Taxonomía reconciliada

El Product Pass del 9 de septiembre normaliza las interacciones a los
[cinco motores reutilizables](challenge-system.md#cinco-motores-reutilizables-de-interacción-v1).
Los nombres específicos de esta ficha son modos/presentaciones, no frameworks
nuevos ni capacidades runtime ya implementadas. Estilo sólo usa evidencia
estratégica significativa para Career/Narrative; no aporta FairScore, Prestige
ni oportunidades competitivas. Aplican la composición y el DoR canónicos.

## Colocación y composición

Anchors: `y5.final-trip-or-event`, `y5.course-project-final` y `y5.stage-screen`.
Secundarias: `y5.yearbook` y `y5.next-step-options`.

El **cluster Egreso** agrupa `final-trip-or-event`, `stage-screen` y `yearbook`:
máximo **una** Template puntuable por run normal (`LOCKED`).
El Proyecto del Curso persiste narrativamente cada año; su frecuencia puntuable
tiene target aceptado de **1–2 por carrera**, máximo duro **2 LOCKED** y
preferencia por años no consecutivos entre composiciones igualmente válidas.
Ver [políticas de composición](full-career-content-matrix.md#políticas-de-composición).

## `y5.final-trip-or-event`

**STRETCH · MEDIUM · anchor.** Comparar opciones con costo total, porcentajes,
capacidad y restricciones múltiples. El framing argentino por defecto es el
viaje de egresados, con alternativa semántica de evento final de egreso.

**Guardrail socioeconómico `LOCKED`:** no evaluar si el jugador puede pagar
personalmente ni inferir situación económica. Los presupuestos son ficticios o
colectivos. La interacción es `Choice / Compare` (modo opciones con restricciones).

**Invariante `LOCKED`:** al menos **dos restricciones relevantes además del
precio**. Una oferta de notebook con números mayores no cumple el diseño.

```text
Math = yes · Team = none · Aura = none
Recovery = y5.multi-option-comparison-review
```

## `y5.course-project-final`

**STANDARD · DEEP · anchor.** Resolver una contingencia y sintetizar el proyecto
cuando cambian personas, recursos, tiempos o dependencias. El jugador construye
un plan final viable; no vuelve a hacer una asignación estática.

**Invariante `LOCKED`:** `Math action != Team evidence != Aura action`.

- Math: viabilidad del plan bajo el cambio y sus restricciones.
- Equipo: carga y preferencias independientes entre planes Math-valid.
- Aura: acción pública de comunicación separada.
- Estilo: señal fuerte de carrera, sin contribución a FairScore ni Prestige.

La interacción primaria es `Allocate / Constrain` (modo contingencia), con
representación temporal cuando sea necesaria. Los
callbacks del Proyecto pueden cambiar texto, personajes y opciones limitadas,
pero no el máximo de FairScore ni exigir haber jugado Projects puntuables antes.

No otorga Prestige directo por Math/Equipo/Aura. Puede emitir evidencia para un
futuro Hito de Career Arc sólo si es independiente, según
[Prestige](rare-events-and-prestige.md).

```text
Math = yes · Team = yes · Aura = yes · Recovery = none
Riesgo de autoría = VERY HIGH
```

## `y5.stage-screen`

**STRETCH · QUICK · anchor.** Resolver razón, escala y recorte de una
representación para la pantalla del acto. `Spatial / Graph Canvas` (modo escala/recorte)
usa dimensiones y relaciones proporcionadas en la escena.

**Invariante `LOCKED`:** toda la información geométrica necesaria está dada;
no exige saber de antemano relaciones de aspecto ni jerga audiovisual.
Es Math-only, sin recuperación.

## `y5.yearbook`

**STANDARD · MEDIUM · secondary.** Distribuir páginas entre secciones con
mínimos y capacidades, mediante `Allocate / Constrain` (modo páginas/capacidad).

**Invariante `LOCKED`:** capacidad y restricciones de secciones interactúan.
Se rechazan variantes de reparto igualitario o proporción simple. Los callbacks
pueden cambiar el contenido narrativo del anuario, no la matemática central.

```text
Math = yes · Team = none · Aura = none
Recovery = y5.proportion-capacity-review
```

## `y5.next-step-options`

**CORE · MEDIUM · secondary.** Comparar y clasificar escenarios hipotéticos
predefinidos bajo horarios, traslados y compromisos. No construir una semana:
ésa es la distinción `LOCKED` frente a `y3.week-planner`.

**FairScore de viabilidad solamente — `LOCKED`.** Se evalúa qué escenarios son
viables con los datos, nunca si la preferencia de vida del jugador es correcta.
Una elección opcional de preferencia puede alimentar únicamente Estilo/epílogo.

No es orientación vocacional y nunca sugiere que universidad, trabajo, curso u
otra opción tenga superioridad moral. La interacción es `Choice / Compare`
(modo viabilidad de escenarios), no recomendación personal.

```text
Math = yes · Team = none · Aura = none · Recovery = none
Estilo = preferencia opcional, sólo carrera/epílogo
Riesgo de autoría = VERY HIGH
```

## Evento raro

`rare.y5.five-minutes-before-act` es condicional y seeded, como modificador
neutral en oportunidades o `NARRATIVE_ONLY`. Usa únicamente crisis escolares
de baja gravedad. No añade beat, FairScore ni recovery; su aparición concede
Prestige **0**. Ver [eventos raros](rare-events-and-prestige.md#diseños-raros-aprobados-por-año).

## Contrato de entrada al epílogo

Career Epilogue v1 podrá consumir estadísticas de carrera, distribución de
Estilo, historial de recuperaciones/previas, Project Arc, callbacks significativos,
eventos raros, Hitos de display, Hitos de Prestige y elecciones de cierre.
Debe seleccionar una síntesis narrativa, no volcar el historial o una tabla
cruda de estadísticas. El contrato de seis secciones y el selector están cerrados
en [narrativa](narrative-system.md#quinto-año-y-career-epilogue-v1); falta implementarlos.

## Estado editorial

Equipo y Aura ordinaria aparecen sólo en `course-project-final`. Las rutas son
`final-trip-or-event → multi-option-comparison-review` y
`yearbook → proportion-capacity-review`; las otras Templates declaran `none`.
El conteo y placement se consultan en la [matriz](full-career-content-matrix.md).

La aprobación de los cinco diseños no constituye una validación empírica de
pacing ni de equidad. Parámetros, evaluadores, feedback y variantes ejecutables
todavía requieren autoría y los
[requisitos editoriales de Phase 0](content-authoring-guide.md#diseño-aprobado-en-phase-0).
