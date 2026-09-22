# Assets existentes

**8 archivos binarios versionados: 6 PNG de referencia + 2 fuentes WOFF2.** `public/` sólo contiene `.gitkeep`; `resources/` no existe. No hay logos exportados, SVG independientes, favicon, iconos app, OG, fotografías, audio ni ilustraciones de escenas. Se inspeccionó el inventario de archivos versionados y los directorios de producto; caches de build, reportes, node_modules y adjuntos privados no son assets de producto.

| Path | Format | Dimensions | Bytes | Used/unused | Purpose | Style | Quality | Reusable? |
|---|---|---|---|---|---|---|---|---|
| docs/09-design-system/reference/apertura.png | png | 417×484 | 27063 | DOC-ONLY · referenciada por docs/09-design-system/assets.md | Captura del handoff v0.2 | Papel editorial | Referencia de sistema; copy y valores pueden estar desactualizados | Referencia sí; nunca rasterizar UI |
| docs/09-design-system/reference/cierre-de-etapa.png | png | 424×841 | 66330 | DOC-ONLY · referenciada por docs/09-design-system/assets.md | Captura del handoff v0.2 | Papel editorial | Referencia de sistema; copy y valores pueden estar desactualizados | Referencia sí; nunca rasterizar UI |
| docs/09-design-system/reference/colectivo-resuelto.png | png | 424×1095 | 77201 | DOC-ONLY · referenciada por docs/09-design-system/assets.md | Captura del handoff v0.2 | Papel editorial | Referencia de sistema; copy y valores pueden estar desactualizados | Referencia sí; nunca rasterizar UI |
| docs/09-design-system/reference/colectivo-sin-resolver.png | png | 424×668 | 46097 | DOC-ONLY · referenciada por docs/09-design-system/assets.md | Captura del handoff v0.2 | Papel editorial | Referencia de sistema; copy y valores pueden estar desactualizados | Referencia sí; nunca rasterizar UI |
| docs/09-design-system/reference/grilla-25-de-mayo.png | png | 417×1134 | 87102 | DOC-ONLY · referenciada por docs/09-design-system/assets.md | Captura del handoff v0.2 | Papel editorial | Referencia de sistema; copy y valores pueden estar desactualizados | Referencia sí; nunca rasterizar UI |
| docs/09-design-system/reference/mural-resuelto.png | png | 425×1075 | 71278 | DOC-ONLY · referenciada por docs/09-design-system/assets.md | Captura del handoff v0.2 | Papel editorial | Referencia de sistema; copy y valores pueden estar desactualizados | Referencia sí; nunca rasterizar UI |
| src/app/fonts/libre-franklin-latin-variable.woff2 | woff2 | N/A | 29292 | ACTIVE · src/app/fonts/index.ts | Fuente local variable Latin 400–900 | Schibsted: títulos/datos; Libre Franklin: prosa | Formato web versionado; licencia OFL adjunta | Sí, conservar |
| src/app/fonts/schibsted-grotesk-latin-variable.woff2 | woff2 | N/A | 46752 | ACTIVE · src/app/fonts/index.ts | Fuente local variable Latin 400–900 | Schibsted: títulos/datos; Libre Franklin: prosa | Formato web versionado; licencia OFL adjunta | Sí, conservar |

## Assets de código (no sumados a los 8 archivos)

| Fuente / símbolo | Formato / dimensión | Uso | Calidad y reuso |
|---|---|---|---|
| `src/components/ui/wordmark.tsx:Wordmark` | Texto SG 800, tracking −0,03 | Home; dev | Reusable; no es un archivo de logo. |
| `src/components/ui/marks.tsx:TickMark` | SVG viewBox 20×20 | Resultado | Mantener semántica de acierto, no convertir en decoración de opción. |
| `marks.tsx:SlashMark` | SVG viewBox 20×20 | Insuficiente | Reusable, currentColor. |
| `marks.tsx:PartialMark` | CSS 11×11 | Parcial | Reusable. |
| `marks.tsx:MilestoneTick` | SVG viewBox 34×34 | Cierre | Reusable. |
| `src/components/game/estilo-triangle.tsx:EstiloTriangle` | SVG calculado desde datos | HUD/cierre | No reemplazar por bitmap. |
| `src/components/game/confetti.tsx` | 18 tiras CSS | Hitos | Determinista; reduced-motion. |
| `src/components/game/aura-display.tsx:AuraBlock` | CSS y texto | HUD/feedback/cierre | Negro reservado, no imagen. |
| `src/components/ui/quantity-stepper.tsx` | CSS signos | Controles | Mantener nombres accesibles. |
| `src/components/ui/progress.tsx:StageProgress` | CSS celdas y texto | Etapa | No imágenes por año. |
| `src/styles/base.css:eg-canvas` | Gradientes CSS 16 px | Hoja | Reusable sin descargar textura. |
| `src/components/game/interactions/*` | HTML/SVG dinámico | Datos/controles | Activos; dibujos matemáticos protegidos. |

Las licencias `src/app/fonts/OFL-*.txt` acompañan ambas fuentes. No reexportarlas con una licencia inventada. Los tamaños de código no son bytes de una descarga individual; medir bundle en la implementación, no sumarlos como archivos raster.

## Briefs que no son assets producidos

`docs/09-design-system/assets.md` contiene ocho briefs raster, ocho pictogramas y briefs de audio: **DOC-ONLY**. Sus imágenes no están ausentes por un fallo de carga; nunca fueron generadas. `SceneMedia` existe pero no tiene consumidores de producto. Las referencias congeladas de `docs/sources/` no suman binarios visuales versionados y no se editaron.

Diferencia relevante: `scene.notebook` histórico propone cuadernos de librería, pero `g7.notebook-offer.narrate` actual dice “La notebook del curso” y compra una computadora. Otro handoff no debe generar cuadernos por traducir el identificador. La captura de colectivo muestra el 60; sirve como referencia visual, no como dato local verificado.
