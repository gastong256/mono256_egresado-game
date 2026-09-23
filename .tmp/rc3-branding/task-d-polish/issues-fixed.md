# Problemas corregidos — TASK-D

Sólo lo relevante; el resto de la barrida fue verificación sin hallazgo.

| # | Superficie | Problema | Corrección | Evidencia |
|---|---|---|---|---|
| 1 | Juego · resultado del colectivo a 320 px | 9–20 px de scroll horizontal. Medido con un sondeo de `getBoundingClientRect` sobre la pantalla real: el elemento que sobresalía era el **sello rotado** del resultado («Llegaste tarde», «Sobre la hora»: hasta 14 letras, `shrink-0`, `-rotate-3`) al lado del título «Insuficiente»; el sello se había dimensionado para 360 px (comentario en `bus-latest-departure.ts`). | La fila título + sello ahora es `flex-wrap` con el grupo del título en `min-w-0`: cuando no entra, el sello baja de línea alineado a la derecha. De paso, la unidad del stepper numérico deja de ser `shrink-0` (`min-w-0` + `text-pretty`, input `min-w-16`) para que una unidad larga se parta en dos palabras en vez de empujar. Sondeo posterior: 0 elementos fuera del viewport. | `02-feedback-320-fixed` |
| 2 | Portada UPCOMING y CLOSED | ningún primario en pantalla: la única acción jugable (práctica) era un enlace de texto | «Probar sin competir» toma el estilo lima y `data-primary` cuando la competencia no está abierta; en CLOSED se suma «Ver resultados» (ancla al ranking) | `home-upcoming-*`, `home-closed-*` |
| 3 | Reloj del evento | misma intensidad a tres días que a tres minutos | escalones reales por tiempo restante (`calm` > 24 h, `near` < 24 h, `high` < 1 h, `critical` < 10 min): rótulo con palabra («Cierra en menos de una hora», «Últimos minutos») y color, filete de tinta bajo un día, segundos con pop bajo diez minutos | `home-open-urgent-*`, test |
| 4 | CTA «Jugar ahora / de nuevo» | entraba sin énfasis | `motion-resolve` al montar y `hover:-translate-y-px`; sigue siendo el único lima | `home-live-*` |
| 5 | Cierre de carrera | puntaje y hitos aparecían sin llegada | puntaje con `motion-resolve`; tarjetas del medallero con `motion-enter` escalonado (70 ms) | `competition-top-*` |
| 6 | Cierre y hitos de año | ningún momento nombraba al jugador | alias en el cierre de 7.º, el de 5.º y el egreso; neutro sin alias; nunca HTML | `06-milestone-grade-7-*`, `competition-*` |
| 7 | Metadata | título y descripción fijos aunque hubiera edición configurada | `generateMetadata` con nombre y estado de la edición + OG textual; `/test` y layout con descripción coherente | HTML del build |
| 8 | Páginas de framework | 404 y error de render con la plantilla genérica de Next | `not-found.tsx` y `error.tsx` en la hoja de Egresado, con vuelta a la portada y sin detalle técnico | `curl /no-existe` |
| 9 | Cierre a 320 px (heredado) | el tilde del numeral «Egresado» no entraba | oculto bajo 360 px sólo en el egreso (TASK-C) | `competition-top-320` |

No hubo hallazgos de consola, hidratación, `key`, `404` de assets ni
`requestfailed` en ninguna superficie de la barrida.
