# Assets

Qué arte existe, qué está briefeado y no producido, y qué es deliberadamente texto.

Presupuesto total del sistema: **6–9 raster · 6–12 pictogramas · 1 wordmark · 1 ícono de app · 1 lenguaje de hito.** No es una limitación de recursos: es la posición de arte. Egresado es un juego cuya UI ya es su identidad visual, y si una pantalla funciona sin imagen, sale sin imagen.

## Producido y en el código

| Asset | Cómo está hecho |
|---|---|
| Wordmark | Schibsted Grotesk 800 con tracking −0,03em |
| Lenguaje de hito | CSS: numeral + tilde + sello + confeti |
| EstiloTriangle | SVG inline, data-driven |
| Marcas de corrección | SVG inline con `currentColor` |
| Bloque de Aura con brackets | CSS |
| Signos de los steppers | dos barras de CSS |

**El wordmark no es una imagen.** Escala libre, recolorea por token, sin pipeline de assets, y sigue siendo texto seleccionable y buscable. Sólo haría falta un SVG para favicon y OG, donde no se puede usar texto — el concepto es un tilde verde sobre papel cuadriculado, y todavía no está dibujado.

## Raster — briefeado, **no generado**

Ninguna de las ocho imágenes existe, y **ninguna pantalla las necesita**: todo el slice de 7.º corre con cero imágenes. El pack es enriquecimiento, nunca estructura. Si se produce, entra por `SceneMedia` y por ningún otro lado.

Spec compartido: 16:9 (1600×900), WebP, ≤120 KB, sin texto, sin logos, sin marcas legibles, contexto de secundaria argentina.

Estilo compartido: fotográfico-editorial levemente estilizado · poco ruido visual · una acción focal clara · composición simple · luz natural · algo desaturado. **No** hiperreal-glossy-AI, **no** anime, **no** render 3D, **no** cartoon infantil.

Negativo compartido: `texto, letras, números, watermark, logo, marcas de marca, escudo escolar, insignia de uniforme, cartoon, anime, render 3D, estética AI brillante, HDR, lens flare, composición cargada, caras en foco`.

| ID | Dónde | Sujeto | Foco |
|---|---|---|---|
| `scene.bus` | Colectivo | parada vacía, mañana temprano, vereda mojada, una figura de espaldas | tercio izq. |
| `scene.mural` | Mural | pared exterior sin pintar, lona en el piso, latas cerradas | centro |
| `scene.notebook` | Cuaderno | estante de librería, cuadernos apilados, precios ilegibles | centro-der. |
| `scene.group` | Proyecto | cuatro sillas en ronda, papeles en el piso, sin gente | centro |
| `scene.fair` | Feria | stand a medio armar en el patio al atardecer, guirnalda apagada | centro |
| `scene.acto` | Acto escolar | escenario escolar vacío, sillas plegables, telón entreabierto | centro |
| `scene.hall` | Storylet | pasillo vacío, luz de tarde | punto de fuga |
| `milestone.7mo` | Cierre 7.º | patio desde arriba, sombras largas, fin del día | centro |

Notar el patrón: **casi ninguna tiene personas en foco.** Lugares, no personajes — que es lo que mantiene el presupuesto en ocho imágenes y evita cualquier pipeline de consistencia de personaje.

**Alt-text:** describir el *lugar y el momento*, nunca la mecánica. «Una parada de colectivo vacía a la mañana temprano», no «el desafío del colectivo».

## Pictogramas — 8 planeados, ninguno dibujado

`año · tiempo · plata · equipo · proyecto · logro · decisión · transporte`

24×24, trazo 2 px, terminación cuadrada, `currentColor`, dibujados sobre grilla de 2 px para acompañar la geometría de radio 0. SVG de React inline: no archivos, no icon font.

Diferidos a propósito. El prototipo no necesitó ninguno, y dibujar iconos antes de que una pantalla los pida es cómo se podrean las librerías.

## Audio — 8 briefs, nada producido

Limpio, táctil, moderno, algo lúdico. **No** casino, arcade, mobile-ad ni corporativo. Todos ≤400 ms salvo el cierre. WebM/Opus + MP3, ≤15 KB cada uno.

| ID | Brief |
|---|---|
| `sfx.select` | tick de madera suave, 40 ms, sin tono |
| `sfx.confirm` | golpe de madera de dos tonos ascendente, 120 ms |
| `sfx.continue` | tick bajo único, 60 ms, más callado que select |
| `sfx.optimal` | marimba de tres notas ascendente, 320 ms, mayor |
| `sfx.insufficient` | tono bajo apagado único, 260 ms. Suave, **no** un buzzer |
| `sfx.progress` | barrido filtrado corto, 180 ms |
| `sfx.storylet` | roce de papel al pasar, 200 ms |
| `sfx.yearComplete` | frase de cuatro notas + shaker liviano, 1200 ms |

Loop opcional: marimba y contrabajo, escaso, 90 BPM, ≤60 s, −18 LUFS, tiene que quedar debajo de la voz. Sale muteado por defecto con toggle persistente.

## Deliberadamente NO ilustrado

Todo estado de UI · todos los paneles de resultado · el cierre de etapa · Estilo · Aura · el wordmark · el progreso · los cuatro patrones de interacción.

## Dónde van si se producen

```text
public/assets/scenes/*.webp
public/assets/milestones/*.webp
```

Siempre vía `SceneMedia`, nunca con `priority` —precargar el arte de un desafío que todavía no apareció le roba ancho de banda a la pantalla que el jugador está mirando— y nunca cargados desde una ruta que no sea `public/`.

## Referencias visuales aprobadas

Las capturas del diseño aprobado viven en [`reference/`](reference/). Son la línea de base contra la que se validó la implementación de v0.2 y siguen siendo el patrón contra el que mirar una pantalla nueva.

| Archivo | Qué muestra | Qué fijar de ahí |
|---|---|---|
| `apertura.png` | beat narrativo de apertura | eyebrow, título en caja mixta, primario al fondo del shell |
| `colectivo-sin-resolver.png` | situación con la decisión pendiente | grilla de datos, subrayado rojo de la restricción, bloque oscuro a sangre |
| `colectivo-resuelto.png` | la misma, resuelta como Parcial | opciones resueltas, pestaña de resultado pegada al bloque, ledger, sello |
| `mural-resuelto.png` | situación académica resuelta como Óptimo | tira de carrera con Promedio, marca de corrección verde, chips |
| `grilla-25-de-mayo.png` | interacción de grilla con Aura | celdas resueltas por forma, bloque negro de Aura |
| `cierre-de-etapa.png` | cierre de año completo | numeral, registro, Estilo expandido, arquetipo y sello |

Dos advertencias al mirarlas:

- **`grilla-25-de-mayo.png` es contenido de diseño, no de producto.** El acto del 25 de Mayo está marcado como provisional en el propio prototipo y no está autorado en el motor; es también el evento que introduce Aura. Sirve como referencia del patrón de grilla y del bloque de Aura, no como contenido a implementar. Ver la pregunta abierta 35.
- Los detalles de contenido difieren de la implementación —títulos, cantidad de eventos, la variante de demora que salga por seed— porque el contenido autorado manda sobre el mockup. Lo que estas capturas fijan es el **sistema**: superficie, geometría, jerarquía y tratamiento del dato.
