# Imagen social (Open Graph / X)

| Campo | Valor |
|---|---|
| Archivo | `src/app/opengraph-image.jpg` · **1200 × 630** · JPEG q90 · **172.696 B** · más `src/app/opengraph-image.alt.txt` |
| Composición | papel cuadriculado del sistema (`#f6f5f0` + grilla `#e6e4dc` de 16 px) · eyebrow rojo «Un juego sobre decidir en la escuela» · lockup `[isotipo] Egresado` a 104 px · promesa «Tu secundaria. Tus decisiones. Tu lugar en el ranking.» a 46 px · filete y línea «7.º → 1.º → 2.º → 3.º → 4.º → 5.º → Egreso · Feria del Libro 2026» · el hero a 640 × 360 pegado al borde derecho con un fundido de 22 % hacia el texto |
| Copy | Todo existente: el eyebrow sin edición de la portada (TASK-B), la promesa de TASK-A, la línea de trayectoria de la portada y el nombre del evento del pie institucional. Nada nuevo |
| Fuente | Schibsted Grotesk variable real (`src/app/fonts/…woff2`), pesos 700/800; sin lettering generado |
| Isotipo | `BRAND_MARK_INK` / `BRAND_MARK_DIAMOND` de `src/lib/ui/brand-mark.ts`, inline; nunca un PNG |
| Hero | `public/assets/brand/egresado-hero-1200.webp`, el mismo runtime de la portada; recorte por `object-fit: cover` a 640 × 360 (sin recorte real: 16:9) y máscara lineal al borde izquierdo. No se reilustra |
| Render | `pnpm brand:og` (`scripts/brand/build-og-image.ts`): una página HTML de una sola pieza abierta por `file://` en el Chromium de Playwright (ya dependencia), captura JPEG q90 a DPR 1. Dos corridas producen el mismo SHA-256 (`5031eab5…`). Satori/`ImageResponse` se descartó porque no lee `.woff2` y obligaría a versionar otra copia de la fuente; una imagen estática es más simple que generación en runtime y no cuesta nada en Vercel Hobby |
| Safe area | 72 px de margen izquierdo; texto en los 560 px de la izquierda; el hero termina en el borde derecho con su propio aire (ciudad y cielo) |
| Metadata | `metadataBase` desde `NEXT_PUBLIC_APP_URL` (validado por el esquema; `http://localhost:3000` en local) en `layout.tsx`; `twitter.card = summary_large_image`; `openGraph.siteName = 'Egresado'` en `/` y `/test`. Next publica `og:image` absoluta con `type/width/height/alt` y X/Twitter hereda título, descripción e imagen |

HTML servido en `/` (build local):

```text
og:title           Egresado · Feria local
og:description     Feria local está abierta: recorré la secundaria…
og:site_name       Egresado
og:locale          es_AR
og:image           http://localhost:3000/opengraph-image.jpg?opengraph-image.…
og:image:type      image/jpeg · 1200 × 630 · alt
og:type            website
twitter:card       summary_large_image
twitter:image      (la misma) · alt · type · 1200 × 630
```

`tests/e2e/foundation.spec.ts` comprueba las etiquetas y que la imagen responda `200 image/jpeg`; `tests/unit/brand-assets.test.ts` comprueba 1200 × 630, el peso y el texto alternativo.

Previsualización: `evidence/opengraph-image.jpg`. No se probó contra los validadores de Facebook/X (requieren la URL publicada); la estructura es la que Next documenta y la que esos validadores leen.
