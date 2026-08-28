# Tipografía

## Dos familias

**Schibsted Grotesk** para títulos y datos. **Libre Franklin** para prosa.

Las dos son SIL OFL 1.1 y viven versionadas en `src/app/fonts/`, servidas con `next/font/local`: sin pedido a un CDN en runtime y sin descarga durante el build. Son variables, así que los cinco pesos que usa el sistema no cuestan cinco descargas. El subset es `latin`, que cubre todo el castellano rioplatense más los signos que el juego escribe de verdad: `×`, `²`, `·`, el menos tipográfico `−` y la flecha `↑` de las tendencias de Estilo.

## Caja mixta en los títulos

Las mayúsculas quedan para etiquetas de 9–11 px: eyebrow, etiqueta de dato, botón. **Un título nunca va en versalitas.**

No es una preferencia. El uppercase en títulos era la mitad de la huella de juego de carrera deportiva que v0.2 existe para deshacer ([decision-history](decision-history.md)). Un `text-transform: uppercase` en un `<h2>` es la forma más rápida de que una pantalla deje de ser Egresado.

## Roles, no tamaños

La escala está apagada (`--text-*: initial`), así que `text-lg` y `text-2xl` no generan nada. Se elige un **rol** y el sistema decide tamaño, interlínea, tracking y peso.

| Rol | Familia | Para qué |
|---|---|---|
| `text-milestone` | SG 800 | el numeral del año en el cierre de etapa |
| `text-display` | SG 800 | título de pantalla |
| `text-section` | SG 800 | título de sección, titular de banner |
| `text-aura` | SG 800 | la cifra de Aura, dentro del bloque negro |
| `text-data-lg` | SG 800 | valor de una caja de dato o renglón de cierre |
| `text-data` | SG 800 | dato del HUD, celda de grilla |
| `text-title` | SG 800 | encabezado de un bloque insertado |
| `text-option` | SG 600 | etiqueta de una opción |
| `text-goal` | SG 700 | la consigna, arriba de las opciones |
| `text-detail` | SG 700 | valor tabular al costado de una opción |
| `text-action` | SG 800 | botón (el único rol en versalitas grandes) |
| `text-body-lg` | LF 400 | prosa de apertura |
| `text-body` | LF 400 | prosa de situación |
| `text-ledger` | SG 700 | valor de un renglón del ledger |
| `text-meta` | LF 400 | metadato, etiqueta de renglón |
| `text-caption` | LF 400 | pie de pantalla, nota |
| `text-chip` | SG 700 | chip de efecto |
| `text-label` | SG 700 | etiqueta en versalitas |
| `text-eyebrow` | SG 700 | la línea roja arriba del título |

Un rol nuevo hay que declararlo en `cn()`. `tailwind-merge` trae su propio mapa de grupos y ante un nombre que no conoce puede clasificarlo como color: eso hace que un rol tipográfico borre el color del texto sin que falle ningún test ni ningún tipo. Hay un test que cubre cada escala.

## Números

**Todo valor cuantitativo lleva `tabular-nums`.** No es negociable: sin eso una cifra «salta» cuando cambia de 9 a 10, y comparar dos datos contiguos pasa a depender de dónde cayó cada dígito. El elemento lleva `data-numeric` o la utilidad directa.

Egresado es un juego de datos y se escribe en es-AR:

| Tipo | Se escribe | Quién formatea |
|---|---|---|
| Plata | `$ 21.000` | `src/content/pesos.ts` |
| Medidas | `6 × 2,4` · `14,40 m²` | `src/content/numeros.ts` |
| Promedio | `8,4` | `components/game/format.ts` |
| Aura | `+2.450` / `−150` | `components/game/format.ts` |
| Porcentaje | `36 %` | `components/game/format.ts` |
| Hora | `07:45` | el contenido, 24 h |

El motor produce decimales canónicos (`14.40`) porque su salida entra en estado determinista y no puede depender de una locale. La coma decimal y el punto de miles son decisión de producto y viven en la capa que corresponde. Ninguno de los formateadores usa `Intl`: la salida tiene que ser idéntica en cualquier dispositivo.

Dos detalles que parecen menores y no lo son: el promedio escribe siempre el decimal (`8,0`, no `8`), porque una nota sin decimal se lee como un entero suelto; y Aura usa el menos tipográfico `−` y no un guion, porque a 32 px un guion se lee como un renglón.

## Probar con contenido real

Nunca con Lorem Ipsum. Un sistema tipográfico siempre se ve bien con texto falso; lo que rompe la maqueta es `6 × 2,4 m`, `$ 21.000`, `Improvisador ↑` y una consecuencia de tres renglones en castellano con acentos.
