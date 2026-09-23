# Revisión responsive — TASK-D

Piso real: 320 px (`html { min-width: 320px }`). Columna de juego 412 px
centrada; portada hasta 960 px (`max-w-event`).

| Ancho | Portada | Juego | Cierre | Notas |
|---|---|---|---|---|
| 320 | apila promesa y acceso; podio en una columna; reloj en 4 celdas | ilustración 16:9 de 143 px; stepper con unidad en dos palabras | numeral 66 px, tilde oculto bajo 360 | overflow del stepper corregido |
| 360 | idem | tira de carrera en dos líneas si hace falta | tilde visible | — |
| 390 / 412 | idem | ancho de diseño | — | — |
| 768 | dos columnas (promesa · acceso), podio en tres columnas | columna centrada | medallero en dos columnas | — |
| 1280 / 1440 | dos columnas hasta 960 px; título escala por `cqi` | centrada | centrada | — |
| 200 % zoom (1280) | reflow a una columna; sin scroll horizontal | — | — | — |

Reglas que se mantuvieron: nada resuelto con `nowrap`, `overflow: hidden` ni
tipografía diminuta; los textos con alias llevan `[overflow-wrap:anywhere]`
(máximo 24 caracteres por validación, pero un alias sin espacios de 24
caracteres a 320 px necesita poder partirse).

Corregido: la fila título + sello del `FeedbackPanel` se parte a 320 px (el
sello rotado de hasta 14 letras era lo que sobresalía); de paso, la unidad del
`NumericAnswer` deja de ser `shrink-0` (`min-w-0` + `text-pretty`, input con
`min-w-16`) para que «minutos antes» se parta en dos palabras.
Diferido a branding: nada responsive depende de assets de marca.
