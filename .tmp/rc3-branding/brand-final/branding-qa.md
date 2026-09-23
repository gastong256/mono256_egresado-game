# QA final de branding

Build de producción local (`node run-local.mjs build` + `start`, Chromium de Playwright, reduced motion), más el gate completo `pnpm verify` (ver `verification.md`). Pasada acotada: sólo lo que el hero y la imagen social pueden haber tocado, más una mirada a cada superficie con marca.

| Superficie | Anchos / condición | Resultado |
|---|---|---|
| Home OPEN (edición real) | 320 · 360 · 390 · 412 · 768 · 1280 · 1440 · 1280 al 200 % | PASS · lockup en el `h1`, hero en su caja 16:9 sin deformar (1,784–1,789), 0 elementos fuera del ancho, CTA lima única y en la misma posición que TASK-D (516 px a 320) · `evidence/home-open-*.png` |
| Home UPCOMING (fixture) | 320 · 768 · 1280 · zoom | PASS · práctica como primario, reloj de 4 celdas a la derecha del hero en escritorio · `evidence/home-upcoming-1280.png` |
| Home CLOSED (fixture) | 320 · 768 · 1280 · zoom | PASS · práctica + «Ver resultados», hero después · `evidence/home-closed-320.png` |
| Hero | cargas limpias a 320@2×, 390@3×, 412@2×, 768@2×, 1280@1×, 1280@2× | PASS · un solo pedido por carga, variante correcta por DPR, LCP 80–384 ms, CLS 0 (`hero-integration.md`) |
| Logo / wordmark | Home, identificación, práctica, error, harness | PASS · sin cambios desde la etapa anterior; `h1` «Egresado» (test de componente + E2E) |
| Favicon / app icons | `<link>` de `favicon.ico`, `icon.svg`, `apple-touch-icon`, manifiesto 192/512 | PASS · presentes en el HTML servido y verificados por `foundation.spec` (200 + `image/*`); sin cambios de archivo desde la etapa anterior |
| OG / social | `og:image` absoluta, `twitter:card` grande, `alt`, `site_name`, 1200 × 630, 173 KB | PASS · `og-social.md`, `evidence/opengraph-image.jpg` |
| Countdown | UPCOMING a 1280 y 320 | PASS · intacto; en escritorio queda a la derecha del hero, no debajo |
| CTA | 320 / 360 / 390 / 412 | PASS · 516 / 484 / 467 / 472 px desde arriba, antes del hero |
| Ranking | Home OPEN a 1280 y 320 | PASS · sin cambios; empieza después de «Cómo se juega» como antes |
| Footer | Home a 1280 y 320 | PASS · sin cambios; tres logos institucionales, ninguno compite con el hero |
| Ending | — | PASS · sin cambios de esta etapa (sin marca por decisión de la etapa anterior; numeral a 56 px bajo 360 px ya verificado) |
| `/test` | 320 · 1280 | PASS · lockup en la introducción y símbolo en el encabezado, sin cambios · `evidence/practice-320.png` |
| Consola / red | toda la barrida | 0 errores, 0 warnings (React, hidratación, imágenes, fuentes, metadata), 0 `404`, 0 `requestfailed` |
| Accesibilidad | hero `alt=""` (rol presentación; el test de la portada sigue contando 3 imágenes: las del pie) · `h1` único · foco de la CTA intacto · reloj sin live region | PASS · axe WCAG 2.2 AA en los E2E de portada, práctica y carrera del gate |
| Motion | — | Sin animación nueva; el hero entra estático |
| Design System | papel, filete `border-rule`, radio 0, sin sombra; la lámina no crea una isla | PASS · `design:check` |

## Issues

Ninguno abierto dentro de branding. Observaciones registradas:

- En escritorio, con la competencia OPEN y sin reloj visible, la columna de acción es más corta que la de marca + hero y deja aire a la derecha del hero. Es la composición de TASK-A; con UPCOMING el reloj lo ocupa. No se rellena con nada: el papel es el sistema.
- Las medidas de LCP/CLS son de laboratorio; las de campo llegan después del despliegue (B25).
- Safari y Firefox no están disponibles en este entorno; el `<img srcset>` con WebP y el `.ico`/`apple-touch-icon` son los caminos convencionales de ambos.
