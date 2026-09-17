# Diseño de Templates de 4.º — Responsabilidad

- **Etapa académica:** 4.º
- **Función narrativa:** responsabilidad
- **Estado:** `DESIGN-CANDIDATE-APPROVED` · checkpoint #2, 9 de septiembre de 2026
- **Implementación:** `IMPLEMENTED` en STAGE-08 (2026-09-16) como contenido de
  desarrollo; ver [implementación runtime](#implementación-runtime)

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
Los evaluadores, parámetros, feedback y variantes ya existen —ver abajo— y
siguen en estado `draft`: la revisión del Departamento de Matemática y el
pacing empírico son gates de producción. Aplican los
[requisitos editoriales de Phase 0](content-authoring-guide.md#diseño-aprobado-en-phase-0).

## Implementación runtime

Fuente: `src/content/grade-4/`. Mismas reglas que los años anteriores:
generación por restricción, gates de autoría en el pipeline, oráculo
independiente por evaluador y materialización sólo de direcciones aprobadas.

| Template | Formas semánticas | Escalera 100/75/40/10 | Equipo / Aura / Estilo |
|---|---|---|---|
| `y4.shift-coverage` | Dos puestos en tres bloques seguidos y cuatro personas con disponibilidad por bloque; formas `llega-tarde`, `se-va-temprano` y `todos-parciales` | INVALID puesto vacío, choque de hora o alguien que no está · FUNCTIONAL cierra pero alguien se queda las tres horas · EFFICIENT todos descansan · OPTIMAL además ningún puesto cambia de manos más de una vez | **Equipo** 0–3 por los acuerdos del grupo, leído entre cronogramas que ya cierran (`LOCKED`) |
| `y4.course-project-fundraiser` | Costo fijo, tres cosas para vender con su costo, precio y minutos de cocina, un objetivo y un colchón; formas `cocina-corta`, `objetivo-alto` y `margen-parejo`. La consigna nombra las tres condiciones en orden —no perder plata, llegar al objetivo, llegar con el colchón—, explica el punto de equilibrio en palabras y dice que todo lo que se prepara se vende | INVALID se pasa de cocina o pierde plata · FUNCTIONAL cubre costos · EFFICIENT llega al objetivo · OPTIMAL llega con el colchón | Sin Equipo ni Aura. Estilo por la forma de la producción |
| `y4.school-event-flow` | Tres puestos en fila con su tasa y lo que suma cada ayudante; formas `puerta-lenta`, `acreditacion-lenta` y `buffet-lento` | INVALID la cola crece o reparte ayudantes que no hay · FUNCTIONAL alcanza el ritmo pedido · EFFICIENT llega a la mitad del margen posible · OPTIMAL el mejor ritmo alcanzable | Ninguno: la consecuencia sobre otra gente se ve, pero no se cobra como gesto social |
| `y4.event-floor-plan` | Salón con puerta, pasillo y a veces columnas; escenario, tres mesas y una barra; formas `salon-angosto`, `puerta-al-medio` y `con-columnas` | INVALID se sale, se pisa, tapa el pasillo, no sienta a todos o deja una zona encerrada · FUNCTIONAL entra y se circula · EFFICIENT además sobra lugar para una mesa más **o** entra la barra · OPTIMAL las dos | Ninguno |
| `y4.represent-class` | Tres límites escritos —plata, minutos y lugar— y cinco propuestas; la situación declara a quién afecta lo que se propone. Toda variante tiene al menos dos propuestas viables, así que no llevar ninguna nunca es casi exacto | INVALID lleva al consejo algo que no entra · EFFICIENT deja una viable afuera · FUNCTIONAL deja dos o más —incluido no llevar ninguna, que la consecuencia narra como tal— · OPTIMAL exacta | **Aura** por la postura pública, leída de un campo distinto del de las etiquetas (`LOCKED`). Sin Equipo y sin Prestige |
| `y4.margin-review` | Costo fijo contra lo que deja cada bandeja | OPTIMAL las bandejas justas · FUNCTIONAL dividir por el precio · EFFICIENT una de diferencia · INVALID el resto | Sin Estilo ni score |
| `y4.spatial-capacity-review` | Salón, celdas reservadas y mesas de cuatro celdas | OPTIMAL descuenta lo reservado · FUNCTIONAL cuenta el salón entero · EFFICIENT una mesa de diferencia · INVALID el resto | Sin Estilo ni score |

**Banda y metadata.** `bandOf(cognitive)` da: turnos 4 → CORE; peña, cola y
consejo 7 → STANDARD; salón 8 → STRETCH; los dos Repasos 1 → CORE. Eso es
1 CORE / 3 STANDARD / 1 STRETCH, la distribución que pide la matriz. El cluster
`evento-escolar` lo declaran turnos, cola y salón, así que una run normal aporta
como máximo una de las tres.

**Externalidad, sin moraleja.** Las tres Templates del evento hacen visible que
la cuenta le pasa a otra gente —un puesto vacío, una cola que sale a la vereda,
gente parada— pero ninguna cobra Equipo por eso: repartir bien los ayudantes es
una cuenta, no un gesto. Equipo aparece sólo donde hay preferencias de otras
personas que medir, que es `shift-coverage`.

**`represent-class` y el rol `special`.** La oportunidad se agenda con el rol
`special`, que la composición usa **en lugar de** una secundaria compatible: el
año sigue teniendo dos beats ordinarios y el techo de FairScore no se mueve. La
elegibilidad condicional por varios caminos y la evidencia de Prestige quedan
para la integración de carrera completa, donde la orquestación de rareza se
implementa una sola vez (D-S08-067); hoy la Template no otorga Prestige y
aparecer vale cero, que es lo que el diseño exige.

**Motor de interacción de la cola.** El diseño la dirige a `Spatial / Graph
Canvas`; la implementación usa el motor `Allocate / Constrain`, porque la
respuesta es un reparto de ayudantes entre puestos y forzarla a un lienzo de red
distorsionaría la matemática sin agregar nada. La ficha declara que sus nombres
de interacción son modos, no capacidades runtime. La familia de razonamiento sí
estrena `SYSTEMS_OPTIMIZATION`, que ninguna Template usaba.

**Catálogo `grade-4-dev-3`.** 853 entradas, construido con
`pnpm game:variants build --content=grade-4`; re-aprueba los años anteriores sin
tocar sus artefactos publicados. Reemplaza a `grade-4-dev-2` por la
[remediación matemática](../04-quality/mathematics-remediation-implementation.md): gate de dos propuestas viables en el consejo —una variante menos—, consigna
de la peña, dirección del error en los dos Repasos y feedback de la cola,
contenido `4.2.0-grade-4`. La práctica parcial `7.º → 4.º` es
`official: false`.
