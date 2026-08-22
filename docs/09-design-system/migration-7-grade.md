# Migración de 7.º grado

El slice jugable de 7.º grado se migró entero al sistema de diseño. No quedó estilo improvisado en ninguna pantalla del juego.

## De dónde se venía

El estado anterior tenía dos paletas peleadas: el CSS global pintaba un lienzo crema con un degradado terracota, y los componentes usaban `slate-*` de Tailwind. Ningún color venía de una decisión de marca. La tipografía era `Arial, Helvetica, sans-serif`. Había 27 usos distintos de utilidades de color crudo, tres radios sin criterio y ocho tamaños de texto.

## Mapa

| Antes | Ahora |
|---|---|
| `<h1>` suelto con el nombre de la etapa | `StageHeader` |
| barra de progreso a mano | `StageProgress` sobre `Progress` |
| lista de estadísticas en `dl` | `StatRow` sobre `StatIndicator` |
| `<article>` del desafío | `SituationCard` |
| `<section>` narrativa | `NarrativeCard` |
| `DataList` dentro del renderer | `MetricGroup` y `MetricRows` |
| label con radio y clases repetidas | `ChoiceCard` |
| panel de feedback con clases `slate` | `FeedbackPanel` con los cuatro estados del motor |
| resumen del año con grilla a mano | `YearResult` sobre `Milestone` y `DataMetric` |
| botones con la misma cadena de clases copiada nueve veces | `Button` |
| `input` numérico con clases propias | `NumberField` y `QuantityStepper` |
| aviso del harness | `Callout` |
| portada con clases sueltas | `Wordmark`, tokens y `Button` |

No conviven dos sistemas: el viejo se eliminó.

## Lo que la migración encontró

Ninguna de estas cosas se vio revisando el diff. Todas aparecieron al mirar la pantalla o al correr un gate.

- **Botones primarios con tinta oscura sobre verde.** `tailwind-merge` no reconocía `text-heading` como tamaño, lo clasificaba como color y borraba `text-primary-foreground`. No fallaba ningún test ni ningún tipo. Ahora hay grupos declarados y un test que los cubre.
- **Verde de marca en 4,27:1 con texto blanco.** El gate de contraste lo bloqueó antes de que llegara a una pantalla.
- **Dos bordes de feedback en 1,5:1.** Servían para distinguir estados y no se veían.
- **El título del cierre de año, ilegible 320 ms.** La animación de entrada arrancaba en opacidad cero y axe lo marcó como falla de contraste, con razón. Ahora mueve pero no desvanece.
- **El campo de cantidad sin nombre accesible.** Lo expuso el escaneo de la vitrina. Se arregló en la primitiva, haciendo el nombre obligatorio en el tipo, y no en el ejemplo.
- **La pantalla de juego sin `h1`.** El encabezado de etapa había quedado como `span`.
- **El manifiesto PWA con la paleta vieja.** Lo encontró el guardarraíl de tokens.

## Comportamiento del juego

La migración no tocó matemática, evaluación de desafíos, reglas de storylets, determinismo, scoring, progresión ni protocolo de replay. Los 5.000 runs deterministas y los tests de motor, contenido, replay y propiedades siguen dando lo mismo que antes.

## Qué tiene que decidir quien implemente 1.º año

Visualmente, casi nada:

- elegir primitivas de juego que ya existen;
- componer los layouts que ya existen;
- escribir contenido;
- agregar un renderer sólo si aparece una interacción realmente nueva;
- agregar un token o un componente sólo ante un requerimiento repetido y genuinamente nuevo.

Lo que **no** tiene que decidir: qué verde, qué radio de tarjeta, qué estilo de botón, qué caja de feedback, cómo se ve el foco, cómo se muestra un número. Si algo de eso vuelve a ser necesario, el sistema está incompleto.
