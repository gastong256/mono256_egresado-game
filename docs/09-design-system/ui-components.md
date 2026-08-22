# Componentes de UI

Viven en `src/components/ui/` y se importan desde `@/components/ui`. No saben nada del dominio: no conocen desafíos, storylets ni etapas. Esa ignorancia es lo que los hace reutilizables.

Las props están tipadas en TypeScript; acá va lo que el tipo no dice.

## Button

Un `<button>` nativo. Las variantes describen **jerarquía**, no color.

| Variante | Cuándo |
|---|---|
| `primary` | la acción de la pantalla. Verde de marca |
| `secondary` | una alternativa real: «Empezar de nuevo» |
| `ghost` | una acción de baja prioridad que no debería competir |
| `danger` | destruye algo del jugador |

Tamaños `sm`, `md`, `lg`. En el juego, la acción principal va `lg` y `block`.

Una pantalla tiene **una sola** acción primaria. Tres botones verdes seguidos no son tres acciones importantes: son ninguna.

`type` es `button` por defecto. Un botón dentro de un formulario lo enviaría sin querer; para eso hay que pedir `type="submit"` explícitamente.

## Surface

La caja estructural: fondo, borde, radio, relleno. Tonos `default`, `muted`, `raised`, `plain`.

No es responsable de ningún significado de dominio. Si necesitás una superficie que además diga algo —una situación, un resultado—, componé una primitiva de juego sobre `Surface` en lugar de agregarle una variante.

Acepta `as` para cambiar de elemento sin perder los atributos.

## Badge

Etiqueta corta: «7.º GRADO», «Evento 3 de 7», «Beta». Tonos `neutral`, `brand`, `accent`, `outline`, `inverse`.

Ninguna variante se distingue sólo por color: todas llevan borde propio y el texto siempre dice lo que la etiqueta significa.

## TextField y NumberField

Etiqueta visible, control, y ayuda o error asociados por `aria-describedby`.

**El placeholder no hace de etiqueta.** Desaparece justo cuando la persona escribe y necesita recordar qué le pedían.

El error reemplaza a la ayuda —dos textos compitiendo confunden—, se anuncia con `role="alert"` y marca `aria-invalid`.

`NumberField` abre teclado decimal en el teléfono y muestra la unidad al costado, no adentro del campo. **No valida matemática**: el parseo exacto lo hace el motor sobre racionales, y lo que se escribió es lo que se evalúa.

## QuantityStepper

Campo numérico con dos botones de 44 px. Los botones existen porque las flechitas nativas de un `input[type=number]` son inusables con el pulgar.

Los tres nombres accesibles —campo, restar, sumar— son **props requeridas**. No es una opción: un input numérico sin etiqueta es una violación crítica, y dejar que el componente se pueda usar mal es dejar que el bug exista. Esta regla salió de un escaneo que encontró exactamente ese caso en la vitrina.

## ChoiceCard

Una opción elegible. Por dentro es un radio nativo dentro de su label: el grupo se recorre con flechas y se selecciona con espacio.

El radio se restila con `appearance-none` pero **sigue visible y sigue siendo el blanco del clic**. Esconderlo con `sr-only` rompía dos cosas: el anillo de foco se dibuja sobre el control, y un control de 1 px no recibe bien el puntero.

El estado seleccionado es neutro y nunca verde. Ver [colores](colors.md#elegir-no-es-acertar).

## Progress

Un `<progress>` nativo: trae rol, valor y máximo sin ARIA a mano. La pista y el relleno se pintan con variantes arbitrarias sobre los pseudo-elementos, que es una de las pocas excepciones legítimas a la regla de no usar valores arbitrarios.

## Separator, Callout y Wordmark

- **Separator**: `<hr>` decorativo, fuera del árbol de accesibilidad. Existe para que no haya doce variantes de `border-t` sueltas.
- **Callout**: información **fuera** del bucle de juego. No es el panel de feedback: el resultado de una decisión tiene su propio componente porque tiene su propio vocabulario.
- **Wordmark**: el nombre con un punto verde. El punto es decorativo; quien escucha la página oye «Egresado».

## Lo que no existe todavía

- **IconButton**: no hay ningún botón de sólo ícono fuera de `QuantityStepper`, que ya resuelve el suyo. Se crea cuando haya un segundo caso.
- **Dialog, Popover, Tooltip, Select propio**: ninguna interacción actual los necesita. Cuando aparezca uno, la conversación empieza por Radix y no por escribirlo a mano.
