# Componentes de juego

Viven en `src/components/game/`. A diferencia de las primitivas de UI, éstos **sí** conocen el dominio: una etapa, una situación matemática, un momento narrativo, el resultado de una decisión. Están construidos componiendo primitivas de UI.

Ninguno contiene reglas de juego. Todos formatean lo que devolvió el motor.

## GameCanvas y GameShell

`GameCanvas` impone la geometría: ancho de juego, márgenes con safe area, ritmo vertical. `GameShell` arma la partida: encabezado, progreso, estadísticas y el contenido que corresponda a la fase que devolvió el motor.

`GameShell` **no sabe nada de ningún desafío**. Elige entre feedback, desafío, momento narrativo o cierre según el estado, y nada más.

## StageHeader y StageProgress

El nombre de la etapa es el `<h1>` de la pantalla de juego. Se ve como una etiqueta chica, pero estructuralmente es el encabezado principal: una página sin `h1` deja a quien navega por encabezados sin punto de entrada.

`StageProgress` deriva del estado del motor y **no tiene ninguna cantidad de eventos escrita adentro**. Una etapa de siete y una de doce lo usan igual. La barra y el texto dicen lo mismo, que es el punto: el avance no puede depender de percibir una longitud.

## StatIndicator

Las estadísticas van deliberadamente calladas: son contexto, no la tarea. Mientras alguien resuelve una cuenta, cuatro números grandes arriba de la pantalla sólo gastan memoria de trabajo.

La barra va en gris y no en verde a propósito: cuatro barras verdes le compiten atención al progreso y al botón de acción, que son los dos lugares donde el verde sí significa algo.

## SituationCard

Una de las piezas más importantes del producto. Impone el orden en que se entiende un desafío: contexto, datos, consigna, acción. La jerarquía es tipográfica para que se pueda captar de un vistazo sin leer todo.

No decora. Un desafío ya exige atención y cada borde de más se la resta.

## NarrativeCard

Un momento narrativo tiene que leerse como historia y no como problema, **sin que haga falta un cartel que diga «NARRATIVA»**. La diferencia la hacen la forma y la tipografía, no una estética aparte: sin tarjeta blanca, con una regla roja al costado y el texto más aireado.

El rojo acá es acento de marca —algo que pasa— y no significa error.

## DataMetric, MetricGroup y MetricRows

- **DataMetric**: un hecho cuantitativo. Rótulo arriba, valor abajo, unidad y nota opcionales.
- **MetricGroup**: varios datos comparables, en dos columnas desde 360 px. Un dato impar al final ocupa el ancho entero: suelto a media caja se ve como un error de maquetación.
- **MetricRows**: pares rótulo/valor en una línea, para listas que se recorren de arriba a abajo —los números que explican una consecuencia— y no se comparan de a pares.

## FeedbackPanel

El vocabulario es el del motor: `optimal`, `efficient`, `functional`, `invalid`. Acá no hay «correcto» ni «incorrecto».

Cada resultado se distingue por tres cosas a la vez: un nombre escrito, un ícono con forma propia y un tono. Nunca por el color solo. Cada uno lleva además una frase que explica qué significa, sin retar a nadie.

Un test verifica que el panel no use jamás vocabulario de examen.

## Milestone

Cerrar un año es el único momento donde la marca puede subir el volumen, y el único lugar con animación de entrada. Sirve para «Tu 7.º grado» hoy y para «Egresado» cuando exista, sin cambiar de forma.

La animación **mueve pero no desvanece**: arrancar en opacidad cero dejaba el título ilegible durante 320 ms, y un escaneo de accesibilidad lo marcaba como falla de contraste con razón.

## YearResult

El cierre del año que se jugó, no una tarjeta de egreso: el perfil definitivo pertenece a la carrera completa y no se inventa acá. Todo sale del estado del motor.

Los momentos del año se nombran con el título del storylet, nunca con su identificador.

## Interacciones

Están en `src/components/game/interactions/` y se despachan desde `interaction-area.tsx`, cuyo `switch` exhaustivo **es** el registro: agregar un tipo de interacción al motor hace que ese archivo no compile hasta que exista un renderer.

| Renderer | Compone |
|---|---|
| `OptionGroup` | `ChoiceCard` dentro de un `fieldset` |
| `NumericAnswer` | `NumberField` más un slider grueso atado al mismo valor |
| `BudgetBuilder` | filas con precio unitario y `QuantityStepper` |
| `AssignmentBoard` | lista de personas visible más un `select` por tarea |

Ninguno evalúa nada. Juntan un borrador y lo mandan al motor.

Dos decisiones que vale la pena no revertir:

- **El presupuesto no muestra el total.** Calcularlo es el desafío.
- **La asignación muestra quién puede hacer qué arriba de las tareas.** Metido sólo dentro de las opciones del `select`, el dato queda truncado en un teléfono y la decisión se vuelve adivinanza.
