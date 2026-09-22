# Countdown

`EventCountdown` consume los `opensAt`/`closesAt` ya publicados por
`PublicCompetitionSummary`; no hubo extensión de DTO, migración, env ni fecha
nueva de configuración.

- UPCOMING → opensAt; OPEN → closesAt; CLOSED/no configurado → sin reloj.
- Ausente/inválida → el estado conserva su explicación y no inventa una fecha.
- SSR e hidratación comienzan con guiones y deadline real estático. El reloj se
  lee después del montaje. Cada tick vuelve a restar instantes absolutos: no
  decrementa un contador acumulando drift. `visibilitychange` recalcula al volver.
- Días/horas/minutos/segundos tabulares, bloques de dato existentes y microentrada
  por cifra. Reduced motion elimina esa animación. Ocultar contador elimina las
  actualizaciones visibles; mostrar vuelve al tiempo actual.
- Cifras visuales `aria-hidden`; el lector recibe fecha/hora absoluta en `<time>`,
  zona Argentina / UTC−3 explícita y etiqueta apertura/cierre. Sin live region.
- Cero → mensaje de espera y un refresh por frontera, sin cero perpetuo. El polling
  de portada continúa; no se inventa el estado del backend si la red falla.
- Limitación deliberada: el DTO no tiene serverNow. Un reloj local mal configurado
  puede desfasar el contador orientativo, nunca permisos o puntaje. La fecha
  absoluta se mantiene legible y el servidor decide en toda emisión.

Tests con fake timers: ambos destinos, cerrado, ausente/inválida, cero/vencido,
cambio de ventana, ocultar/mostrar, pestaña suspendida, fecha/zona/semántica y
SSR→hidratar con relojes distintos; E2E sobre el producto `/`.
