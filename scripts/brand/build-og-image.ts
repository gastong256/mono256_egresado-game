/**
 * Compone la imagen social de Egresado.
 *
 *     pnpm brand:og
 *
 * Escribe `src/app/opengraph-image.jpg` (1200 × 630), que Next publica como
 * `og:image` y X/Twitter hereda con la tarjeta grande. No es una ilustración
 * nueva: es la marca sobre papel cuadriculado —el isotipo canónico, la
 * palabra en Schibsted Grotesk real, la promesa de la portada— con el hero
 * aprobado a la derecha, tal como está en `public/assets/brand/`.
 *
 * Se renderiza con el Chromium de Playwright, que ya es dependencia del
 * proyecto, porque es lo único disponible que compone texto con la fuente
 * variable `.woff2` versionada (Satori no lee woff2). La composición es una
 * página HTML de una sola pieza y el resultado es reproducible: mismos
 * archivos, misma imagen.
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { BRAND_HEX } from '../../src/lib/ui/brand'
import {
  BRAND_MARK_BOX,
  BRAND_MARK_DIAMOND,
  BRAND_MARK_INK,
} from '../../src/lib/ui/brand-mark'

const require = createRequire(import.meta.url)
const { chromium } =
  require('@playwright/test') as typeof import('@playwright/test')

const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../..',
)
const font = pathToFileURL(
  path.join(root, 'src/app/fonts/schibsted-grotesk-latin-variable.woff2'),
).href
const hero = pathToFileURL(
  path.join(root, 'public/assets/brand/egresado-hero-1200.webp'),
).href
const output = path.join(root, 'src/app/opengraph-image.jpg')

export const OG_SIZE = { width: 1200, height: 630 } as const

/** Los mismos hex que el manifiesto y los SVG sueltos. */
const paper = BRAND_HEX.canvas
const ink = BRAND_HEX.ink
const green = BRAND_HEX.green
const grid = '#e6e4dc'
const red = '#c0272d'

const mark = `<svg viewBox="0 0 ${String(BRAND_MARK_BOX.width)} ${String(BRAND_MARK_BOX.height)}" style="height:1em;width:auto;flex:none" fill="currentColor" aria-hidden="true">${Object.values(
  BRAND_MARK_INK,
)
  .map((d) => `<path d="${d}"/>`)
  .join('')}<path d="${BRAND_MARK_DIAMOND}" fill="${green}"/></svg>`

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:'SG';src:url('${font}') format('woff2');font-weight:400 900}
html,body{margin:0}
body{width:${String(OG_SIZE.width)}px;height:${String(OG_SIZE.height)}px;position:relative;overflow:hidden;color:${ink};font-family:SG,system-ui,sans-serif;
  background-color:${paper};
  background-image:linear-gradient(${grid} 1px,transparent 1px),linear-gradient(90deg,${grid} 1px,transparent 1px);background-size:16px 16px}
.hero{position:absolute;right:0;top:${String((OG_SIZE.height - 360) / 2)}px;width:640px;height:360px;object-fit:cover;
  -webkit-mask-image:linear-gradient(to right,transparent,#000 22%);mask-image:linear-gradient(to right,transparent,#000 22%)}
.text{position:absolute;left:72px;top:68px;width:560px;display:flex;flex-direction:column;gap:22px}
.eyebrow{font-size:19px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${red}}
.lockup{display:inline-flex;align-items:baseline;gap:.28em;font-size:104px;line-height:.95;font-weight:800;letter-spacing:-.05em}
.promise{font-size:46px;line-height:1.02;font-weight:800;letter-spacing:-.03em;margin-top:6px}
.label{position:absolute;left:72px;bottom:60px;font-size:20px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#5a5f5c;font-variant-numeric:tabular-nums}
.rule{position:absolute;left:72px;right:72px;bottom:104px;height:0;border-top:1px solid #c9c6be}
</style>
<img class="hero" src="${hero}" alt="">
<div class="text">
  <div class="eyebrow">Un juego sobre decidir en la escuela</div>
  <div class="lockup">${mark}<span>Egresado</span></div>
  <div class="promise">Tu secundaria.<br>Tus decisiones.<br>Tu propia historia.</div>
</div>
<div class="rule"></div>
<div class="label">7.º → 1.º → 2.º → 3.º → 4.º → 5.º → Egreso &nbsp;·&nbsp; Feria del Libro 2026</div>
`

// La página se abre desde un archivo: una pestaña `about:blank` no puede
// leer la fuente ni el hero por `file://`.
const scratch = mkdtempSync(path.join(tmpdir(), 'egresado-og-'))
const documentPath = path.join(scratch, 'og.html')
writeFileSync(documentPath, html)

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: OG_SIZE,
  deviceScaleFactor: 1,
})
await page.goto(pathToFileURL(documentPath).href)
await page.evaluate(() => document.fonts.ready)
await page.evaluate(
  () =>
    new Promise<void>((resolve) => {
      const image = document.querySelector('img')
      if (image === null || image.complete) resolve()
      else image.addEventListener('load', () => resolve(), { once: true })
    }),
)
await page.screenshot({ path: output, type: 'jpeg', quality: 90 })
await browser.close()
rmSync(scratch, { recursive: true, force: true })
process.stdout.write(`  ${path.relative(root, output)}\n`)
