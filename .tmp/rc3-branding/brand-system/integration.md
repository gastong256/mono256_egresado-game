# Integración en el producto

## Superficies

| Superficie | Antes | Ahora | Por qué |
|---|---|---|---|
| Portada `/` (landing) | `<h1><Wordmark className="text-event-title"/></h1>` | `<h1><BrandLogo size="event"/></h1>` | La firma de TASK-A sigue en el mismo lugar, mismo rol fluido (`17cqi`): sólo se le suma el símbolo en línea base. Medido: el lockup ocupa 238 de 254 px a 320, 298/324 a 390 y 404/439 a 1280 (columna del `header`, la misma que mide el E2E de TASK-A). La CTA lima sigue siendo el único primario; reloj y ranking no cambian. |
| Portada, identificación | `<h1><Wordmark size="lg"/></h1>` | `<h1><BrandLogo size="lg"/></h1>` | Misma identidad al pedir datos. |
| `/test`, introducción | `<Wordmark size="lg"/>` | `<BrandLogo size="lg"/>` | Misma marca; el badge textual «Modo práctica» sigue diciendo el modo. |
| `/test`, encabezado fijo | eyebrow + nota | **`BrandMark` (28 px) + eyebrow + nota** | El único lugar del producto donde alguien juega con un encabezado a la vista: el símbolo solo, sin repetir el nombre (está en la introducción y en la pestaña). No roba altura: el encabezado ya medía 56 px. |
| `not-found` / `error` | `<Wordmark size="md"/>` | `<BrandLogo size="md"/>` | Consistencia; sin logo-enlace (los dos ya tienen su botón a la portada). |
| Harness `/dev/game-engine` | `<Wordmark size="lg"/>` ×2 | `<BrandLogo size="lg"/>` ×2 | Herramienta de desarrollo, misma identidad. |
| Vitrina `/dev/design-system` | tile «Wordmark» | tile «Marca»: lockup `lg` y `sm`, símbolo a 16/24/32/64, mono, reversa sobre pizarra e `icon.svg` a 16/32/48 | Referencia viva del sistema. |
| Juego (desafíos, resultados, Repaso, hitos) | sin marca | **sin marca** | Contenido e ilustraciones son protagonistas (§70). En competencia no hay encabezado; en práctica el símbolo del encabezado fijo alcanza. |
| Ending | numeral «Egresado» + tilde | **sin símbolo** (evaluado) | Ver abajo. |
| Metadata | título, descripción, OG textual de TASK-D | + `favicon.ico`, `icon.svg`, `apple-icon.png`, `icons` del manifiesto | Sin alias ni datos en metadata; OG image diferida al hero. |

## Ending: evaluación del símbolo junto a «Egresaste»

Se prototiparon tres variantes por inyección DOM sobre el cierre real de práctica (sin cambiar código), a 320 y 390 px:

| Variante | Evidencia | Veredicto |
|---|---|---|
| A · actual: numeral de 66 px + tilde verde | `evidence/ending-header-A-current-390.png` | **Se conserva.** El tilde es el device de «completado» de todo el sistema y el numeral ya es el wordmark a tamaño de hito. |
| B · el símbolo reemplaza al tilde (56 px) | `evidence/ending-header-B-mark-replaces-tick-390.png` | Descartada: «Egresado» a 66 px más el símbolo no entran por debajo de 412 px (el símbolo queda cortado a 390) y se pierde el lenguaje de hito. |
| C · símbolo chico (22 px) al final de la fila del eyebrow | `evidence/ending-header-C-mark-in-eyebrow-390.png` | Descartada: queda huérfano en la esquina y no refuerza «Egresaste»; agrega un elemento sin función a la pantalla que más importa. |

Lo que sí se corrigió del ending, porque TASK-D lo había diferido a branding: «Egresado» a 66 px mide 285 px y la hoja de 320 px le da 256, así que la palabra cruzaba el borde. `Milestone` baja el `h1` del cierre a 56 px sólo por debajo de 360 px (`max-[359px]:text-[3.5rem]`); el tilde sigue oculto ahí. Los hitos de año no cambian.

## Reportes de `.tmp` consultados y qué aportaron

| Reporte | Aporte concreto | Estado |
|---|---|---|
| `task-01-discovery/05-brand-direction.md` (brief del sistema de logo) | «El acabado final se redibuja en SVG editable y el nombre se compone con Schibsted real; no se vectoriza a ciegas el ruido del raster», «mark ≥ 2 px de trazo a 16 px», «favicon con fondo papel opaco y margen 12–16 %», «marca junto al nombre visible: decorativa». Todo se aplicó. | VIGENTE |
| `task-01-discovery/05` (concepto del mark: «gesto de camino con una inflexión», «birrete automático» en la lista de evitar) | El PO eligió después el concepto Σ + birrete; el brief conceptual de TASK-01 queda superado por esa decisión. | SUPERADO por la aprobación del PO |
| `task-01-discovery/06-implementation-plan.md` (TASK-02) | Rutas probables (`wordmark.tsx`, `competition-experience.tsx`, `manifest.ts`, `public/assets/brand/`, `src/app/favicon.ico`, `apple-icon.png`), «wordmark puede seguir siendo texto», «el mark es un master; las variantes se derivan». Aplicado tal cual. | VIGENTE |
| `task-01-discovery/06` (`src/app/opengraph-image.png` en el árbol de ingesta) | No se crea: la OG definitiva incorpora el hero (§76). | DIFERIDO |
| `task-01-discovery/11-existing-assets-inventory.md` | Confirmó que no existía ningún favicon, logo ni ícono, y que `TickMark` no debe convertirse en marca. | VIGENTE |
| `task-01-discovery/07-risks-and-guardrails.md` | «Mark distinto de TickMark; no usar color de resultado en selección»; «logo final tipográfico manual». El rombo verde es el único verde del símbolo y no aparece en ninguna opción. | VIGENTE |
| `task-a-home/ux-decisions.md` + `docs/09-design-system/foundations.md` (portada) | `text-event-title` escala por `cqi` para no solaparse al 200 %; el E2E mide el `h1` dentro de su columna. El lockup entra en ese contrato en lugar de cambiarlo (medido: 91–93 % de la columna). | VIGENTE |
| `task-a-home/footer-integration.md` | Los tres logos institucionales conservan su fondo y su rol; el de Egresado no compite ahí. No se tocó el pie. | VIGENTE |
| `task-d-polish/issues-deferred.md` | «Favicon, app icons, logo → BRANDING» (hecho); «rol fluido para «Egresado» a 320 px → BRANDING/DS» (resuelto de forma acotada, ver arriba); «`alt` de los logos del pie» (no se toca: sigue siendo decisión de contenido del afiche, no de marca). | HECHO / HECHO / SIN CAMBIO |
| `task-d-polish/metadata-review.md` | Título, descripción, `lang`, viewport y OG textual se mantienen; sólo se suman los íconos. «Alias en metadata: nunca» sigue valiendo. | VIGENTE |
| `task-d-polish/accessibility-review.md` | Encabezados: `h1` «Egresado» en portada y cierre. El lockup no cambia el nombre accesible (test de componente y E2E de fundación). | VIGENTE |
| `task-d-polish/responsive-review.md` | Nada resuelto con `nowrap` ni tipografía diminuta; el lockup se midió a 320–1440 y al 200 %. | VIGENTE |
| `task-d-polish/motion-review.md` | Sin animación nueva: el símbolo no se anima. | VIGENTE |
| `task-c-ending/ux-decisions.md` | Jerarquía del cierre («Egresaste» primero y más grande; sin reveal escalonado). El símbolo no entra para no competir con esa jerarquía. | VIGENTE |
| `task-b-copy/README.md`, `practice-mode/ux-flow.md` | Badge textual «Modo práctica · No participa del ranking.» como identidad del modo; se conserva y el símbolo se le suma. | VIGENTE |
| `scenario-artwork-integration/README.md`, `asset-mapping.md` | Convención: `resources/` es staging, los originales se retiran tras registrar SHA-256; `sharp` de Next para derivar; `public/assets/<familia>/`. Aplicado a `public/assets/brand/`. | VIGENTE |
| `docs/09-design-system/assets.md` (histórico) | «Sólo haría falta un SVG para favicon y OG… el concepto es un tilde verde sobre papel… todavía no está dibujado». Reescrito: el concepto aprobado es otro y ya está dibujado. | SUPERADO |

Ninguna contradicción quedó sin resolver: donde TASK-01 proponía otro concepto o un OG estático, manda la aprobación del PO y el alcance de esta etapa.
