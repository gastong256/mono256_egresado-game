# Egresado RC3 — Branding stage 3 · isotipo, wordmark, íconos e integración

Implementación sobre `main` / `4b5e3ba` (2026-09-23). Runtime sigue en
`1.0.0-rc.2`; RC3 no se corta, no hay deploy manual. Estado y comandos en
[verification.md](verification.md).

| Campo | Valor |
|---|---|
| Cierra | **B04** logo principal · **B05** isotipo/favicon · **B07** identidad en Home (excepto hero) · **B23** favicon/íconos (OG final diferida) |
| No incluye | B06 hero · OG image definitiva · social artwork · corte RC3 |
| Source aprobado | `resources/rc3-assets/brand/isotipo.png` (SHA-256 `0a487411…395c73`), retirado del checkout al cerrar |
| Fuente de verdad | `src/lib/ui/brand-mark.ts` → `public/assets/brand/egresado-mark.svg` (331 B) y todos los derivados vía `pnpm brand:build` |
| Matemática / RunPlan / RNG / FairScore / ranking / recovery / DB / privacidad / seguridad | **UNCHANGED** (`release:verify` en verde, huella RC.2 intacta; sin archivos tocados en `src/game`, `src/server`, `src/content`, `src/release`, `supabase/`) |
| Dependencias nuevas | **NINGUNA** (runtime ni dev; `sharp` se resuelve desde Next para el script) |
| Migraciones / env / APIs | NINGUNA |

## Archivos de esta carpeta

| Archivo | Contenido |
|---|---|
| [mark-reconstruction.md](mark-reconstruction.md) | Source, concepto, medidas del raster, geometría canónica, correcciones ópticas, paleta, viewBox, variante pequeña |
| [wordmark.md](wordmark.md) | Fuente, peso, caja, tracking, relación símbolo/palabra, separación, apilado evaluado |
| [asset-matrix.md](asset-matrix.md) | Cada asset con propósito, formato, dimensiones, color, fuente, ruta, bytes y estado |
| [favicon-validation.md](favicon-validation.md) | Convención Next, fondo, 16–512, navegador real |
| [integration.md](integration.md) | Superficies, evaluación del ending, reportes de `.tmp` consultados y qué decidieron |
| [verification.md](verification.md) | Comandos, resultados, invariantes, diferidos |
| `evidence/` | Hojas de QA (source vs SVG, tamaños, mono, wordmark), favicon en DPR 1 y 2, portada, identificación, práctica, prototipos del ending |

## Código

- `src/lib/ui/brand-mark.ts` — geometría canónica y pequeña, `brandMarkSvg`, `brandIconSvg`, `BRAND_ICON_SPEC`.
- `src/components/ui/brand.tsx` — `BrandMark` (inline, `currentColor`, `mono`) y `BrandLogo` (`sm`/`md`/`lg`/`event`); `wordmark.tsx` gana `size="inherit"`.
- `scripts/brand/build-brand-assets.ts` + `pnpm brand:build` — SVG ×3, `icon.svg`, `favicon.ico` (PNG 16/32/48), `apple-icon.png`, PNG 192/512.
- `src/app/manifest.ts` — `icons`.
- Integración: `competition-experience.tsx`, `practice-experience.tsx`, `not-found.tsx`, `error.tsx`, `game-container.tsx`, `design-system-showcase.tsx`; `milestone.tsx` (numeral del cierre a 320 px).
- Tests: `tests/unit/brand-assets.test.ts`, `tests/component/ui-primitives.test.tsx` (BrandMark/BrandLogo), `tests/e2e/foundation.spec.ts` (íconos y manifiesto).
- Docs: `docs/09-design-system/assets.md`, `ui-components.md`.
