# Metadata — TASK-D (B23 parcial)

| Item | Antes | Ahora | Fuente |
|---|---|---|---|
| `<title>` de `/` | «Egresado — un juego sobre decidir en la escuela» (fijo) | «Egresado · {nombre de la edición}» cuando hay edición; el fijo si no | `readPublicState()` en `generateMetadata` (misma lectura que la página; sin datos de sesión) |
| `description` de `/` | fija | por estado: abierta / próxima / cerrada / sin edición, siempre con «de 7.º a 5.º» y «decisiones con números» | idem |
| OpenGraph textual de `/` | ninguno | `title`, `description`, `type: website`, `locale: es_AR` | idem |
| `/test` | «Modo práctica \| Egresado» | «Modo práctica · Egresado» + description + OG textual | estático |
| Layout | «Un juego web de decisiones y desafíos matemáticos.» | «Un juego web sobre decidir en la escuela: la secundaria de 7.º a 5.º en decisiones con números.» | estático |
| `lang` | `es-AR` | sin cambio | layout |
| viewport | `width=device-width, initialScale 1, viewportFit cover, themeColor` | sin cambio (API `viewport` de Next) | layout |
| `manifest.webmanifest` | nombre/descr. | sin cambio de assets | `manifest.ts` |
| Alias en metadata | — | **nunca** | — |

Verificado en el HTML del build (`<title>Egresado · Feria local</title>` con la
edición local; `og:title`/`og:description`/`og:locale` presentes).

DEFERRED TO BRANDING: favicon final, app icons, OG image, social mark, logo,
hero. No se agregaron placeholders.
