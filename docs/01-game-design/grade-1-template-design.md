# Diseño de Templates de 1.º — Consolidación

- **Etapa académica:** 1.º
- **Función narrativa:** `CONSOLIDATION`
- **Estado de diseño:** `DESIGN-CANDIDATE-APPROVED`
- **Implementación:** `IMPLEMENTED` en STAGE-08 / Phase 1 (2026-09-11) como contenido
  de desarrollo sobre el catálogo aprobado `grade-1-dev-1`; ver
  [implementación runtime](#implementación-runtime-phase-1). Estado de contenido
  `draft`: no es `math_reviewed`, `playtest_ready` ni `production_ready`.

1.º ocurre en la misma escuela que 7.º y no repite la adaptación institucional.
Su pregunta narrativa es: **“Ya sabés cómo funciona este lugar. Ahora empezás a
descubrir cómo funcionás vos adentro.”**

Frente a 7.º incorpora más construcción, asignación, restricciones simultáneas,
evidencia de Estilo, callbacks, continuidad del Proyecto del Curso, una interacción
espacial fuerte y el primer stress case con dos Templates recovery-capable.

## Taxonomía reconciliada

El Product Pass del 9 de septiembre normaliza las interacciones a los
[cinco motores reutilizables](challenge-system.md#cinco-motores-reutilizables-de-interacción-v1).
Los nombres específicos de esta ficha son modos/presentaciones, no frameworks
nuevos ni capacidades runtime ya implementadas. Estilo sólo usa evidencia
estratégica significativa para Career/Narrative; no aporta FairScore, Prestige
ni oportunidades competitivas. Aplican la composición y el DoR canónicos.

## Cronología y colocación

```text
inicio de 1.º
→ rutinas / tecnología / autogestión
→ contexto de Proyecto del Curso I
→ preparación del Día del Estudiante
→ 21 de septiembre / evento emblemático
→ cierre breve del año
→ 2.º
```

El Proyecto del Curso existe como línea narrativa aunque su Template no sea
seleccionada.

**Anchors aprobados:** `student-day-challenge-wheel`, `course-project-expo` y
`classroom-layout`.

**Secundarias aprobadas:** `mobile-data` y `rehearsal-schedule`.

La composición de auditoría debe poder incluir juntas `classroom-layout` y
`rehearsal-schedule` para fallar ambas y observar dos obligaciones conceptuales con
un único repaso estructural.

## Difficulty reconciliation — precisión de Phase 1

**Decisión de producto autorizada:** conservar el modelo de
[dificultad vigente](difficulty-and-playability.md#de-dónde-sale-la-banda-en-el-código),
sus thresholds y la clasificación de 7.º. No se reabre Phase 0. La primera
lectura de implementación había imputado optimización sólo por existir un
objetivo secundario: ese supuesto queda corregido. Un outcome llamado OPTIMAL
no demuestra el trait `optimization`.

En estas dos Templates se busca **un plan factible**, no el mínimo, máximo ni
mejor plan entre los factibles. Los niveles 100/75/40/10 reconocen condiciones
explícitas del resultado; no ordenan estrategias de Estilo ni exigen encontrar
un extremo matemático. La clasificación se calcula con `cognitiveLoad` y `bandOf`
de `src/game/difficulty/cognitive.ts`, nunca con una banda manual alternativa.

### Rueda: envolvente CORE

Cada variante pide completar las posiciones y cumplir **una** regla proporcional
obligatoria sobre una categoría o conjunto explícito de categorías. Los ejemplos
de abajo son alternativas de autoría, no cuatro exigencias acumuladas. No se
agregan cadenas de conversiones, probabilidades de varios giros ni búsqueda de la
distribución más equilibrada. Fracción, porcentaje y conteo expresan la misma
relación conocida; no representan información incierta.

| Trait | Estado / carga | Evidencia obligatoria del gameplay |
|---|---|---|
| `steps` | activo · 1 | Aplicar una relación parte/total a los conteos; no encadenar el resultado a otra tasa o probabilidad. |
| `constraints` | activo · 2 | Completar el total exacto y satisfacer la regla proporcional declarada, simultáneamente. |
| `selection` | inactivo · 0 | Categorías y regla nombradas; sin datos distractores que haya que descartar. |
| `optimization` | inactivo · 0 | Encontrar una distribución admisible; ninguna función que minimizar/maximizar ni búsqueda del mejor reparto. |
| `uncertainty` | inactivo · 0 | Posiciones equiprobables conocidas; no se estima una probabilidad desconocida ni se puntúa un giro aleatorio. |
| `construction` | activo · 1 | El jugador produce los conteos de la distribución. |

**Carga 4 → CORE.** Las preferencias de quality son umbrales explícitos de la
misma distribución, no optimización. Toda variante debe admitir alternativas y
rechazar total incorrecto/incumplimiento esencial. Añadir una restricción
estructural independiente, selección de datos o pasos encadenados exige volver
a evaluar la banda; no se absorbe silenciosamente en estos traits.

### Datos móviles: envolvente CORE

El horizonte son días restantes y la cobertura escolar diaria se presenta como
una actividad explícita que incluye material y comunicación. Sus cantidades
requeridas ya están dadas para ese horizonte. El jugador construye cuántas
sesiones de cada uso financiar con su capacidad; no debe convertir una cuota
mensual, derivar otra tasa ni resolver calendarios distintos por actividad.

| Trait | Estado / carga | Evidencia obligatoria del gameplay |
|---|---|---|
| `steps` | activo · 1 | Una relación lineal consumo = suma de sesiones × consumo por sesión, en una única unidad. |
| `constraints` | activo · 2 | Cubrir la actividad escolar diaria indicada y no exceder la capacidad total. |
| `selection` | inactivo · 0 | Todos los consumos y cantidades son pertinentes y están identificados; no hay planes con letra chica. |
| `optimization` | inactivo · 0 | Construir un plan viable; no maximizar uso/ahorro/utilidad ni minimizar sobrante. |
| `uncertainty` | inactivo · 0 | Tasas y horizonte conocidos; no se estima demanda futura desconocida. |
| `construction` | activo · 1 | El jugador produce las cantidades de uso, no responde una división aislada. |

**Carga 4 → CORE.** Los planes válidos pueden tener margen, uso ajustado o mezcla
flexible y expresar Estilo sin una estrategia competitivamente superior. Los
objetivos secundarios de quality son condiciones de servicio explícitas, no una
función de utilidad. Variantes que agreguen necesidades independientes, cambios
de unidad o tasas encadenadas deben rechazarse en esta envolvente.

## `y1.student-day-challenge-wheel`

### Situación y acción

Para el Día del Estudiante, el curso arma una rueda de juegos, desafíos grupales,
preguntas, premios simbólicos y descanso. Tiene `N` posiciones equiprobables y el
jugador construye una distribución que satisface reglas explícitas, por ejemplo:

```text
al menos 1/4 de desafíos grupales
exactamente 2 descansos
ninguna categoría supera 40 %
juegos + desafíos ocupan al menos la mitad
```

Son ejemplos de parámetros, no valores congelados.

### Matemática e interacción

- Fracciones, porcentajes, proporciones, probabilidad intuitiva y restricciones discretas.
- Modelo interno: `Σ n_i = N` y `P(i) = n_i / N`, sin formalismo visible.
- Interacción: `Grid / Select / Classify` (modo grilla/conteos); la rueda circular es presentación opcional, el modelo puede ser grilla/conteos.

El generador elige totales y restricciones con soluciones enteras legibles. No usa
aritmética incómoda salvo que esa conversión sea el objetivo.

### Evaluación candidata

- `OPTIMAL`: cumple todo y la preferencia secundaria explícita.
- `EFFICIENT`: cumple las restricciones obligatorias.
- `FUNCTIONAL`: configuración usable que sacrifica un objetivo no esencial explícito.
- `INVALID`: viola una restricción esencial o el total.

### Evidencia, pacing y guardrail

```text
Math = yes · Team = none · Aura = none · Recovery = none
Pacing = QUICK · objetivo de diseño 25–40 s, no timer
```

Estilo sólo entra si aparece una estrategia realmente distinta. Nunca se reduce a
“¿cuánto es 25 % de 20?”: el jugador construye o evalúa una distribución cuyo
resultado cambia el juego.

## `y1.course-project-expo`

### Situación y acción

En Proyecto del Curso I hay tareas —investigar, construir, soporte visual,
presentar, montar, logística— y personas con disponibilidad/capacidad finita. El
jugador asigna el trabajo para producir una exposición viable.

### Requisito duro de generación

Debe haber **más de una solución Math-valid** y soluciones válidas diferentes
deben permitir consecuencias distintas de Equipo o Estilo. Una asignación única
correcta invalida el propósito de la Template.

### Matemática e interacción

Math pregunta si el plan funciona: tareas cubiertas, capacidades no excedidas,
dependencias, disponibilidad y roles requeridos. El modelo es un problema pequeño
de asignación; no muestra notación formal.

Interacción: `Allocate / Constrain` (modo asignación), con tarjetas de tareas y personas/roles. Puede
usar una matriz interna, pero no debe verse como una planilla.

### Evidencia independiente

Equipo pregunta cómo se distribuyen carga, tareas indeseadas y oportunidades de
participación entre planes ya factibles. Esa información social no puede ser la
misma capacidad usada para validar Math.

Estilo puede distinguir:

- Aplicado: reserva/margen y pocos puntos únicos de falla;
- Estratega: uso eficiente de fortalezas;
- Improvisador: plan ajustado/flexible con cobertura intercambiable.

Ninguno es mejor en `FairScore`.

### Evaluación candidata

- `OPTIMAL`: requisitos, robustez/contingencia y cobertura deseada.
- `EFFICIENT`: todas las obligaciones cubiertas.
- `FUNCTIONAL`: la exposición ocurre con un elemento no esencial pendiente.
- `INVALID`: falta esencial, sobrecarga, dependencia imposible o incompatibilidad.

### Variantes, callback y estado

Variar personas/roles, capacidades, tareas, costos, disponibilidad, preferencias y
dependencias. El validador debe probar múltiples soluciones factibles y diferencias
semánticas útiles.

`g7.group-tasks` puede cambiar copy/contexto, por ejemplo confianza o una broma
sobre reparto anterior; cualquier cambio de opciones debe evitar ventaja
competitiva oculta.

```text
Math = yes · Team = yes · Aura = none
Recovery = none · Direct Prestige = none
Pacing = MEDIUM · objetivo 40–60 s
```

El evento raro `rare.y1.power-outage` puede rodear la presentación, pero queda
`UNCOMMON / CONDITIONAL / NARRATIVE_ONLY / Prestige 0`: no agrega challenge puntuable.

## `y1.mobile-data`

### Situación y acción

Con capacidad de datos/almacenamiento/uso limitada y un horizonte restante, el
jugador construye un plan sostenible que cubra actividades obligatorias —material
escolar, comunicación— y opcionales —música, video, descargas— sin marcas reales.

### Matemática e interacción

Tasas, capacidad, planificación proporcional, estimación y restricciones mediante
`Constraint Builder`: frecuencia, toggles, bandas aproximadas o comparación de
planes.

No puede ser “6 GB para 20 días: ¿cuánto por día?”. La decisión exige combinar
demandas obligatorias y opcionales.

### Evaluación candidata

- `OPTIMAL`: cubre obligaciones, respeta capacidad y alcanza un objetivo secundario.
- `EFFICIENT`: cubre obligaciones y respeta capacidad.
- `FUNCTIONAL`: viable, pero sacrifica innecesariamente un objetivo no esencial explícito.
- `INVALID`: excede capacidad u omite una necesidad obligatoria.

### Evidencia, variantes y pacing

```text
Math = yes · Team = none · Aura = none · Recovery = none
Estilo = strong candidate
Pacing = QUICK · objetivo 30–40 s
```

Reserva amplia, uso ajustado eficiente o plan flexible pueden sugerir Aplicado,
Estratega o Improvisador, sin umbral universal todavía. Variar capacidad, horizonte,
demandas y consumos con cantidades limpias cuando la conversión de unidades no sea
el objetivo.

## `y1.rehearsal-schedule`

### Situación y diferencia con 7.º

Antes del ensayo o actividad del Día del Estudiante, hay varios compromisos,
traslados/setup, ventanas y al menos un elemento flexible. El jugador reordena la
secuencia completa.

No repite el desafío del colectivo:

```text
7.º: ¿llego antes de un límite / cuál es la salida más tarde?
1.º: compromisos + transiciones + ventanas + elemento flexible
    → construir una agenda factible
```

Cambiar horarios o destino no sería una Template nueva.

### Matemática, interacción y evaluación

Tiempo, duración, secuencia, ventanas fijas/flexibles y planificación hacia atrás.
Interacción `Timeline / Schedule` para ubicar/reordenar bloques, elegir salida o
comparar secuencias, siempre con alternativa no-drag.

- `OPTIMAL`: cumple compromisos con el margen pedido.
- `EFFICIENT`: los cumple con margen menor.
- `FUNCTIONAL`: logra el objetivo principal moviendo/soltando uno secundario flexible.
- `INVALID`: solapamiento imposible o llegada fuera de ventana.

### Evidencia, callback y recovery

```text
Math = yes · Team = none · Aura = none
Estilo = strong candidate
Pacing = MEDIUM · objetivo 40–60 s
```

La historia del colectivo de 7.º puede alterar humor/copy, no la ventaja
matemática. Aura fue retirada del diseño competitivo ordinario durante la auditoría.

Recovery aprobado: `y1.schedule-review`. Es más corto y simple, con un deadline
fijo, dos actividades y un traslado. Aísla planificación hacia atrás, duración y
transición; no repite la agenda completa. Es `QUICK`, objetivo 20–30 s, no puntúa
y cierra la obligación aunque su resultado sea bajo, conforme a ADR-024.

## `y1.classroom-layout`

### Situación y acción

El aula debe prepararse para la exposición: límites, entrada/salida, mesas u
objetos, zona de presentación, circulación y capacidad. El jugador construye una
disposición espacial válida.

No pregunta sólo el área de un salón. Área, escala y medida importan porque los
objetos deben encastrar y el espacio debe seguir siendo utilizable.

### Matemática e interacción

Interacción `Spatial / Graph Canvas` (modo encastre/escala) con escala explícita, ubicación o
rotación acotada, selección de zonas y restricciones legibles, más controles
equivalentes sin drag.

El modelo puede validar límites, footprints, no solapamiento, despeje mínimo,
capacidad, acceso a salida y conectividad del recorrido.

### Banda y evaluación

Es `STRETCH` por restricciones simultáneas, selección de información, construcción
y optimización ligera, no por currículo posterior.

- `OPTIMAL`: cumple todo más capacidad/uso/eficiencia objetivo.
- `EFFICIENT`: cumple restricciones esenciales.
- `FUNCTIONAL`: permite la exposición sacrificando un objetivo secundario explícito.
- `INVALID`: solapamiento, bloqueo, fuera de límites o falla esencial de capacidad/despeje.

### Evidencia, variantes y recovery

```text
Math = yes · Team = none · Aura = none · Style = none
Pacing = DEEP · objetivo 55–75 s
```

Variar dimensiones, escala, objetos, capacidad, despejes, entrada y zonas. El
generador/validador debe probar una solución válida, no trivialidad y ausencia de
exploits de colocación.

Recovery aprobado: `y1.scale-fit-review`. Usa una región simple, dos o tres
objetos, escala explícita y una restricción principal. Aísla
`representación ↔ medida real + encastre`, no repite el aula completa. Debe ser
QUICK/MEDIUM, más corto, no puntuable y no recursivo.

## Resumen aprobado de 1.º

| Template | Colocación | Banda | Equipo | Aura ordinaria | Recovery | Pacing |
|---|---|---|---|---|---|---|
| `student-day-challenge-wheel` | anchor | CORE | no | no | `none` | QUICK |
| `course-project-expo` | anchor | STANDARD | **sí** | no | `none` | MEDIUM |
| `mobile-data` | secondary | CORE | no | no | `none` | QUICK |
| `rehearsal-schedule` | secondary | STANDARD | no | no | `schedule-review` | MEDIUM |
| `classroom-layout` | anchor | STRETCH | no | no | `scale-fit-review` | DEEP |

Cobertura matemática: probabilidad/proporción, asignación/restricciones,
tasas/capacidad, tiempo/agenda y geometría/escala. Equipo competitivo aparece sólo
en `course-project-expo`. Ninguna Template ordinaria ofrece Aura competitiva.

`power-outage` queda `UNCOMMON / CONDITIONAL / NARRATIVE_ONLY / Prestige 0`. Una
oportunidad rara futura de Aura en 1.º es opcional y debe probar evidencia
independiente; no se fabrica para completar cobertura.

## Estado editorial y gates antes de producción

`DESIGN-CANDIDATE-APPROVED` aprueba intención. Phase 1 produjo parámetros,
unidades, evaluadores, soluciones alternativas, invariantes, feedback, variantes
y señales independientes, usando las interacciones del motor extendidas por
[ADR-025](../03-architecture/adr/ADR-025-full-career-contract-evolution.md); el
barrido de seeds del pipeline y los recorridos a 360 px y por teclado están
automatizados. Ninguna Template es todavía `math_reviewed`, `playtest_ready` ni
`production_ready`: la revisión del Departamento de Matemática, el sign-off
manual de la rueda —Template de alto riesgo— y el pacing empírico son gates de
producción de STAGE-08, no parte de Phase 1.

Después de implementar 1.º se ejecutó el
[audit obligatorio](../04-quality/post-grade-1-scalability-audit.md#resultado-de-la-ejecución-2026-09-14),
que el 14 de septiembre de 2026 dio `PASS WITH REQUIRED HARDENING — RESOLVED` y
autorizó la implementación amplia de 2.º–5.º. La semántica de dos obligaciones
bajo un Repaso máximo está cerrada —seleccionar uno determinísticamente, debrief
del resto y cierre de todas— y el gate la comprobó con contenido real: los
debriefs autorados nombran el concepto que falló y la copia distingue lo
practicado de lo comentado, sin atribuir práctica al cierre conjunto.

## Implementación runtime — Phase 1

Fuente: `src/content/grade-1/`. Cada Template declara un `VariantSourceSpec`
generado por restricción: cada dirección de candidato es una función pura que
recorre sus ejes con un paso biyectivo, y los **gates de autoría** del pipeline
—witnesses de cada nivel, señuelos del Intrinsic Math Gate, Estilo independiente
de la calidad— deciden qué se aprueba. En el navegador sólo se materializan
direcciones aprobadas; el `verify` de runtime es estructural. Cada evaluador tiene
un oráculo independiente —otra implementación, no una llamada al evaluador— que
los tests comparan en todos los planes o en respuestas arbitrarias.

| Template | Formas semánticas | Escalera 100/75/40/10 | Estilo / Equipo |
|---|---|---|---|
| `mobile-data` | `either-or` (una opción del pedido entra y la otra no), `rest-total` (todo en música entra, todo en videos no), `keep-reserve` (un video respeta la reserva, dos no). Días 4–7, material 50/100/150 MB por día, cuatro juegos de tasas. | INVALID excede o deja un día sin material · FUNCTIONAL sin descanso · EFFICIENT descanso sin el pedido · OPTIMAL pedido cumplido | Estilo: reserva ≥ 1/4 → Aplicado; música y video → Improvisador; uso enfocado → Estratega. Sin Equipo. |
| `student-day-challenge-wheel` | Seis familias autoradas de regla: exacta de una categoría, mínima, máxima leída como probabilidad y par sumado; fracciones 1/2–1/10 con total 8–24 divisible; notación fracción, porcentaje entero, «1 de cada k» o probabilidad. | INVALID total o regla · FUNCTIONAL menos de tres tipos · EFFICIENT variedad sin el pedido · OPTIMAL pedido (dos descansos, dos preguntas o los cinco tipos) | Ninguno. La consecuencia explica la probabilidad intuitiva: con n de N, en N giros saldría unas n veces. |
| `course-project-expo` | Roles abiertos, llegada tardía, hueco de roles, horas justas; tres personas, cinco tareas, fases 1–3. Dependencia real: presenta quien investigó o construyó. | INVALID esencial, horas, fase, rol o dependencia · FUNCTIONAL sin apoyo visual · EFFICIENT sin reemplazo para presentar · OPTIMAL apoyo visual y, en la fase 3, alguien libre que podría presentar | Equipo 0–3: participan todos, se respeta el ofrecimiento para montar y el pedido de presentar. Estilo: 1 h libre para todos → Aplicado; investigar y construir en las mismas manos → Estratega; rotación → Improvisador. |
| `rehearsal-schedule` | Agrupar por lugar, salón temprano, cadena de preparaciones, apertura tardía. Tres bloques obligatorios, una merienda flexible, preparación en el lugar, viaje 5–15 min, ventanas, dependencia «cartel después de materiales» y el ensayo como límite fijo. | INVALID choque, viaje, preparación, ventana, dependencia o llegada tarde · FUNCTIONAL merienda afuera · EFFICIENT margen menor · OPTIMAL margen pedido | Estilo por dónde va lo flexible: después de lo obligatorio → Aplicado; entre compromisos → Estratega; primero → Improvisador. Nunca por el margen. |
| `classroom-layout` | Pasillo central, puerta en esquina con pasillo en L, columnas, dos puertas conectadas; aulas 7–8 × 5–6 celdas; escala 50 o 100 cm; tres configuraciones de lugares mínimo/ideal. Medidas reales en cm y una altura que no importa para el piso. | INVALID huella, límite, columna, pasillo, puerta, recorrido o lugares · FUNCTIONAL mínimo sin ideal · EFFICIENT ideal sin caja de materiales · OPTIMAL ideal y caja | Ninguno. |
| `schedule-review` | Dos bloques, un viaje, un límite; la preparación del espacio depende de guardar los materiales; se ofrecen inicios tardíos que ya no entran. | INVALID · FUNCTIONAL llega justo · EFFICIENT margen menor · OPTIMAL margen pedido | Sin Estilo ni score. El feedback escribe la cuenta desde el límite hacia atrás. |
| `scale-fit-review` | Una pared, tres objetos en cm, escala 25/50/100 cm; entran justos o con una celda libre. | INVALID superpone o se sale · FUNCTIONAL sólo la mesa · EFFICIENT mesa y una más · OPTIMAL las tres | Sin Estilo ni score. Señuelo: con separación entre objetos no entran. |

**Banda y metadata.** La banda sale de `bandOf(cognitive)`: rueda y datos 4 →
CORE (D-S08-043); expo 7 y agenda 6 → STANDARD; aula 8 → STRETCH; ambos
Repasos 4 → CORE. La metadata de composición es TEMPORAL/ALLOCATION/
DATA_UNCERTAINTY/ECONOMIC_PROPORTIONAL/SPATIAL según la Template, con motor,
pacing y cronología del año (datos 10, expo 20, aula 30, agenda 40, rueda 50);
la expo declara `recurringArc: 'PROJECT'`. Como la búsqueda global exige metadata
en todo candidato, el content set `7.º → 1.º` aplica a las Templates de 7.º una
capa de metadata candidata —colectivo TEMPORAL/Timeline, acto
LOGIC_CLASSIFICATION/Grid, mural SPATIAL/Spatial, oferta y stand
ECONOMIC_PROPORTIONAL, trabajo grupal ALLOCATION/Allocate— sin tocar sus
definiciones, rasgos, score ni la huella del content set de 7.º.

**Carrera.** Promedio sólo se mueve en la expo —el Proyecto del Curso se evalúa
como trabajo del curso, igual que el mural de 7.º—: 8,8/8,3/7,8/7,0. Equipo de
carrera sale de los mismos acuerdos que mide Equipo competitivo, fuera de
FairScore. Estilo sólo en planes válidos de datos, expo y agenda.

**Catálogo `grade-1-dev-1`.** Construido por `pnpm game:variants build
--content=grade-1` con la política de build de 7.º (hasta 400 candidatos, 24
aprobaciones generadas por Template); el artefacto también re-aprueba las
Templates de 7.º bajo `contentVersion 1.0.0-grade-1`, porque el content set es
`7.º → 1.º`.

| Template | Espacio | Intentadas | Aprobadas | Rechazadas | Duplicadas |
|---|---|---|---|---|---|
| `mobile-data` | 288 | 33 | 25 | 7 | 1 |
| `student-day-challenge-wheel` | 1.728 | 55 | 25 | 29 | 1 |
| `course-project-expo` | 576 | 34 | 25 | 8 | 1 |
| `rehearsal-schedule` | 288 | 43 | 25 | 17 | 1 |
| `classroom-layout` | 192 | 34 | 25 | 8 | 1 |
| `schedule-review` | 216 | 26 | 25 | 0 | 1 |
| `scale-fit-review` | 24 | 25 | 24 | 0 | 1 |

La única duplicada de cada fila es el candidato `c00000`, igual a la referencia
autorada. Los rechazos son gates cumpliendo su función: repartos parejos que ya
eran óptimos, estilos que sólo aparecían con un nivel de resultado, aulas donde
apilar en orden bastaba. Todas las Templates superan los objetivos de la
[guía](content-authoring-guide.md#profundidad-de-variantes) —12, 16 para la rueda
y el aula, 8 para cada Repaso— y cada entrada tiene un witness óptimo probado en
`tests/unit/grade-1-catalog.test.ts`.

**Repaso.** `rehearsal-schedule → schedule-review` y `classroom-layout →
scale-fit-review`, enmarcados por el storylet `y1.review`. El content set autora
un debrief por Template recovery-capable; si ambas fallan en el año, se practica
la primera en orden canónico y la otra se muestra como «Para recordar».

**Hechos de carrera registrados en origen.** Flags `y1.*`, deterministas y
reproducibles por replay; no se guarda cada clic ni una copia del historial:

| Flag | Semántica |
|---|---|
| `y1.project.context-established` | el Proyecto del Curso existe en el año aunque su Template no se juegue |
| `y1.project.outcome` | calidad de la expo |
| `y1.project.everyone-participated`, `volunteer-respected`, `request-respected` | acuerdos del grupo en un plan válido |
| `y1.project.centralized` | alguien quedó con tres o más tareas |
| `y1.project.backup-presenter` | había plan B para presentar |
| `y1.project.strategy`, `y1.mobile.strategy`, `y1.schedule.strategy` | Estilo expresado, sólo en planes válidos |
| `y1.mobile.outcome`, `y1.schedule.outcome`, `y1.layout.outcome`, `y1.student-day.outcome` | calidad por situación |
| `y1.schedule.review-outcome`, `y1.layout.review-outcome` | calidad del Repaso; qué se practicó se deriva con `recordCoverage` |
| `y1.layout.accessible`, `y1.student-day.kinds` | aula con recorrido; tipos de actividad de la rueda |
| `y1.closed` | cierre narrativo del año |

**Callbacks.** La agenda recuerda el colectivo de 7.º y la expo el trabajo
grupal, sólo en el texto: la interacción es idéntica con y sin historia.

**Evento raro.** `rare.y1.power-outage` no corre. La orquestación de rareza con
substreams y presupuesto es trabajo futuro de ADR-025; 1.º deja registrados los
hechos que su condición necesita y un hook declarativo con `implemented: false`
y Prestige de aparición 0.
