# Matriz de superficies — TASK-D

Cada fila se capturó en un build de producción local a 320 / 360 / 390 / 412 /
768 / 1280 / 1440 px y al 200 % de zoom sobre 1280, con reduced motion, consola
y red vigiladas (`qa-sweep.ts`, fuera del repo). Los estados de portada se
inyectaron por `page.route` sobre `/api/competition/state` como hace el E2E de
TASK-A; el juego se reanudó desde checkpoints reales de práctica; los cierres
se verificaron contra el servidor local.

| Surface | Estado | Overflow | Primarios | Consola / red | Resultado |
|---|---|---|---|---|---|
| `/` OPEN (edición real «Feria local», 60+ verificados) | live | 0 | 1 | limpia | PASS · LCP 372 ms · CLS 0,000 |
| `/` OPEN con reloj (cierra en 2 h) | fixture | 0 | 1 | limpia | PASS |
| `/` OPEN últimos minutos (cierra en 8 min) | fixture | 0 | 1 | limpia | PASS · `data-urgency=critical`, «Últimos minutos» |
| `/` UPCOMING (abre en 26 h) | fixture | 0 | 1 (práctica) | limpia | PASS · antes 0 primarios |
| `/` CLOSED | fixture | 0 | 1 (práctica) + «Ver resultados» | limpia | PASS |
| `/` ranking vacío | fixture | 0 | 1 | limpia | PASS |
| `/` ranking con empate en 3.º y alias largo | fixture | 0 | 1 | limpia | PASS |
| `/` jugador en el podio (2.º, «vos») | fixture | 0 | 1 | limpia | PASS |
| `/` jugador fuera del podio (17.º) | fixture | 0 | 1 | limpia | PASS |
| Identificación | live | 0 | 1 | limpia | PASS |
| `/test` intro y reanudar | live | 0 | 1 | limpia | PASS |
| Juego: apertura 7.º | checkpoint | 0 | 1 | limpia | PASS |
| Juego: colectivo (numérico, ilustración) | checkpoint | 0 | 1 | limpia | PASS |
| Juego: resultado del colectivo | checkpoint | **9 px @320 → 0** | 1 | limpia | FIXED (sello rotado del resultado; ver `issues-fixed.md` #1) |
| Juego: 25 de Mayo (grilla) | checkpoint | 0 | 1 | limpia | PASS |
| Juego: aula de 1.º (plano) | checkpoint | 0 | 1 | limpia | PASS |
| Juego: «Ir al Repaso» | checkpoint | 0 | 1 | limpia | PASS |
| Juego: Repaso (notas + situación) | checkpoint | 0 | 1 | limpia | PASS |
| Juego: hito de 7.º, 2.º y 5.º | checkpoint | 0 | 1 | limpia | PASS |
| Cierre competencia: 1.º compartido (10.000) | live | 0 | 1 | limpia | PASS · alias en «Egresaste, …» |
| Cierre competencia: fuera del podio (1.725) | live | 0 | 1 | limpia | PASS |
| Cierre práctica: baja / alta / red caída | live | 0 | 1 | limpia | PASS |
| `not-found` / `error` | nuevas | — | 1 | — | PASS (lint/typecheck; render en build) |

Sin `404` de assets, sin `requestfailed`, sin warnings de React/hidratación.
La única entrada de consola en toda la barrida fue «Deprecated API for given
entry type», emitida por el `PerformanceObserver` del propio script de medición.
