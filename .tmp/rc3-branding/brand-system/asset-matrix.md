# Matriz de assets

Todo se deriva de `src/lib/ui/brand-mark.ts` con `pnpm brand:build` (`scripts/brand/build-brand-assets.ts`; rasteriza con el `sharp` que Next trae, sin dependencia nueva). `tests/unit/brand-assets.test.ts` comprueba que los SVG versionados sean byte a byte lo que produce el módulo, que ningún SVG lleve nada ejecutable y que cada raster mida lo que declara.

| Asset | Propósito | Formato | Dimensiones | Color | Fuente | Ruta runtime | Bytes | Estado |
|---|---|---|---|---|---|---|---|---|
| `egresado-mark.svg` | Isotipo canónico, portable | SVG | viewBox 200 × 240 | tinta + rombo verde | `brandMarkSvg('default')` | `/assets/brand/egresado-mark.svg` | 331 | DONE |
| `egresado-mark-mono.svg` | 100 % tinta (impresión, un color) | SVG | 200 × 240 | tinta | `brandMarkSvg('mono')` | `/assets/brand/egresado-mark-mono.svg` | 331 | DONE |
| `egresado-mark-reverse.svg` | Sobre fondos oscuros (Aura, OG futura) | SVG | 200 × 240 | papel | `brandMarkSvg('reverse')` | `/assets/brand/egresado-mark-reverse.svg` | 331 | DONE |
| `egresado-icon-192.png` | Ícono de app (manifest, `any`) | PNG | 192 × 192 | tinta + verde sobre papel | canónica, símbolo al 64 % del lado | `/assets/brand/egresado-icon-192.png` | 1.769 | DONE |
| `egresado-icon-512.png` | Ícono de app (manifest, `any` y `maskable`) | PNG | 512 × 512 | idem | canónica al 64 % (la tinta entra en el círculo seguro del 80 %) | `/assets/brand/egresado-icon-512.png` | 4.368 | DONE |
| `src/app/favicon.ico` | Favicon para todo navegador | ICO (3 PNG) | 16, 32, 48 | idem | construcción pequeña al 86 % | `/favicon.ico` (Next lo enlaza) | 2.076 | DONE |
| `src/app/icon.svg` | Favicon vectorial (`sizes="any"`) | SVG | viewBox 64 × 64 | idem | construcción pequeña al 86 % | `/icon.svg` (Next lo enlaza) | 391 | DONE |
| `src/app/apple-icon.png` | Pantalla de inicio iOS | PNG | 180 × 180 | idem | canónica al 64 % | `/apple-icon.png` (Next lo enlaza) | 1.666 | DONE |
| `BrandMark` / `BrandLogo` | Símbolo y lockup en el producto | SVG inline (React) | 1 em | `currentColor` + `fill-green` | mismo módulo | — | — | DONE |
| Lockup horizontal como archivo | — | — | — | — | — | — | — | NO CREADO (el wordmark es texto; sin caso de uso externo) |
| Lockup apilado | — | — | — | — | — | — | — | EVALUADO, NO CREADO |
| OG image / social | — | — | 1200 × 630 | — | — | — | — | DEFERRED TO HERO (B06) |
| `resources/rc3-assets/brand/isotipo.png` | Referencia aprobada | PNG | 1254 × 1254 | — | Product Owner | no se sirve | 827.559 | RETIRADO del checkout tras registrar provenance (SHA en `mark-reconstruction.md`); `resources/rc3-assets/` es staging temporal de RC3, como en la integración de escenas. `resources/footer/` (masters del pie, versionados) se conserva |

Total servible: **11.263 B** en ocho archivos. `manifest.webmanifest` declara los dos PNG (`purpose: any` y el de 512 también como `maskable`). La OG textual de TASK-D sigue tal cual; no hay imagen social declarada, así que no hay fallback que mantener.
