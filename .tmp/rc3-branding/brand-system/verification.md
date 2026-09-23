# Verificación

Fecha: 2026-09-23. Base: `main` / `4b5e3ba`. Runtime `1.0.0-rc.2`; RC3 no se corta.

## Comandos

| Comando | Resultado |
|---|---|
| `git status` · `git branch --show-current` · `git log -12 --oneline` | `main`, HEAD `4b5e3ba`, árbol limpio salvo `resources/rc3-assets/` (sin trackear) |
| `pnpm brand:build` | 8 archivos, 11.263 B en total; SVG canónico 331 B |
| `pnpm format:check` | PASS |
| `pnpm lint` | PASS (0 warnings) |
| `pnpm typecheck` | PASS (incluye `scripts/brand/build-brand-assets.ts`) |
| `pnpm design:check` | PASS (sin pigmentos ni colores a mano en `src/`; `fill-green` es token semántico) |
| `node scripts/sync-master-spec.mjs --check` · `validate-agent-workspace` | PASS (258 archivos documentados) |
| `git diff --check` | PASS |
| `pnpm verify` (gate canónico: toolchain, spec, secretos, release gate, format, lint, boundaries, typecheck, design, tests con cobertura, validación de contenido, catálogos, simulaciones, `release:verify`, build, Playwright) | **PASS, exit 0** · 135 archivos / 2.495 tests (0 skips) · cobertura: sentencias 86,83 %, branches 79,73 %, funciones 89,24 %, líneas 87,07 % · `release:verify` 57 comprobaciones en verde, huella RC.2 `0ea3c1de…` intacta · build OK · **264 E2E** (incluye el test nuevo de íconos en desktop y mobile) |

## Browser QA (build de producción local, Chromium, reduced motion)

| Superficie | Anchos | Resultado |
|---|---|---|
| `/` OPEN (edición real) | 320 / 360 / 390 / 412 / 768 / 1280 / 1440 + zoom 200 % | lockup dentro de la columna del `header` en todos (238/254 · 272/294 · 298/324 · 319/346 · 303/327 · 404/439 · 404/439 px); 0 elementos fuera del ancho; un solo primario; consola limpia |
| `/` UPCOMING · CLOSED (fixture por `page.route` + reloj) | 320 / 390 / 1280 | idem; práctica como primario, «Ver resultados» en CLOSED, sin cambios de TASK-D |
| Identificación | 320 / 390 / 768 | lockup `lg` en el `h1`; formulario intacto |
| `/test` introducción | 320 / 390 / 768 / 1280 | lockup `lg` + badge textual; `Tab` sigue cayendo primero en «Volver al inicio» |
| `/test` jugando | 320 / 390 / 1280 | símbolo de 28 px en el encabezado fijo; `h1` de etapa intacto (65 px de ancho) |
| Cierre de práctica (10.000, servidor real) | 320 / 390 / 412 / 1280 + zoom | «Egresaste» primero; sin símbolo (evaluación en `integration.md`); numeral de 56 px a 320 (medido sobre el build verificado: 242/254 px a 320 con 56 px; 285/294 px a 360 con 66 px; antes 285/254, cruzaba la hoja). Evidencia: `evidence/ending-header-320-fixed.png`, `ending-320-fixed.png` |
| Favicon / íconos | 16 · 32 · 48 · 60 · 96 CSS px, DPR 1 y 2, fondo `#202124` y blanco | los tres archivos cargan y se leen; `<link>` de `icon` (ico y svg) y `apple-touch-icon` presentes; manifiesto con 192/512 |
| `/dev/design-system` | E2E `design-system.spec` del gate | tile «Marca» renderiza (lockups, tamaños, mono, reversa, `icon.svg`) |

Sin `404` de assets, sin `requestfailed`, sin warnings de React ni de hidratación en toda la barrida.

## Accesibilidad

- `h1` de portada, identificación y harness: nombre accesible «Egresado» (test de componente + `foundation.spec`); el símbolo va `aria-hidden` y sin `<title>`.
- Encabezado de práctica: el símbolo no es foco ni imagen anunciada; el orden de tabulación no cambia.
- Contraste: sólo tokens existentes (`text-ink`, `fill-green` sobre papel: 7,3 : 1 medido por el gate para `green` sobre `canvas`).
- axe (WCAG 2.2 AA) en los E2E de portada, práctica, carrera completa y auditoría post-G1 del gate.

## Invariantes

`src/game`, `src/server`, `src/content`, `src/release`, `src/lib/competition`, `supabase/`, `package.json` (sólo el script `brand:build`) y `pnpm-lock.yaml` sin cambios de semántica; `release:verify` en verde con la huella RC.2. Cero migraciones, cero variables de entorno, cero dependencias.

## Estado de `resources/`

```text
RC3 source assets consumed: 1 (resources/rc3-assets/brand/isotipo.png)
RC3 source assets removed:  1 (resources/rc3-assets/ completo; SHA-256 en mark-reconstruction.md)
Unrelated resources preserved: YES (resources/footer/, los masters del pie de TASK-A, versionados en git)
```

Nota honesta: el barrido de `resources/` borró también `resources/footer/` por un `rm -rf` de más; como esos tres masters están versionados (`650ca30`), se restauraron con `git checkout -- resources/footer` en la misma sesión y el árbol queda idéntico. Ningún otro archivo se tocó.

## Diferido

- **B06 hero** y **OG image / social artwork definitivos** (esperan al hero; la OG textual de TASK-D queda como está).
- **Lockup apilado**: evaluado, sin superficie que lo pida.
- **SVG del lockup horizontal como archivo portable**: no hace falta hasta que exista un uso externo; el wordmark sigue siendo texto.
- **Safari / Firefox**: no disponibles en este entorno; consumen `favicon.ico` y `apple-touch-icon`, que son los caminos convencionales.
- **Corte RC3**, tag y huella final.
