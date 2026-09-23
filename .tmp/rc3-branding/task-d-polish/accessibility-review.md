# Revisión de accesibilidad — TASK-D

| Área | Estado | Evidencia |
|---|---|---|
| Teclado | PASS | E2E existentes recorren portada, formulario, juego y cierre por Tab/Enter (`home-event`, `competition`, `full-career`, `post-g1-accessibility-audit`, `practice`); las acciones nuevas son `<Link>`/`<a>`/`<button>` nativos. |
| Foco visible | PASS | anillo de 2 px separado 2 px (`base.css`); ningún `outline: none` agregado. |
| Orden de foco | PASS | DOM = orden visual; el podio conserva el orden de puestos del servidor (TASK-A). |
| Encabezados | PASS | portada `h1` Egresado → `h2` estado / cómo se juega / Ranking → `h3` puestos y datos; juego `h1` etapa → `h2` situación / resultado / hito; cierre `h1` Egresado → `h2` por sección; `not-found`/`error` con `h1`. |
| Landmarks | PASS | `main`, `header` (práctica), `footer` (`contentinfo`), secciones con `aria-labelledby`. |
| Reloj | PASS | cifras `aria-hidden`; fecha absoluta en `<time>` con zona; **sin live region**; el escalón de urgencia se dice con palabras («Últimos minutos») además del color. |
| Estados sin color | PASS | podio por numeral/filete, «(vos)» en texto, marcador del recorrido por palabra, franja por texto, urgencia por texto. |
| Contraste | PASS | `pnpm design:check`; los nuevos usos son tokens existentes (`text-red`, `border-ink`, lima sólo en acciones). |
| Reduced motion | PASS | todas las animaciones nuevas reutilizan `motion-enter`/`motion-resolve`, cuyas duraciones el bloque global lleva a 1 ms; `animation-delay` del medallero queda sin efecto visible. |
| Imágenes | PASS | escenas `alt=""` (ambientación redundante con eyebrow/título/prosa); logos del pie con `alt` porque el afiche aporta «Somos con otros», que no está en el texto visible. |
| Formularios / errores | PASS | sin cambios (TASK-A/B): errores asociados por `aria-describedby`, primer inválido enfocado. |
| Modales | N/A | no existen. |
| Alias | PASS | siempre como texto React; sin `dangerouslySetInnerHTML`; la frase funciona sin alias. |

Límites: axe corre en los E2E (WCAG 2.2 AA) y pasó en la barrida; no se
afirma prueba humana con lector de pantalla.
