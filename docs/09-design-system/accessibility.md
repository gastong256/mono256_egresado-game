# Accesibilidad

El objetivo declarado del proyecto es **WCAG 2.2 AA** para la interfaz principal. Este documento describe cómo el sistema de diseño lo sostiene. No es una certificación.

## Nativo primero

```text
HTML semántico
        ↓
primitiva headless accesible
        ↓
widget propio
```

En la práctica v0.1 no necesitó pasar del primer escalón. Un `<button>`, un `<input type="radio">` dentro de su `<label>`, un `<select>`, un `<progress>` y un `<fieldset>` con su `<legend>` resuelven todas las interacciones actuales, y traen teclado, semántica de grupo y anuncio para lectores de pantalla sin escribir ARIA.

Un `<div role="button">` por comodidad de estilo es una regresión, no una decisión de diseño.

## El color nunca solo

Rojo y verde son la combinación más común de daltonismo, y son los dos colores de marca de este juego. Por eso: **ninguna distinción con significado puede descansar sólo en el color**.

Cada estado lleva al menos dos señales más:

- el resultado de una decisión: nombre escrito + ícono de forma propia + tono;
- una opción elegida: grosor de borde + anillo del radio + `checked` real;
- el progreso: barra + «Evento 3 de 7» escrito;
- una estadística: barra + el número al lado;
- una restricción incumplida: la frase que la nombra.

## Contraste medido, no estimado

`pnpm design:check` convierte cada color OKLCH a sRGB y verifica las combinaciones que el producto pinta de verdad: 4,5:1 para texto normal y 3:1 para contorno de control y estado.

Es un gate y no una guía. Durante la construcción encontró tres fallas reales que a ojo pasaban por buenas: un verde primario en 4,27:1 con texto blanco, y dos bordes de feedback en 1,5:1 que no se veían.

Agregar una combinación nueva a la interfaz significa agregarla a esa lista.

## Foco y teclado

- Un único indicador de foco, con halo blanco para conservar contraste sobre cualquier superficie.
- El juego entero se recorre con teclado: nombre, opciones, campo numérico, slider, presupuesto, asignación, feedback y continuar.
- Al llegar el resultado, el foco se mueve al encabezado del feedback, así que la consecuencia es alcanzable antes que el botón de continuar.
- No hay trampas de foco ni controles inalcanzables.

## Anuncios

- El resultado de una decisión se anuncia con `role="alert"`.
- Los errores de formulario se anuncian y además marcan `aria-invalid`, así que no dependen de ver un borde rojo.
- Los íconos decorativos están fuera del árbol de accesibilidad; los botones de sólo ícono llevan nombre obligatorio por tipo.

## Movimiento

`prefers-reduced-motion: reduce` reduce toda transición y animación. Ninguna información existe sólo en el movimiento.

## Alternativa al arrastre

La regla de UX exige que arrastrar nunca sea la única forma de completar una tarea. El tablero de asignación se construyó **primero y sólo** con `select` nativos: funciona con teclado, con el dedo y con lector de pantalla. Si algún día se suma arrastre con puntero, será encima de ese mismo estado.

## Qué está automatizado

| Chequeo | Dónde |
|---|---|
| contraste de tokens | `pnpm design:check` |
| axe sobre las pantallas del juego | `tests/e2e/grade-7-slice.spec.ts` |
| axe sobre la vitrina | `tests/e2e/design-system.spec.ts` |
| semántica de las primitivas | `tests/component/ui-primitives.test.tsx` |
| estados sin depender del color | `tests/component/game-primitives.test.tsx` |
| selección que no revela el resultado | `tests/e2e/design-system.spec.ts` |
| sin desbordes a 360 px | ambos specs |
| foco visible y con halo | `tests/e2e/design-system.spec.ts` |

Cuando falla un escaneo, la aserción incluye el HTML del nodo: una falla de contraste que dice «1 nodo» obliga a reproducirla a mano.

Nada de esto reemplaza revisar a mano. Lo automatizado ataja regresiones; no dice si la pantalla se entiende.
