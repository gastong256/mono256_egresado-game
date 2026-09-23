# Verificación

Fecha: 2026-09-23. Base: `main` / `fd9b23e`. Runtime `1.0.0-rc.2`; RC3 no se corta.

| Comando | Resultado |
|---|---|
| `git status` · `git branch --show-current` · `git log -10 --oneline` | `main`, HEAD `fd9b23e`, árbol limpio salvo `resources/rc3-assets/` (sin trackear) |
| `pnpm brand:hero resources/rc3-assets/brand/hero.png` | 2 WebP: 63.012 B (800) y 120.480 B (1200), PSNR 35,6 / 37,1 dB |
| `pnpm brand:og` | `opengraph-image.jpg` 172.696 B; dos corridas → mismo SHA-256 |
| `pnpm format:check` · `pnpm lint` · `pnpm typecheck` · `pnpm design:check` | PASS |
| `node scripts/sync-master-spec.mjs --check` · `git diff --check` | PASS |
| `pnpm build` (con `.env.local` fijado; `.env.production.local` no aplica) | PASS, sin warnings de metadata ni de imágenes |
| Barrida en navegador (`hero-sweep.ts`, fuera del repo) | PASS · detalle en `branding-qa.md` y `hero-integration.md` |
| `pnpm verify` (gate canónico) | **PASS, exit 0** · 135 archivos / 2.498 tests (0 skips) · cobertura: sentencias 86,84 %, branches 79,79 %, funciones 89,25 %, líneas 87,07 % · `release:verify` 57 comprobaciones en verde, huella RC.2 `0ea3c1de…` intacta · build OK sin warnings · **264 E2E** (incluye la fundación ampliada con og/twitter, imagen social y hero) |

## Assets verificados programáticamente

`tests/unit/brand-assets.test.ts`: los tres SVG del isotipo iguales al módulo de geometría, `icon.svg`, `favicon.ico` (16/32/48), `apple-icon.png` (180), PNG 192/512, hero WebP 800 × 450 y 1200 × 675 (< 180 KB), `opengraph-image.jpg` 1200 × 630 (< 400 KB) con `alt`. `tests/e2e/foundation.spec.ts`: `<link>` de íconos, manifiesto, `og:image`/`twitter:*`, la imagen social servida como `image/jpeg` y el hero cargado (`naturalWidth > 0`, `currentSrc` = una de las dos variantes).

## Invariantes

Diff sin archivos en `src/game`, `src/server`, `src/content`, `src/release`, `src/lib/competition`, `supabase/`, `pnpm-lock.yaml`. `package.json` sólo suma los scripts `brand:hero` y `brand:og`. Cero migraciones, cero variables nuevas, cero dependencias. `release:verify` en verde con la huella RC.2.

## Estado de `resources/`

```text
RC3 source assets consumed: 1 (resources/rc3-assets/brand/hero.png)
RC3 source assets removed:  1 (resources/rc3-assets/ completo; SHA-256 en hero-integration.md)
Unrelated resources preserved: YES (resources/footer/, versionados)
```

Misma convención que las escenas y el isotipo: el runtime y el pipeline quedan en el repo; el source aprobado se retira del checkout una vez registrada su procedencia.

## Diferido

Nada dentro de branding. Fuera de alcance: B24 (corte `1.0.0-rc.3`, tag, huella), B25 (verificación de producción y Core Web Vitals de campo), B26 (freeze).
