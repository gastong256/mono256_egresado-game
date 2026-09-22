# Optimization report — escenas RC3

## Tooling

- **sharp 0.35.4 / libvips 8.18.6 (libwebp 1.6.0)**, el que Next 16.3.5 ya trae como dependencia transitiva (`node_modules/.pnpm/sharp@0.35.4_*`). No se agregó ninguna dependencia, ni de runtime ni de desarrollo.
- Script temporal en el scratchpad de la sesión (eliminado al cerrar). Pipeline exacto, reproducible con cualquier sharp ≥ 0.33 sobre los originales:

```js
sharp(source)
  .resize(1600, 900, { fit: 'cover', kernel: 'lanczos3' })   // 1672×941 → 1600×900, recorte ≤ 1 px para fijar 16:9
  .webp({ quality: 85, effort: 6, smartSubsample: true })    // lossy, chroma 4:2:0 "inteligente"
```

- Métrica de control: PSNR (RGB, 8 bit) contra la referencia PNG a 1600×900 obtenida con el mismo resize.

## Formato: WebP vs AVIF

Medido sobre los tres anchors (bytes a 1600×900; PSNR contra la referencia):

| Variante | y1-expo | g7-bus | y4-fundraiser |
|---|---|---|---|
| WebP q75 | 79,6 KB · 37,3 dB | 72,1 KB · 37,9 dB | 93,0 KB · 37,0 dB |
| WebP q80 | 99,5 KB · 38,6 dB | 91,5 KB · 39,1 dB | 113,9 KB · 38,1 dB |
| **WebP q85** (elegido) | **129,3 KB · 39,9 dB** | **116,5 KB · 40,4 dB** | **148,9 KB · 39,4 dB** |
| WebP q90 | 179,9 KB · 41,4 dB | 166,2 KB · 42,0 dB | 200,3 KB · 40,8 dB |
| WebP near-lossless q60 | 1,07 MB · 49,4 dB | 1,06 MB · 49,8 dB | 1,12 MB · 49,5 dB |
| AVIF q50 | 53,9 KB · 38,4 dB | 54,9 KB · 38,6 dB | 65,0 KB · 38,0 dB |
| AVIF q60 | 77,9 KB · 40,1 dB | 79,2 KB · 40,4 dB | 92,5 KB · 39,8 dB |

AVIF gana ~35–40 % de bytes a igual PSNR. Se eligió **WebP** igual, por tres razones operativas:

1. Lo que descarga el navegador **no es este archivo**: `next/image` lo re-codifica a WebP (formato por defecto de `images.formats`) en el ancho que pida `sizes`. El archivo de `public/` es la fuente del optimizador, y para eso importa más su calidad que su tamaño.
2. Decode más rápido y soporte universal en los teléfonos de feria; sin sorpresas en Safari viejo ni en WebViews.
3. Un solo formato en el repo y en el pipeline; nada que explicar.

Near-lossless queda descartado (1 MB por escena). q85 preserva el grano de papel y los bordes de las formas planas (a 2× no se distingue de la referencia; q75 ya los suaviza), y deja margen para la segunda compresión del optimizador.

## Dimensiones

- Source: 1672×941 (todos). Runtime: **1600×900**, 16:9 exacto, sin alpha. Sin upscale.
- La columna de juego mide 412 px como máximo en todos los breakpoints (contenido: 346 px). A DPR 2 el navegador pide la variante de 828 px del optimizador; a DPR 3, la de 1080/1200 px. 1600 px de fuente alcanza para todo eso sin interpolar.

## Totales

| Métrica | Valor |
|---|---|
| Runtime images | **24** (28 Templates públicas; 3 escenas compartidas) |
| Total source bytes | 50 304 251 B (48,0 MB, 24 PNG) — más 2,16 MB del style test duplicado |
| Total optimized bytes | **3 293 564 B (3,14 MB)** |
| Reduction | **93,5 %** |
| Largest optimized asset | `y5-trip.webp` · 164 716 B |
| Smallest | `y3-week.webp` · 100 164 B |
| Median asset | ≈ 140,8 KB |
| PSNR | 38,96 dB (`y2-intercurso`) – 41,08 dB (`y5-next-step`) |
| Presupuesto RC3 (100–250 KB) | 24/24 dentro; el "≤120 KB" del manifiesto original lo cumplen 5/24 — se priorizó calidad, como pide la tarea |

## Lo que realmente viaja al navegador

Medido en el harness con el optimizador de Next (`/_next/image?w=…&q=75`), DPR 2, en `visual-review-checklist.md` y `ux-decision.md` se listan los bytes servidos por escena. Orden de magnitud: **40–70 KB por situación** (variante 828 px), una sola imagen por pantalla, sin precarga: la run entera descarga nueve imágenes a lo largo de la partida, nunca veinticuatro al arrancar.

## Outliers y observaciones

- `y2-intercurso`, `y3-friend`, `y5-trip` (161–165 KB): escenas con más figuras y follaje; el grano sube el costo. Siguen dentro del presupuesto.
- Ninguna imagen tiene alpha, texto legible, cifras, precios ni horarios (revisión visual de las 24 a 800 px + detalle; ver `issues-deferred.md` para observaciones de contenido).
- No se aplicó ningún filtro de color en runtime: el `saturate-85` que `SceneMedia` tenía para fotografía se retiró (ver `ux-decision.md`).
- Vercel Hobby cobra transformaciones del optimizador: 24 fuentes × ~3 anchos habituales es un volumen ínfimo y cacheado; no hace falta `unoptimized`.

## Reproducibilidad

Los originales quedan fuera del repo. Para regenerar un derivado (por ejemplo tras una revisión de arte), basta con volver a correr el pipeline de arriba sobre el nuevo original con el mismo nombre de archivo del manifiesto; el registro no cambia.
