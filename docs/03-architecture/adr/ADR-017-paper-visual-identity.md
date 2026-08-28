# ADR-017 — Identidad papel: la hoja cuadriculada como canvas del juego

- Estado: Aceptado
- Fecha: 2026-08-28
- Reemplaza parcialmente: [ADR-015](ADR-015-design-system-tokens.md)

## Contexto

El sistema de diseño v0.1 (ADR-015) resolvió el problema de gobernanza: una cadena de tokens en una sola dirección, la paleta de Tailwind apagada y el contraste como gate. Esa parte sigue en pie y esta decisión no la toca.

Lo que no resolvió fue la **identidad**. Una auditoría de similitud sobre v0.1 encontró que cuatro decisiones, juntas, producían la huella visual de un juego de carrera deportiva —el género de las referencias del proyecto, no el de Egresado—:

1. canvas oscuro en todas las pantallas;
2. tipografía display condensada en mayúsculas;
3. barra de progreso segmentada arriba;
4. CTA verde abajo.

La conclusión no fue «se parece un poco»: fue que una captura de Egresado y una captura de la referencia se leían como el mismo producto con otro tema. Para un juego cuyo cliente final es un colegio y que se presenta en una feria escolar, eso es un problema de producto, no de gusto.

El handoff de diseño v0.2 explora tres territorios visuales —*Boletín*, *Hoja cuadriculada*, *Legajo*— y cierra en un híbrido. La reconstrucción completa de esa historia vive en [decision-history](../../09-design-system/decision-history.md).

## Decisión

Se adopta la identidad papel de v0.2. Tres decisiones estructurales, más una que es de gobernanza.

### 1. La hoja cuadriculada es el fondo de toda pantalla

Celda de 16 px, dibujada con dos degradados lineales en la utilidad `.eg-canvas`. El fondo liso queda **reservado** para bloques insertados: caja de dato, ledger, sello, Aura, superficie de decisión.

La cuadrícula no es decoración: es el sistema de alineación con el que los datos se leen como objetos apoyados sobre una hoja en lugar de como párrafos. Y resuelve tres cosas de una: máxima distancia de las referencias con un solo cambio, credibilidad escolar, y la matemática se ve.

### 2. El oscuro sobrevive en dos lugares y en ninguno más

- **La superficie de decisión** (`#1C1E1B`), el bloque donde se elige.
- **El bloque de Aura** (`#0A0C0A`), la única isla negra del sistema.

Ese cambio de superficie **es** la transición de estado: la decisión pasa en oscuro y el resultado vuelve al papel, antes de que el color entre a jugar. Se conserva la mejor propiedad del canvas negro —el foco— acotada a los dos momentos que la necesitan.

### 3. Radio 0, sin sombras, y la marca de corrección como device

La profundidad la da el peso del borde y el contraste de fondo, igual que un impreso. `--radius-*` y `--shadow-*` quedan apagados y el guardarraíl rechaza cualquier `rounded-*` o `shadow-*` en código de producto; la única excepción es el resplandor de Aura, que no es sombra sino luz.

El device de la identidad es el **tilde verde y el subrayado rojo del docente**: la marca cae *sobre* el dato o la opción, nunca en un marco alrededor. Eso es exactamente lo que la separa de un frame deportivo, y por qué el subrayado de una restricción abraza la cifra en vez de cruzar la celda.

Cuatro colores con cuatro trabajos: verde escolar para estado, rojo corrección para tensión y restricción, lima para el CTA —y sólo para botones—, verde Aura sólo dentro del bloque negro. **Verde ≠ correcto y rojo ≠ incorrecto**: la calidad del resultado la llevan glifo, palabra y borde superior; el color sólo refuerza.

### 4. La paleta pasa de OKLCH a hexadecimal

ADR-015 definió la paleta en OKLCH porque era una rampa generada de tres familias que tenían que sentirse hermanas. La paleta v0.2 no es una rampa: es un set corto de pigmentos elegidos y medidos uno por uno, calibrados desde el entorno del colegio —camisa blanca, gris de franela, verde botella, rojo escocés— y validados de a uno contra WCAG.

Escribirlos en un espacio perceptual agregaría dígitos que nadie eligió. El gate de contraste se reescribió para leer hexadecimal; sigue midiendo sRGB y sigue siendo obligatorio.

**El logo, el escudo y el uniforme del colegio no aparecen en ninguna parte de Egresado.** El entorno sembró familias de tono; los colores muestreados no se usan literalmente en ningún lado.

## Dependencias

Entran las dos familias del handoff, servidas desde el repositorio con `next/font/local`:

| Fuente | Rol | Licencia |
|---|---|---|
| Schibsted Grotesk | títulos y datos | SIL OFL 1.1 |
| Libre Franklin | prosa | SIL OFL 1.1 |

El handoff sugiere `next/font/google`. Se eligió versionar los `.woff2` en `src/app/fonts/` porque da lo que la descarga en build no puede: bytes fijados en el repositorio, un build que no depende de que Google responda, y cero pedidos a un CDN en runtime. El resultado visual es idéntico y las dos licencias permiten la redistribución explícitamente; el texto de cada una viaja al lado del archivo.

Salen `geist` —la familia que reemplazan— y `lucide-react`. El pack de pictogramas está diferido a propósito: el prototipo no necesitó ninguno, y dibujar iconos antes de que una pantalla los pida es cómo se podrean las librerías. Los signos que sí hacían falta (más, menos, tilde, tachado) son cuatro formas de CSS y SVG inline con `currentColor`, dibujadas con terminación cuadrada para acompañar la geometría de radio 0.

## Consecuencias

- La escala tipográfica pasa de roles genéricos a diecinueve roles del sistema, cada uno con tamaño, interlínea, tracking y peso. Cada uno tiene que estar declarado en `cn()`, y hay un test que lo cubre.
- El guardarraíl de tokens gana dos reglas: radio y sombra. Las dos son binarias, no graduales.
- Un `<legend>` se renderiza sobre el borde de su `<fieldset>`, fuera del relleno, así que sobre un bloque oscuro a sangre la consigna quedaba flotando medio afuera. El bloque de decisión nombra su grupo con `aria-labelledby`; el nombre accesible es el mismo.
- El único token del handoff que la implementación reabrió es el contorno de control sobre pizarra: `#4A4E48` medía 1,98:1 y WCAG 2.2 SC 1.4.11 pide 3:1 para identificar un componente y su estado. Se movió lo mínimo para pasar. Todo el resto de la paleta entró tal cual.
- La vitrina de `/dev/design-system` se reescribió sobre el sistema nuevo y sigue siendo la referencia viva: mirarla antes de inventar una primitiva es más barato que descubrir la duplicación en revisión.
- El pack raster sigue **briefeado y no generado**, y ninguna pantalla del slice lo monta. `SceneMedia` existe para que la primera imagen que se produzca entre por un solo lugar. La apuesta UI-first se sostiene: todas las pantallas corren con cero imágenes.
