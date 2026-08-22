# Fundamentos

## Espaciado

No hay vocabulario propio de espaciado. La escala de Tailwind ya es coherente, y agregarle alias (`space-component`, `space-section`) sólo habría creado una segunda forma de decir lo mismo.

Lo que sí hay es intención. El espaciado es lo que agrupa:

```text
situación
    aire
datos
    juntos entre sí
consigna
    separada
interacción
    espacio de blanco alrededor de cada objetivo táctil
feedback
    frontera de estado nueva
```

Proximidad y región común hacen el trabajo que en otro sistema harían cuatro bordes más. Si dos cosas se leen como un grupo, no necesitan una caja.

## Layout

Egresado es mobile-first y portrait-first. El viewport de referencia es ~390×844, y se verifica desde 360 px.

- **Ancho de juego**: `max-w-game` (34 rem). En desktop el juego no se estira: leer un enunciado y comparar cuatro opciones no mejora a 1200 px de ancho.
- **`max-w-game-wide`** (44 rem) existe para una interacción que realmente necesite más aire horizontal en pantallas grandes. Hoy no la usa nadie.
- **Márgenes**: `px-gutter` incluye las safe areas del teléfono con `env()`. En un browser común `env()` vale 0, así que no agrega relleno inútil.
- **`pb-safe`** protege la acción principal de la barra de gestos.

`GameCanvas` es el componente que impone esta geometría. Una pantalla de juego no la vuelve a decidir.

## Radio

Cuatro valores con nombre:

| Token | Para qué |
|---|---|
| `rounded-control` | botones, campos, controles |
| `rounded-surface` | tarjetas, paneles, superficies |
| `rounded-card` | contenedores grandes de un estado, como el panel de feedback |
| `rounded-pill` | etiquetas, barras de progreso |

Los radios por defecto de Tailwind están apagados. Egresado usa esquinas redondeadas moderadas: lo bastante como para no verse a documento administrativo, no tanto como para verse a aplicación para nenes.

## Bordes

El diseño es predominantemente claro, así que el borde hace mucho más trabajo que la sombra.

| Token | Para qué | Contraste |
|---|---|---|
| `line` | separación estructural, borde de tarjeta | decorativo |
| `line-strong` | agrupación un poco más marcada | decorativo |
| `line-interactive` | contorno de un control: campo, botón secundario, radio | ≥ 3:1 |
| `line-selected` | lo que el jugador eligió | ≥ 3:1 |

La distinción importa: sólo el borde que **identifica un componente o un estado** tiene que llegar al contraste no textual. Un separador no.

## Elevación

Tres niveles y el vacío: `shadow-surface`, `shadow-raised`, `shadow-overlay`. La jerarquía sale antes del espaciado, del fondo, del borde y de la tipografía. Una tarjeta de juego no tiene por qué flotar como si fuera un modal.

## Movimiento

Tres duraciones con nombre —`motion-fast`, `motion-standard`, `motion-emphasized`— y dos curvas: `ease-standard` y `ease-emphasized`. Los tiempos están dentro de los 150–350 ms que fija la guía de UX, que también responde a una necesidad concreta: en una feria, una animación larga baja el throughput.

Se anima la selección, la llegada del feedback, el cambio de progreso, el estado de un botón y el hito de fin de año. Nada más.

`prefers-reduced-motion: reduce` está implementado desde el primer día y reduce toda transición y animación a un instante. **El significado nunca depende del movimiento**: el hito de fin de año se desplaza pero no se desvanece, justamente para que su título no quede ilegible mientras entra.

## Foco

Un solo tratamiento para todo el producto:

```text
anillo verde de 3 px
    separado 2 px del control
    con el hueco relleno de blanco
```

El halo blanco es lo que mantiene el anillo visible también sobre un botón verde o rojo, sin que cada componente invente el suyo. Está definido una vez, en `:focus-visible` de la capa base.

## Objetivos táctiles

Los controles importantes apuntan a 44×44 px o más, que es holgado respecto del mínimo de WCAG pero es lo que hace usable un juego con el pulgar. Entre acciones contiguas hay separación suficiente para no tocar la equivocada.
