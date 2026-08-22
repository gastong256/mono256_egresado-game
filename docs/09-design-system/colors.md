# Color

## La paleta

Cuatro familias: **verde**, **rojo**, **gris** y **blanco**. No hay una quinta. La paleta por defecto de Tailwind está apagada ([ADR-015](../03-architecture/adr/ADR-015-design-system-tokens.md)), así que `bg-blue-500` no genera nada.

Las tres rampas están definidas en OKLCH y **comparten exactamente la misma rampa de luminosidad**. Eso es lo que hace que se sientan de la misma familia: `green-600` y `red-600` tienen el mismo peso visual, así que intercambiarlos no cambia la jerarquía de una pantalla, sólo su significado.

El gris no es gris de browser: lleva una traza mínima del tono verde. Al lado del verde de marca, un gris neutro puro se percibe violáceo.

## Reparto

Como criterio, no como fórmula:

```text
70–80%   blanco / gris / estructura neutra
15–20%   verde: acción primaria, progreso, marca
 5–10%   rojo: tensión narrativa, acento, estados críticos
```

El punto no es la proporción exacta. Es que el dato numérico —lo que hay que razonar— sea la señal más fuerte de la pantalla, y eso sólo pasa si el resto no compite. Una pantalla con cuatro barras verdes arriba y un botón verde abajo tiene cinco cosas peleando por el mismo lugar en la mirada.

## El verde

Es el color de marca. Se usa para:

- acción primaria;
- progreso y avance;
- el punto del wordmark;
- el hito de fin de año;
- foco.

**El verde no significa «respuesta correcta».** Egresado no es un examen de opción múltiple: una decisión puede ser óptima, eficiente, funcional o insuficiente, y esas cuatro cosas no se distinguen por cuánto verde tienen. El resultado lo dice el nombre escrito y el ícono; el color acompaña.

## El rojo

Es el acento de marca. Se usa para:

- tensión narrativa (la regla al costado de un momento de historia);
- énfasis puntual;
- el estado «no alcanzó».

Es visualmente poderoso y por eso escaso. Si todos los botones secundarios fueran rojos, dejaría de señalar nada.

### Acento no es destructivo

`accent` y `danger` salen los dos de la familia roja y son **tokens distintos a propósito**. `accent` es marca —algo que pasa en la historia—; `danger` es una acción que destruye algo del jugador. Si compartieran token, borrar una partida y un momento narrativo intenso se verían igual.

## El gris y el blanco

El gris es la estructura: lienzo, texto, metadatos, bordes, separadores, estados sin elegir, deshabilitado. El blanco es la superficie de contenido.

El lienzo es `gray-50` y no blanco puro: apenas más oscuro que las tarjetas, y eso solo ya hace que el contenido del juego se lea como algo apoyado encima, sin necesidad de sombras.

El gris más oscuro hace de tinta. No se usa negro puro.

## Elegir no es acertar

La regla más importante de este documento.

Antes de confirmar, el estado seleccionado usa **tinta neutra**: fondo `selected-surface`, borde `line-selected`, y el radio pasa de anillo fino a anillo grueso. Nunca verde.

Si seleccionar pintara la tarjeta de verde, el jugador deduciría que eligió bien antes de confirmar y la decisión dejaría de existir. Hay un test end-to-end que elige la primera y la última opción de un desafío real y verifica que los colores resultantes sean idénticos: una de las dos resuelve el problema y la otra no, y eso no puede notarse.

Después de que el motor evalúa, el panel de feedback sí comunica el resultado.

## Resultado de una decisión

El vocabulario es el del motor, no el de un examen:

| Estado | Tono | Ícono | Qué dice |
|---|---|---|---|
| `optimal` | verde, relleno intenso | premio | «Óptimo» |
| `efficient` | verde, relleno suave | círculo con tilde | «Eficiente» |
| `functional` | gris | tilde | «Funcionó» |
| `invalid` | rojo | triángulo | «No alcanzó» |

Óptimo y eficiente son los dos verdes: se distinguen por la intensidad del relleno **además** del ícono y del nombre. Los cuatro bordes llegan al contraste no textual: si un borde sirve para identificar un estado, tiene que verse.

## Qué no hacer

| No | Sí |
|---|---|
| `bg-green-600` en una pantalla | `bg-primary` |
| `text-gray-600` | `text-foreground-muted` |
| un hexadecimal escrito a mano | un token en `src/styles` |
| rojo para «respuesta incorrecta» | el estado `invalid`, con su nombre y su ícono |
| verde para «opción seleccionada» | el estado neutro de selección |
| distinguir dos estados sólo por color | color **más** nombre **más** forma |
| un gradiente como superficie base | superficie plana; el gradiente se reserva para un hito |

El guardarraíl `pnpm design:check` bloquea las cuatro primeras.
