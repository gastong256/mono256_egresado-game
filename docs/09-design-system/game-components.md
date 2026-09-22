# Primitivas de juego

Viven en `src/components/game/`. Conocen el dominio: leen `RunState`, `CareerState` y `PendingFeedback`. **Formatean; no calculan ninguna regla.**

## GameSheet, StageHeader, SceneColumn, ActionSlot

El shell. Una columna de 412 px centrada, con `.eg-canvas` y una regla de 1 px alrededor.

`SceneColumn` tiene altura mínima y `ActionSlot` se ancla con `margin-top: auto`, así el primario cae siempre en el mismo lugar. El `-18px` inferior del bloque de decisión está calculado contra el padding de la columna: los dos se mueven juntos o ninguno.

## CareerStrip

El HUD, de 46 px. `Promedio | Equipo | Aura | [triángulo]`.

**Arranca vacía.** Cada celda aparece la primera vez que su dimensión se toca. Eso no es una animación de entrada: es la diferencia entre `null` y 0 ([ADR-016](../03-architecture/adr/ADR-016-career-player-model.md)).

Promedio y Equipo son cajas de papel con borde de tinta; **Aura es un bloque negro con brackets** incluso a esta escala — es su firma a cualquier tamaño.

Estilo aparece como un glifo que abre el panel, y sólo cuando hay suficientes decisiones para que el triángulo signifique algo. Cambia demasiado lento para justificar píxeles en pleno desafío, y un triángulo compite con las cajas de dato por el instinto de «leer las formas».

## SituationCard y NarrativeCard

`SituationCard` impone el orden en que se entiende un desafío y no lo deja a la maquetación:

```text
contexto → datos → consigna → interacción → resultado
```

La consigna **no** vive en la tarjeta: vive arriba de las opciones, dentro del bloque oscuro, porque la pregunta y la elección tienen que leerse juntas.

`NarrativeCard` tiene que leerse como historia y no como problema, sin un cartel que diga «NARRATIVA». La diferencia la hacen la forma y la tipografía: sin grilla de datos, sin bloque oscuro, prosa un punto más grande.

## DecisionBlock

La única superficie oscura del juego además de Aura. Sangra hasta los bordes del shell con márgenes negativos: un bloque oscuro con papel a los costados se leería como una tarjeta más, y lo que tiene que leerse es «la pantalla cambió de modo».

Es un `<fieldset>` nombrado con `aria-labelledby` y no con un `<legend>`. Un legend se renderiza sobre el borde del fieldset, fuera del relleno, así que sobre un bloque a sangre la consigna quedaba flotando medio afuera. El nombre accesible es el mismo.

## FeedbackPanel

Convierte un resultado en **consecuencia**, no en veredicto. Pestaña → glifo + palabra + sello → ledger con la cuenta real → comparación → consecuencia → chips → bloque de Aura opcional.

Tres reglas que existe para sostener:

1. el ledger **siempre** muestra la aritmética real;
2. los chips muestran **sólo** lo que se movió — `Promedio +0` no es representable;
3. el bloque de Aura aparece **sólo** si Aura cambió.

Un `Insuficiente` nunca bloquea: tiene consecuencia y el juego sigue.

## EstiloTriangle

SVG inline y aritmética, sin librería de charting: un radar de tres puntos son cuatro polígonos y un círculo, e importar 40 kB para eso sería pagar un peaje por no escribir doce líneas.

Los ejes se distinguen por **patrón de trazo** —lleno, guionado, punteado—, no por tres colores inventados. El polígono es el mismo verde hacia donde sea que se incline: ningún eje es el malo.

**El dibujo nunca es la única lectura.** El label accesible dice los tres porcentajes y el panel los imprime al lado.

## AuraBlock, AuraCell, AuraChip

Cuatro magnitudes, todas sobre negro y todas con brackets. Nunca una barra, nunca un porcentaje, siempre con signo explícito. Sin rodillo de casino y sin shake en las pérdidas: una pérdida pica por ser silenciosa.

## CareerChips

Un chip por dimensión que se movió. La ausencia de una clave en el reporte del motor hace que el cero no sea representable — no es una regla que el componente tenga que recordar.

## Milestone, ArchetypeStamp, MemorablePanel, Confetti

El único momento del juego donde la marca sube el volumen, y por eso el único que usa el numeral de 66 px, el tilde grande, el sello rotado y el confeti. Si esa gramática apareciera en una pantalla de desafío, dejaría de significar «terminaste un año».

Dice **«vas camino a»** y no «sos»: 7.º es el primero de seis años, y un veredicto cerrado sobre alguien de doce años sería el lenguaje clínico que el GDD prohíbe.

## SceneMedia

Todo el tratamiento de imagen vive acá y no se repite por pantalla: caja 16:9 en todos los anchos, `object-fit: cover`, foco por `object-position`, filete de 1 px, radio 0, sin filtro de color. La caja reserva su alto con `aspect-ratio` antes de que la imagen llegue; nunca se precarga.

`ChallengeFrame` la monta **entre el título y la prosa** de la situación cuando el registro de presentación (`scene-registry.ts`) tiene una escena para la Template: primero se nombra el evento, después se ve el lugar, y recién entonces se lee lo que pasa, con prosa, datos y decisión contiguos. Un Repaso no la lleva. El `alt` es vacío por defecto porque el eyebrow, el título y la prosa ya sitúan la escena; se pasa texto sólo cuando la imagen dice algo que el texto no dice.

## StageHeader: progreso de la etapa

Las celdas cuentan la **etapa** que nombra el encabezado, con la duración del
plan cuando la run está compuesta; un repaso agrega su celda cuando se abre. Si
un año largo no entra, las celdas se angostan en vez de empujar la hoja fuera de
una pantalla de 360 px. La lectura accesible sigue siendo «Evento n de m».

## Modos constructivos de 1.º

Tres renderers de `src/components/game/interactions/`, sobre las mismas reglas:
controles nativos —campos de cantidad con botones de 44 px y `select`— como vía
principal, nada que arrastrar, un borrador que se confirma entero y una vista
que **dibuja lo elegido sin juzgarlo**. Ninguno suma, convierte ni valida.

- **QuantityBuilder** — cantidades de un plan. Sin total corriente: sumarlo es el
  desafío. En una distribución (la rueda) agrega sus posiciones: cada una lleva
  escrito el código de su categoría y las libres tienen borde punteado.
- **ScheduleBuilder** — un inicio por actividad y la vista de la tarde en
  columnas por lugar, filas de cinco minutos. No dibuja viajes ni preparaciones,
  que son la cuenta; la lista «Agenda elegida» dice lo mismo por escrito.
- **SpatialLayout** — el plano como tabla de coordenadas. Cada celda escribe el
  código del objeto que la ocupa o la marca de lo que ya estaba (`col`, `pas`,
  `pta`), con referencias al pie; dos objetos en una celda se escriben juntos y
  engrosan el borde, sin llamarlo error. Una región que scrollea es alcanzable
  por teclado.

## Notas del Repaso

Antes del único repaso del año, un bloque dice qué concepto se practica y lista
«Para recordar» los que sólo se explican. Es texto del contenido: el motor no
decide la prosa, sólo cuál nota es cuál.
