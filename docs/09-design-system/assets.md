# Assets

Qué arte existe, qué está briefeado y no producido, y qué es deliberadamente texto.

Presupuesto total del sistema: **1 hero · 24 escenas · 7 láminas narrativas · 6–12 pictogramas · 1 isotipo · 1 wordmark · íconos derivados · 1 imagen social · 1 lenguaje de hito.** No es una limitación de recursos: es la posición de arte. Egresado es un juego cuya UI ya es su identidad visual; las imágenes acompañan y ninguna pantalla depende de ellas para funcionar.

## Producido y en el código

| Asset | Cómo está hecho |
|---|---|
| Isotipo | SVG inline desde `src/lib/ui/brand-mark.ts` (`BrandMark`); la sumatoria con el birrete, el listón y el rombo verde |
| Lockup | `BrandLogo`: el isotipo apoyado en la línea base del wordmark |
| Wordmark | Schibsted Grotesk 800 con tracking −0,03em |
| Favicon e íconos | derivados del isotipo por `pnpm brand:build` (`src/app/favicon.ico`, `icon.svg`, `apple-icon.png`, `public/assets/brand/`) |
| Hero de la portada | `HomeHero`: la ilustración aprobada del recorrido, en dos WebP (`egresado-hero-{800,1200}.webp`, `pnpm brand:hero`) con `srcset`, caja 16:9 sin recorte, `alt=""` |
| Imagen social | `src/app/opengraph-image.jpg` (1200 × 630) compuesta por `pnpm brand:og` con el isotipo, la Schibsted real, la promesa de la portada y el hero; Next la publica en Open Graph y X/Twitter |
| Lenguaje de hito | CSS: numeral + tilde + sello + confeti |
| EstiloTriangle | SVG inline, data-driven |
| Marcas de corrección | SVG inline con `currentColor` |
| Bloque de Aura con brackets | CSS |
| Signos de los steppers | dos barras de CSS |

**El wordmark no es una imagen.** Escala libre, recolorea por token, sin pipeline de assets, y sigue siendo texto seleccionable y buscable.

**El isotipo sí es un dibujo, y es uno solo.** La sumatoria con el birrete encima, el listón a la derecha y el rombo en verde escolar: matemática, trayectoria y egreso en una marca. Lo aprobó el Product Owner en RC3 sobre una referencia raster y se reconstruyó geométricamente —tres direcciones de trazo, dos grosores, caja de 200 × 240— en `src/lib/ui/brand-mark.ts`. De ese módulo salen el componente inline, los tres SVG de `public/assets/brand/` (principal, mono y reversa) y todos los íconos raster; a 16–48 px usa una construcción más simple del mismo símbolo, no otro. Un test comprueba que lo versionado es exactamente lo que el módulo produce.

**El hero es la única ilustración de la portada.** La misma dirección «Trayectoria en papel» que las escenas —la entrada a la escuela, el grupo, la mano que ayuda, el egreso arriba a la derecha—, aprobada por el Product Owner sobre un source de 1672 × 941 y servida como dos WebP de 800 y 1200 px que el `srcset` elige por DPR y ancho real (256–440 px CSS). Vive en la columna de la marca, nunca sobre la acción: en un teléfono va después de «Jugar ahora», y desde `sm` debajo de la promesa, con la CTA a la derecha. No se recorta en ningún ancho porque la trayectoria ocupa la lámina entera. La imagen social se compone desde él, el isotipo y la tipografía real; no es una ilustración aparte.

## Raster — escenas de situación, integradas

Veinticuatro ilustraciones acompañan a las veintiocho Templates públicas de la carrera, bajo la dirección «Trayectoria en papel» del sprint RC3: ilustración editorial de formas planas, papel, tinta, verde botella y rojo puntual, sin texto ni cifras dentro de la imagen. Una escena por **situación visual** —las dos preguntas del colectivo comparten la parada; salón, cola y turnos del evento comparten el salón antes de abrir—, ninguna en un Repaso y ninguna para las Templates de 7.º que la carrera pública no alcanza.

Viven en `public/assets/scenes/*.webp`, a 1600×900 y entre 100 y 165 KB cada una; el mapping Template → escena es `src/components/game/scene-registry.ts` y la única puerta de entrada al layout sigue siendo `SceneMedia`, montada por `ChallengeFrame` entre el título y la prosa. **Ninguna pantalla las necesita**: una situación sin imagen —o sin red— sigue completa, y el motor no sabe que existen. La reconciliación con los originales, la optimización y las decisiones de UX están documentadas en el handoff local de RC3 (`.tmp/rc3-branding/`).

Spec compartido: 16:9 (1600×900), WebP, ≈100–250 KB priorizando calidad, sin texto, sin logos, sin marcas legibles, contexto de secundaria argentina.

### Brief histórico (v0.2, fotográfico)

El brief siguiente es el de v0.2 y **quedó superado** por la dirección ilustrada del pack integrado; se conserva como registro hasta que la tarea de marca de RC3 ratifique la identidad visual en la documentación canónica.

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

## Láminas narrativas — ampliación visual posterior al tag RC3

Autorizadas por el PO el 23/09 para acompañar las aperturas, interludios y cierres
narrativos de año y el egreso. Siete dibujos de objetos a lápiz sobre papel
amarillo tipo nota adhesiva: escuela con bandera argentina en 7.º, libros en 1.º,
geometría en 2.º, agenda/calculadora en 3.º, carpeta de proyecto en 4.º,
cuaderno/llave en 5.º y birrete/diploma al egresar. Sin personas, sin soluciones,
sin datos necesarios para jugar. «SECUNDARIA» en la fachada es ambientación;
todo título, año, consigna y acción sigue siendo texto HTML.

Comparten tinta, grano de papel, verde escolar y acentos rojos con las escenas,
pero el trazo y el papel amarillo distinguen la pausa narrativa. El amarillo
pertenece a la ilustración, no a un nuevo estado o token de interfaz. Sin sombra,
esquinas dobladas, giro ni radio de tarjeta. No se modifica el arte de desafíos.

`milestone-artwork.ts` mapea etapas sólo en presentación. `RunView` compone el
slot `media` existente de `NarrativeCard`, después de su prosa, con `SceneMedia`.
La misma lámina abre y cierra cada año; no se suma una imagen al banner de hito
debajo de un resultado, ni a los Repasos. `CareerEnding` usa el birrete a 192 px
de ancho entre la celebración y el resultado. No agrega pantallas, clics o esperas.

Derivados en `public/assets/milestones/`: WebP 1200×675, calidad 85, effort 6,
chroma inteligente, sin metadatos; entre 104 y 146 KB por archivo, límite de
150 KB. `next/image` pide el tamaño apropiado sin precarga; la caja 16:9 reserva
el espacio, `alt=""` evita duplicar la narración y jugar sigue siendo posible si
la imagen no llega. El cierre declara `sizes="192px"`.

Generados con la herramienta integrada `image_gen`. Prompts completos y hashes
de originales en [resources/milestones/prompts.json](../../resources/milestones/prompts.json).
Para volver a derivarlos, con los PNG originales nombrados por su `id`:

```bash
node scripts/brand/build-milestone-assets.mjs <directorio-de-originales>
```

Los PNG quedan fuera del runtime; sólo los WebP optimizados se versionan como
arte servido. Esta ampliación no mueve el tag RC3 ni cambia su manifiesto,
motor, contenido, score, replay o persistencia.

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

Todo estado de UI · los paneles de resultado de desafío · el banner de cierre de etapa · Estilo · Aura · el wordmark · el progreso · los cuatro patrones de interacción. Las pausas narrativas y el encabezado de egreso son la excepción autorizada descrita arriba.

## Dónde van

```text
public/assets/brand/               # isotipo (SVG ×3), íconos de app (PNG 192/512), hero (WebP 800/1200)
src/app/{favicon.ico,icon.svg,apple-icon.png}   # íconos por convención de Next
src/app/opengraph-image.{jpg,alt.txt}           # imagen social por convención de Next
public/assets/scenes/*.webp        # escenas de situación (integradas)
public/assets/milestones/*.webp    # siete láminas narrativas a lápiz sobre papel amarillo
```

Los de marca no se editan a mano: `pnpm brand:build` vuelve a derivar íconos y SVG del módulo de geometría, `pnpm brand:hero <source>` el hero desde su source y `pnpm brand:og` la imagen social desde lo anterior.

Siempre vía `SceneMedia`, nunca con `priority` —precargar el arte de un desafío que todavía no apareció le roba ancho de banda a la pantalla que el jugador está mirando— y nunca cargados desde una ruta que no sea `public/`. Los originales no se sirven: `public/` sólo contiene derivados optimizados.

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

- **`grilla-25-de-mayo.png` ya es contenido de producto.** El acto del 25 de Mayo está autorado en el motor como `g7.may-25-act` y la grilla se construyó como primitiva del sistema (`NumberGrid`). La captura sigue siendo la referencia del patrón de grilla y del bloque de Aura; los números y el rótulo del pañuelo difieren porque el contenido autorado manda sobre el mockup, y la celda marcada **sin corregir** es blanca con borde de tinta y no verde, porque la captura muestra el estado ya resuelto.
- Los detalles de contenido difieren de la implementación —títulos, cantidad de eventos, la variante de demora que salga por seed— porque el contenido autorado manda sobre el mockup. Lo que estas capturas fijan es el **sistema**: superficie, geometría, jerarquía y tratamiento del dato.
