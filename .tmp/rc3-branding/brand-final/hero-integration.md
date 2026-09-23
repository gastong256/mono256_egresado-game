# Integración del hero

## Source y runtime

| Campo | Valor |
|---|---|
| Source | `resources/rc3-assets/brand/hero.png` · PNG RGB 8 bit · **1672 × 941** (1,777, ≈16:9) · sin alpha · sin ICC · sin EXIF · **2.242.127 B** |
| SHA-256 del source | `0db0b3e18fdbe772bb5218bdb184e241b5edaf7dceb2dbcbfcaed1d44b591d19` |
| Runtime | `public/assets/brand/egresado-hero-800.webp` · **800 × 450** · **63.012 B** · PSNR 35,61 dB<br>`public/assets/brand/egresado-hero-1200.webp` · **1200 × 675** · **120.480 B** · PSNR 37,08 dB |
| Pipeline | `pnpm brand:hero <source>` (`scripts/brand/build-hero-assets.ts`): `resize(w, w·9/16, cover, lanczos3)` → `webp({ quality: 85, effort: 6, smartSubsample: true })`, el mismo ajuste que las 24 escenas; sin metadatos; sin upscale (1672 → 1200 máx.) |
| Reducción | 2.242.127 → 120.480 B: **94,6 %** (el archivo que baja un escritorio a DPR 2); a 800 px, **97,2 %** |
| Formato | **WebP**. Se midió AVIF q60 (37 KB / 71 KB / 107 KB a 800 / 1200 / 1600) contra WebP q82–90; AVIF ahorra ≈40 %, pero como en las escenas se prefiere un solo formato, decode rápido en los teléfonos de la feria y sin `<picture>` con doble fuente. A 63 KB en un teléfono no hay caso para dos codificaciones |
| Por qué no 1600 | La portada lo muestra a 254–440 px CSS: DPR 2 de escritorio pide 880, DPR 3 de teléfono ≈1050. 1200 cubre todo; 1600 sería un archivo que nadie descarga |

## Estrategia en la portada

`HomeHero` (`src/components/competition/home-hero.tsx`) es un `<picture><img>` con `srcset` (800w, 1200w) y `sizes` por breakpoint, caja `aspect-video` con `width`/`height` intrínsecos, `object-fit: cover` sin recorte real (la caja es 16:9 como la imagen), filete de 1 px como una lámina sobre el papel, `alt=""`, `decoding="async"`, `fetchpriority="high"`.

No se usó `next/image`: este despliegue sirve las imágenes `unoptimized` (ADR-028, sin optimizador de proveedor) y con `unoptimized` `next/image` no emite `srcset`, así que un teléfono a 320 px bajaría el archivo de escritorio. Un `<img>` con `srcset` sobre dos WebP ya optimizados resuelve exactamente eso; dentro de `<picture>` no dispara la regla `no-img-element`.

| Ancho / DPR | Contenedor (CSS px) | Archivo elegido | Pedidos del hero |
|---|---|---|---|
| 320 @2× | 252 × 141 | `egresado-hero-800.webp` | 1 |
| 390 @3× | 322 × 180 | `egresado-hero-1200.webp` | 1 |
| 412 @2× | 344 × 193 | `egresado-hero-800.webp` | 1 |
| 768 @2× | 325 × 182 | `egresado-hero-800.webp` | 1 |
| 1280 @1× | 437 × 245 | `egresado-hero-800.webp` | 1 |
| 1280 @2× | 437 × 245 | `egresado-hero-1200.webp` | 1 |

Relación medida en todos los anchos: 1,784–1,789 (16:9 más el filete). Sin deformación.

## Orden y jerarquía

Grilla de tres piezas en dos columnas (`competition-experience.tsx`):

```text
teléfono (DOM)            desde sm (grid)
──────────────            ────────────────────────────────
marca · promesa           marca · promesa   │ estado
estado · CTA · reloj      «7.º → … → Egreso»│ JUGAR AHORA
HERO                      HERO              │ práctica · reloj
Cómo se juega             Cómo se juega
```

Se probó el orden conceptual del encargo (marca → hero → estado → CTA) por inyección de `order` en la barrida: «Jugar ahora» baja de 516 a 683 px a 320 y de 467 a 673 px a 390 (`evidence/home-alt-hero-before-cta-390-rejected.png`). Se descarta: la CTA queda exactamente donde TASK-A y TASK-D la dejaron y el hero aparece al primer scroll. Desde `sm` el hero ocupa la fila 2 de la columna de la marca y la acción abarca las dos filas: marca + mundo a un lado, la CTA arriba a la derecha, el reloj debajo (`evidence/home-upcoming-1280.png`).

| Ancho | CTA (top, px) | Hero (top, px) | Evidencia |
|---|---|---|---|
| 320 | 516 | 665 | `evidence/home-open-320.png` |
| 360 | 484 | 633 | — |
| 390 | 467 | 616 | `evidence/home-open-390.png` |
| 412 | 472 | 621 | `evidence/home-open-412.png` |
| 768 | 176 | 378 | `evidence/home-open-768.png` |
| 1280 / 1440 | 176 | 399 | `evidence/home-open-1280.png` |
| 1280 al 200 % | 352 | 802 | medido, sin scroll horizontal |

## Recorte y safe area

Ninguno. La ilustración va de borde a borde en 16:9 en todos los anchos: la entrada (izquierda), el grupo y la mano (centro) y el egreso (arriba a la derecha) están siempre. Un recorte 3:2 en teléfonos habría cortado la entrada o la ciudad para ganar 30 px de alto. El aire de la lámina (arriba a la izquierda, abajo a la derecha) es papel casi del mismo tono que la hoja, así que el filete es lo que la separa del fondo.

## LCP y CLS

Medidos con `PerformanceObserver` sobre el build de producción local, carga limpia por ancho y DPR:

| Carga | LCP (ms) | Elemento LCP | CLS |
|---|---|---|---|
| 320 @2× | 384 | hero `<img>` | 0,000 |
| 390 @3× | 100 | hero `<img>` | 0,000 |
| 412 @2× | 96 | hero `<img>` | 0,000 |
| 768 @2× | 236 | hero `<img>` | 0,000 |
| 1280 @1× | 80 | hero `<img>` | 0,000 |
| 1280 @2× | 96 | hero `<img>` | 0,000 |

El hero pasa a ser el LCP en todos los anchos (en un viewport de 900 px de alto entra en la primera pantalla también en teléfonos), y por eso lleva `fetchpriority="high"` y ningún `loading="lazy"`; con 63–120 KB y `srcset`, el LCP local queda por debajo de los 400 ms en el peor caso. Sin `<link rel="preload">` extra: el `<img>` está en el HTML del servidor y el preload scanner lo encuentra solo. CLS 0 en carga limpia; el 0,035–0,054 de los fixtures es el reemplazo del estado inyectado a los 20 s, conocido desde TASK-D. Son medidas de laboratorio, no de campo.
