# Wordmark y lockup

| Campo | Valor |
|---|---|
| Fuente | **Schibsted Grotesk** variable (400–900), la vendorizada en `src/app/fonts/` con `next/font/local` (OFL 1.1). Confirmado en `src/app/fonts/index.ts`; no se copió ni duplicó ningún archivo de fuente. |
| Peso | **800** (se rindieron 700, 800 y 900 a 64 px: 700 pierde presencia junto al símbolo; 900 empasta la `g` y la `s`). |
| Caja | **Mixta: «Egresado»**. Se rindió «EGRESADO» en 800/0, 800/+0,04 em y 700/+0,06 em; funciona, pero lee como marca deportiva o tecnológica, que es exactamente la huella que la identidad papel existe para deshacer ([ADR-017](../../../docs/03-architecture/adr/ADR-017-paper-visual-identity.md); `docs/09-design-system/typography.md`: «un título nunca va en versalitas»). La preferencia conceptual del brief se evaluó y se descarta con evidencia. |
| Tracking | **−0,03 em** en `sm`/`md`/`lg` (el del `Wordmark` vigente); **−0,05 em** en `event` porque lo trae el rol `text-event-title`. Se probó −0,05 em general: a 31 px cierra de más la `es`. |
| Relación mark/palabra | Símbolo de **1 em de alto** (0,83 em de ancho) **apoyado en la línea base** (`items-baseline`): la barra de la Σ cae sobre la misma línea que las letras y el techo sube 0,3 em por encima de las mayúsculas, como un ascendente. Se compararon 0,9 / 1 / 1,12 / 1,25 em centrados: 1 em en línea base es el único que no necesita un ajuste vertical a mano. |
| Separación | **0,28 em** (probado 0,2 y 0,4). |
| Implementación | `BrandLogo` (`src/components/ui/brand.tsx`): `inline-flex items-baseline gap-[0.28em]` + `BrandMark` + `Wordmark size="inherit"`. Sin SVG horizontal: el wordmark sigue siendo texto real, seleccionable y buscable, y la palabra no se convirtió a trazados (no hay necesidad de asset externo todavía; cuando la haya, la OFL lo permite). |
| Tamaños | `sm` 17 px · `md` `text-section` · `lg` `text-display` · `event` `text-event-title` (fluido, 17 cqi). |
| Apilado | **Evaluado, no creado.** Se rindió (símbolo 1,6 em sobre la palabra) y funciona, pero ninguna superficie lo pide: la portada es horizontal, el hero no existe y la OG espera al hero. |

Evidencia: `evidence/wordmark-evaluation.png` (pesos, tracking, versalitas, alturas del símbolo, separaciones, cuadrícula, reversa y apilado, con la fuente real en Chromium).
