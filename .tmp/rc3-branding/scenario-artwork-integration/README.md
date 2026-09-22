# Egresado RC3 — Scenario artwork integration

**Status: TECHNICALLY INTEGRATED · READY FOR HUMAN VISUAL REVIEW.** No se declara aprobación visual. RC3 no se cortó; no hay tag, push ni deploy. Release sigue en `1.0.0-rc.2`.

| Campo | Valor |
|---|---|
| Baseline | `main` · `cfcde1e` (RC.2) · 2026-09-22 |
| Commits locales (sin push) | `c7f47c6 chore(assets): add optimized scenario illustrations` · `a1a6469 feat(ui): integrate scenario artwork into challenge frames` |
| Patrón UX | EYEBROW → TÍTULO → ILUSTRACIÓN → CONTEXTO → DATOS → INTERACCIÓN (ver [ux-decision](ux-decision.md)) |
| Public scenarios expected / integrated | 24 escenas / 24 integradas (28 Templates públicas; 10 Repasos sin imagen por decisión) |
| Missing | 0 · DEV-only: DEFERRED (4, no entregados, no habilitados) |
| Source assets | 25 PNG 1672×941 (24 escenas + 1 style test duplicado de `y1-expo`) · 52,5 MB |
| Runtime assets | 24 WebP 1600×900 · 3 293 564 B (3,14 MB) · **93,5 % de reducción** · mayor `y5-trip.webp` 164,7 KB · mediana 140,8 KB |
| Abstracción | `SceneMedia` (existente, adaptada) + `scene-registry.ts` (nuevo, presentación) + `SituationCard.media` movido bajo el título; `ChallengeFrame` compone |
| Mathematics / competitive semantics / DB / security / privacy | UNCHANGED (release:verify: 57 comprobaciones en verde, huella RC.2 intacta) |

## Archivos de esta carpeta

| Archivo | Contenido |
|---|---|
| [asset-mapping](asset-mapping.md) | Reconciliación (expected/found/missing/unexpected/dev-only/duplicated), matriz por asset con bytes, dimensiones, PSNR, mapping de Templates y SHA-256 de originales y derivados |
| [optimization-report](optimization-report.md) | Tooling (sharp de Next), WebP vs AVIF medido, settings, totales, outliers, bytes reales servidos |
| [ux-decision](ux-decision.md) | Patrón elegido y por qué, ratio 16:9, Repaso sin imagen, accesibilidad, medidas por viewport |
| [visual-review-checklist](visual-review-checklist.md) | URLs/seeds concretas, 21 pantallas representativas (anchors, 1–2 por año, todos los engines, Repaso, vitrina) |
| [issues-deferred](issues-deferred.md) | Revisión de contenido de láminas (birrete en `y5.next-step`, mural de graduación, símbolos patrios), copy para TASK-04, gobernanza de docs, `.tmp` y `.env.production.local` |

## Cambios en el repositorio

- `public/assets/scenes/*.webp` (24, nuevos).
- `src/components/game/scene-registry.ts` (nuevo): `sceneForTemplate`, `sceneForChallenge`, `templatesWithScene`, `registeredScenes`.
- `src/components/game/scene-media.tsx`: 16:9 único, sin `saturate-85`, `alt` opcional (`""` por defecto), `data-testid="scene-media"`.
- `src/components/game/situation-card.tsx`: slot `media` entre `<h2>` y prosa.
- `src/components/game/challenge-frame.tsx`: monta la escena del registro.
- `src/components/dev/design-system-showcase.tsx`: la vitrina muestra `SceneMedia` real.
- `tests/unit/scene-registry.test.ts`, `tests/component/scene-media.test.tsx` (nuevos).
- `docs/09-design-system/{assets,game-components,README}.md`: estado real del pack (brief fotográfico marcado histórico; ADR-017 no editado).
- `.prettierignore`, `eslint.config.mjs`: `.tmp/` excluido de los gates de código (no de git).

No se tocó: `src/game`, `src/content`, `src/server`, `src/release`, `supabase/`, `next.config.ts`, `package.json`, lockfile, `.gitignore`, `.env*`.

## Verificación ejecutada

| Comando | Resultado |
|---|---|
| `git status` / `git branch --show-current` / `git log -5` | main, HEAD cfcde1e, worktree limpio salvo `.tmp/` y `resources/` (sin trackear) |
| `pnpm format:check` | PASS (tras excluir `.tmp/`) |
| `pnpm lint` | PASS (tras excluir `.tmp/`; el único hallazgo previo era un warning en `.tmp/…/discovery.config.mjs`) |
| `pnpm typecheck` | PASS |
| `pnpm design:check` | PASS (79 archivos, 41 pares de contraste) |
| `pnpm test:coverage` | PASS: 124 archivos, 2358 tests; cobertura 85,69 % stmts / 77,64 % branches / 87,75 % funcs / 85,92 % lines (umbrales 85/75/85/85). Una primera corrida en paralelo con E2E+build falló por timeouts de CPU (load 37); la corrida limpia es la que cuenta. |
| `pnpm build` | PASS (exit 0), ejecutado con `.env.local` fijado en `process.env` para que `.env.production.local` no pise la configuración local |
| `playwright test full-career design-system grade-1 grade-5 game-engine-harness --project chromium-desktop,chromium-mobile` sobre el build | PASS: 62 tests (incluye axe WCAG 2.2 AA, reflow 320–412, teclado, replay/resume) |
| Recorrido visual propio (harness, 8 seeds, 320/390/412/1280) | 100 pantallas de situación: 100 % imagen cargada, 0 desbordes, 0 errores del optimizador, Repaso sin imagen, 9 imágenes por carrera, 21–41 KB servidos por situación |
| `pnpm release:check` / `pnpm release:verify` | PASS / 57 comprobaciones en verde |
| `git diff --check`, `secrets:check`, `sync-master-spec --check`, `validate-agent-workspace` | PASS |
| No ejecutado | `pnpm verify` completo (simulaciones/validación de contenido no aplican a un cambio de presentación); `competition.spec.ts` (la DB local no tiene el schema de competencia migrado; la ruta `/` usa el mismo `RunView` que el harness) |

## Estado de `resources/`

```text
RC3 source assets consumed: 24 (+1 style test idéntico a y1-expo)
RC3 source assets removed:  25 (resources/rc3-assets/ completo; resources/ quedó vacío y se retiró)
Unrelated resources preserved: YES (no había ninguno)
Ambiguous resources preserved: n/a (no había ambiguos)
```

Los originales ya no están en el checkout. Sus SHA-256 quedaron en `asset-mapping.md`; el pipeline para regenerar cualquier derivado está en `optimization-report.md`.

## Estado de `.tmp/`

`task-01-discovery/` intacto. Esta carpeta es el handoff de la integración. `.tmp/` sigue sin trackear y sin ignorar en git (decisión pendiente del PO; ver issues).

## App local

`pnpm dev` corriendo en `http://localhost:3000` (`.env.local` únicamente; Supabase local en 54321). Rutas de revisión en `visual-review-checklist.md`; empezar por:

1. `http://localhost:3000/dev/game-engine?content=full-career&seed=rc3-review-0` → Comenzar recorrido (bus · 25 de Mayo · expo · … · peña · pantalla)
2. `http://localhost:3000/dev/game-engine?content=full-career&seed=rc3-review-2`
3. `http://localhost:3000/dev/design-system` → sección Arte

## Siguiente

HUMAN VISUAL REVIEW → ajustes si hacen falta (ratio a 320 px, regla por engine, regeneración puntual de láminas) → TASK-02 branding.
