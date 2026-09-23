# Egresado RC3 — Branding final · hero, imagen social y QA

Implementación sobre `main` / `fd9b23e` (2026-09-23). Runtime sigue en
`1.0.0-rc.2`; RC3 no se corta, no hay deploy manual. Estado y comandos en
[verification.md](verification.md).

| Campo | Valor |
|---|---|
| Cierra | **B06** hero · **B07** Home con branding final · **B23** favicon/íconos/OG/social → **BRANDING RC3 = CLOSED** |
| No incluye | B24 corte RC3 · B25 verificación de producción · B26 freeze |
| Source aprobado | `resources/rc3-assets/brand/hero.png` (1672 × 941, SHA-256 `0db0b3e1…591d19`), retirado del checkout al cerrar como el del isotipo; `resources/footer/` se conserva |
| Runtime | `public/assets/brand/egresado-hero-{800,1200}.webp` · `src/app/opengraph-image.jpg` + `.alt.txt` |
| Matemática / RunPlan / RNG / FairScore / ranking / recovery / competencia / práctica / DB / privacidad / seguridad | **UNCHANGED** (`release:verify` en verde, huella RC.2 intacta; sin archivos tocados en `src/game`, `src/server`, `src/content`, `src/release`, `src/lib/competition`, `supabase/`) |
| Dependencias nuevas | **NINGUNA** (Playwright y el `sharp` de Next ya estaban) |
| Migraciones / env | NINGUNA (`metadataBase` lee `NEXT_PUBLIC_APP_URL`, que ya existía y tiene default) |

## Archivos de esta carpeta

| Archivo | Contenido |
|---|---|
| [hero-integration.md](hero-integration.md) | Source, runtime, pipeline, formato, estrategia de portada, orden móvil probado, recorte, LCP/CLS |
| [og-social.md](og-social.md) | Composición, copy, fuente, isotipo, hero, render reproducible, metadata publicada |
| [branding-qa.md](branding-qa.md) | Superficies, anchos, favicon, OG, hero, Home, ending, práctica, issues |
| [verification.md](verification.md) | Comandos, resultados, invariantes, estado de `resources/` |
| `evidence/` | Portada en cada estado y ancho, alternativa de orden descartada, práctica, la imagen social |

## Código

- `src/components/competition/home-hero.tsx` (nuevo) y la grilla de `competition-experience.tsx` (tres piezas, dos columnas desde `sm`).
- `src/app/layout.tsx` (`metadataBase`, `twitter.card`), `page.tsx` y `test/page.tsx` (`openGraph.siteName`), `src/app/opengraph-image.jpg` + `opengraph-image.alt.txt`.
- `scripts/brand/build-hero-assets.ts` (`pnpm brand:hero`), `scripts/brand/build-og-image.ts` (`pnpm brand:og`).
- Tests: `tests/unit/brand-assets.test.ts` (hero 16:9 y peso, OG 1200 × 630 y alt), `tests/e2e/foundation.spec.ts` (og/twitter, imagen servida, hero cargado con `srcset`).
- Docs: `docs/09-design-system/assets.md`.
