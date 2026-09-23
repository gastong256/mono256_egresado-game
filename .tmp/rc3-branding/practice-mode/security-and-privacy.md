# Seguridad y privacidad

Sin campos de identidad: DNI, nombre, alias y año real no se piden ni persisten.
No se crean cookies. Los fetch omiten credenciales; una cookie competitiva existente
no se lee, escribe o invalida. El checkpoint local contiene sólo gameplay.

La única escritura servidor es la RPC existente `competition_bump_rate_limit`
sobre `rate_limit_counters`. No consultas a competitions/participants/sessions/
attempts/organizer, incluyendo la seed oficial. Prueba real sobre Postgres observa
exactamente dos RPC durante emisión/verificación y compara estado antes/después.
El ranking, mejor intento, tablas y cookie se mantienen iguales.

`practice-limits-v1`: 120 emisiones y 240 verificaciones / 300 s por dirección
hasheada con secreto existente, dominio y bucket separados. Permite ráfaga escolar.
Dato derivado de seguridad, no IP cruda: no se afirma cero datos técnicos. Hereda
la purga por window_start. Proxy confiable provee IP/origen; no es defensa ante
DoS distribuido. Error de contador público → 503 antes de composer/replay. Local
sin DB usa memoria, podada y limitada a 2048 claves, nunca en producción pública.

Issue exige `{}` de hasta 1 KiB. Verify acepta sólo `{actionLog}` hasta 256 KiB
medidos al leer el stream; máximo 512 comandos del codec real. Rechaza overrides,
queries de API, body/descriptor/versiones/plan alterados y origen cruzado. Valida
Host/protocolo externo incluso si Next reconstruye una URL interna. No admite
score/egreso/resumen aportados por cliente. Recompone plan desde seed y hace replay.

Respuestas no-store y mensajes sanitizados; logs `scope: practice`, evento,
resultado/código/duración, sin bodies, acciones, seed, cookies, IP o PII. No nuevo
proveedor. `/test` recibe nonce CSP por request; no nuevas directivas ni recursos
externos. `/dev`, `/demo` y `/debug` conservan sus restricciones. Query de página
no controla seed, contenido ni estado. No muestra catalogs, snapshots o debug.
