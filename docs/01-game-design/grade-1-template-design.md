# Diseño de Templates de 1.º — Consolidación

- **Etapa académica:** 1.º
- **Función narrativa:** `CONSOLIDATION`
- **Estado:** `DESIGN-CANDIDATE-APPROVED`
- **Implementación:** `NOT_STARTED`; este documento no la autoriza

1.º ocurre en la misma escuela que 7.º y no repite la adaptación institucional.
Su pregunta narrativa es: **“Ya sabés cómo funciona este lugar. Ahora empezás a
descubrir cómo funcionás vos adentro.”**

Frente a 7.º incorpora más construcción, asignación, restricciones simultáneas,
evidencia de Estilo, callbacks, continuidad del Proyecto del Curso, una interacción
espacial fuerte y el primer stress case con dos Templates recovery-capable.

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
- Interacción: `Grid / Spinner Builder`; la rueda circular es presentación opcional, el modelo puede ser grilla/conteos.

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

Interacción: `Allocation Board`, con tarjetas de tareas y personas/roles. Puede
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
`RARE / CONDITIONAL / NARRATIVE_ONLY / Prestige 0`: no agrega challenge puntuable.

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

Interacción `Geometry / Spatial Manipulation` con escala explícita, ubicación o
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

`power-outage` queda `RARE / CONDITIONAL / NARRATIVE_ONLY / Prestige 0`. Una
oportunidad rara futura de Aura en 1.º es opcional y debe probar evidencia
independiente; no se fabrica para completar cobertura.

## Estado editorial y gates antes de producción

`DESIGN-CANDIDATE-APPROVED` aprueba intención, no contenido ejecutable. Ninguna
Template es `math_reviewed`, `playtest_ready` ni `production_ready`. Antes de
avanzar debe especificar parámetros, unidades, precisión/redondeo, evaluador,
soluciones alternativas, invariantes, feedback, variantes y señales independientes;
usar una interacción existente o elevar una decisión; pasar revisión matemática y
editorial; validar al menos el barrido de seeds definido por el pipeline; y
verificarse en 360 px y por teclado.

Después de implementar 1.º se ejecuta el
[audit obligatorio](../04-quality/post-grade-1-scalability-audit.md) antes de
autorizar implementación amplia de 2.º–5.º. La semántica de dos obligaciones bajo
un repaso máximo queda deliberadamente abierta hasta esa evidencia.
