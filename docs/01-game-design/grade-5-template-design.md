# Diseño de Templates de 5.º — Cierre y futuro

- **Etapa académica:** 5.º
- **Función narrativa:** cierre y futuro
- **Estado:** `DESIGN-CANDIDATE-APPROVED` · checkpoint #2, 9 de septiembre de 2026
- **Implementación:** `IMPLEMENTED` en STAGE-08 (2026-09-16) como contenido de
  desarrollo; ver [implementación runtime](#implementación-runtime)

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
pacing ni de equidad. Los parámetros, evaluadores, feedback y variantes ya
existen —ver abajo— y siguen en estado `draft`: la revisión del Departamento de
Matemática y el pacing empírico son gates de producción. Aplican los
[requisitos editoriales de Phase 0](content-authoring-guide.md#diseño-aprobado-en-phase-0).

## Implementación runtime

Fuente: `src/content/grade-5/`. Mismas reglas que los años anteriores:
generación por restricción, gates de autoría en el pipeline, oráculo
independiente por evaluador y materialización sólo de direcciones aprobadas.

| Template | Formas semánticas | Escalera 100/75/40/10 | Equipo / Aura / Estilo |
|---|---|---|---|
| `y5.final-trip-or-event` | Cuatro paquetes contra el fondo del curso, los días que da el colegio y los lugares que hacen falta; formas `fondo-corto`, `pocos-dias` y `curso-grande` | INVALID no se puede hacer · FUNCTIONAL se puede pero falta lo que el curso pidió · EFFICIENT trae todo y deja el fondo al límite · OPTIMAL trae todo y deja la reserva | Ninguno |
| `y5.course-project-final` | Seis tareas con dueño y horas, alguien que no va a estar, y tres destinos por tarea: mantener, repartir o recortar; formas `se-cae-el-video`, `menos-horas` y `todo-esencial` | INVALID recorta algo esencial, deja la tarea de quien no está o pasa las horas de alguien · FUNCTIONAL el plan cierra · EFFICIENT sobrevive parte de lo no esencial · OPTIMAL sobrevive todo | **Equipo** por los acuerdos del grupo y **Aura** por lo que el curso dice del cambio, en campos distintos de la respuesta (`LOCKED`). Estilo por la forma de la reconstrucción |
| `y5.stage-screen` | Pantalla e imagen en centímetros, el cartel del curso de un lado con su aire, y cinco formas de proyectar; formas `pantalla-ancha`, `imagen-alta` y `cartel-grande` | INVALID deforma o se come el cartel · FUNCTIONAL deja media pantalla vacía · EFFICIENT llena casi todo · OPTIMAL llena la pantalla con el cartel entero | Ninguno |
| `y5.yearbook` | Páginas exactas de imprenta, mínimos pactados, un tope y material por sección; formas `tope-apretado`, `minimos-altos` y `material-desparejo` | INVALID no suma exacto o rompe lo pactado · FUNCTIONAL cierra sin completar ninguna sección · EFFICIENT completa alguna · OPTIMAL completa todas las que se podían | Ninguno |
| `y5.next-step-options` | Cinco escenarios ya escritos contra las horas libres, el viaje diario y el día tomado; formas `horas-justas`, `viaje-largo` y `compromiso-fijo` | INVALID marca como viable algo que no entra · EFFICIENT deja uno viable afuera · FUNCTIONAL deja dos o más · OPTIMAL exacta | Ninguno. La preferencia personal **no se puntúa de ninguna forma** |
| `y5.multi-option-comparison-review` | Un paquete que no incluye el micro, que se cobra por persona | OPTIMAL el total con el micro de cada uno · FUNCTIONAL sumarlo una sola vez · EFFICIENT una persona de diferencia · INVALID el resto | Sin Estilo ni score |
| `y5.proportion-capacity-review` | Material de una sección contra lo que entra por página | OPTIMAL sube al entero · FUNCTIONAL se queda en la parte entera · EFFICIENT una página de diferencia · INVALID el resto | Sin Estilo ni score |

**Banda y metadata.** `bandOf(cognitive)` da: el año que viene 4 → CORE; muestra
final y anuario 7 → STANDARD; viaje y pantalla 8 → STRETCH; los dos Repasos 1 →
CORE. Eso es 1 CORE / 2 STANDARD / 2 STRETCH, la distribución que pide la
matriz. El cluster `egreso` lo declaran viaje, pantalla y anuario.

**Guardrail socioeconómico.** El viaje mira un fondo del curso, nunca un
bolsillo: entre los parámetros no hay ningún dato por persona y el desafío no
pregunta ni infiere qué puede pagar nadie. El Repaso sí usa un precio por
persona, y es del micro —un costo del paquete—, no de la situación de nadie.

**`next-step-options` no opina.** Se evalúa sólo qué escenarios entran con las
horas, el viaje y el día ya tomado. La preferencia personal se pregunta aparte,
con «no se puntúa» escrito en la pantalla, y lo único que hace es quedar
registrada como hecho de carrera para el cierre: no toca FairScore, ni Equipo,
ni Aura, ni Estilo. Ninguna opción de vida vale más que otra, y el evaluador no
tiene forma de expresar que alguna valga.

**Interacción de la pantalla.** El diseño dirige la pantalla del acto a
`Spatial / Graph Canvas`; la implementación usa `Choice / Compare`, porque la
decisión es elegir entre formas de proyectar y toda la geometría está escrita.
La familia de razonamiento declarada sigue siendo `SPATIAL`, que es de lo que
trata la cuenta.

**Catálogo `grade-5-dev-1`.** 1025 entradas, 172 de 5.º, construido con
`pnpm game:variants build --content=grade-5`; re-aprueba los años anteriores sin
tocar sus artefactos publicados. `7.º → 5.º` es el primer set con los seis años
y sigue siendo `official: false`.

**Lo que 5.º todavía no trae.** La convergencia de carrera se cumple hoy por
construcción —ninguna Template necesita un callback para entenderse ni para
resolverse— pero la saliencia narrativa, el epílogo y la rareza son parte de la
integración de carrera completa, donde se implementan una sola vez
(D-S08-067).
