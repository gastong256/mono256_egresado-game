# Plan de fallback e incidentes

## Niveles

### Verde — Normal
Backend y ranking operativos.

### Amarillo — Servicios secundarios degradados
Ranking/analytics falla; gameplay continúa.

### Naranja — Finish indisponible
Runs continúan y quedan `pending_sync` localmente.

### Rojo — Backend/start indisponible
Usar modo local de emergencia si fue prehabilitado para la feria.

## Fallback local

Una build estable puede incluir un `offline-fair-config` preversionado con:
- seed/configuración;
- contenido;
- ruleset;
- score local marcado no oficial.

Cuando vuelve el servicio, sólo sincronizar si el backend puede validar esa configuración y el evento lo permite.

## Regla de integridad

No mezclar silenciosamente scores locales no verificables con ranking oficial. Si no pueden validarse, mostrarlos sólo en dispositivo o en ranking separado/manual.

## Recuperación

- identificar ventana afectada;
- revisar logs;
- validar duplicados/idempotencia;
- reintentar pending sync;
- invalidar sólo runs realmente corruptas.

## Comunicación UI

Mensajes cortos:
- “Podés seguir jugando. El ranking se actualizará cuando vuelva la conexión.”
- “Resultado guardado en este dispositivo.”

Evitar errores técnicos al usuario.

## Incidentes de integridad del ranking

Cuando el ranking reparta premios, se agrega una severidad por encima de las cuatro anteriores.

### P0 — Integridad del ranking comprometida

Por ejemplo: se aceptó un score arbitrario enviado por un cliente, se usó una versión de score equivocada o apareció un error sistemático de evaluación.

1. detener las escrituras al leaderboard oficial si hace falta;
2. preservar logs, descriptores de run y action logs **antes** de tocar nada;
3. mantener el juego disponible sólo en estado no oficial, y decirlo con claridad;
4. arreglar y versionar;
5. reproducir y recalcular las runs afectadas si es posible;
6. comunicar la decisión del organizador.

### P1 — Los envíos fallan pero el juego funciona

Encolar y reintentar de forma idempotente. **No pedirle al jugador que rejuegue de inmediato**: su run está guardada y el reintento no puede crear una entrada duplicada.

### P2 — Nickname inapropiado

Ocultar de la pantalla pública preservando la referencia interna de participante y de run, que es lo que después permite resolver el premio.

### Regla

No se cambia score ni contenido en medio del evento como arreglo improvisado. Se usa el procedimiento versionado de [modo feria y congelamiento](fair-mode-and-competition-freeze.md).
