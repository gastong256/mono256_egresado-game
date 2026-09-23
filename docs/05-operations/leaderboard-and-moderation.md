# Leaderboard y moderación

**Dirección de producto v1 LOCKED; runtime implementado en STAGE-09.**

## Principios y comparador

Competencia opcional, sólo runs oficiales válidas, pseudónimos y minimización de
exposición de menores. El comparador vive en [score competitivo y ranking](../01-game-design/competitive-scoring-and-ranking.md#desempate):
FairScore → Prestige → puesto compartido, sin velocidad ni criterio terciario.

Quedan supersedidos `official_score` como total legacy, la tupla
Math/óptimos/precisión/dificultad/tiempo y los candidatos de desempate temporal.
STAGE-09 debe usar FairScore recomputado, no el campo legacy `officialScore`.

## Mejor intento

Intentos ilimitados; una entrada por participante con su mejor resultado verificado
según el comparador, no suma de intentos. Se reutiliza la Competition Seed de la
edición conforme a [modo feria](fair-mode-and-competition-freeze.md).
La implementación está en [el cierre de STAGE-09](../06-delivery/stage-09-fair-mode-server-ranking.md):
el mejor intento sale de la vista `competition_best_attempts`, el puesto lo
calcula un comparador puro y la atomicidad la dan restricciones de la base, no
un lock del proceso.

## Pantalla pública vigente RC3

[ADR-031](../03-architecture/adr/ADR-031-persisted-run-summary-ranking-window.md)
amplía el Top 3 a una ventana de doce filas como máximo, con mejor partida,
contexto propio, métricas del juego e hitos. Todos los empatados cuentan: la fila
representante declara «Compartido con X más» y mantiene el puesto original.
El comparador y los premios no cambian. Sin copy de vergüenza ni juicios sobre
la persona. Nunca curso real, edad, nombre legal, contacto o mastery.

Los resúmenes antiguos se completan fuera del tráfico público con
`pnpm competition:summaries` (diagnóstico) y `pnpm competition:summaries -- --write`
(escritura explícita). Guardar respaldo antes. Las versiones no soportadas se
omiten; no se reinterpreta una partida con reglas actuales incompatibles.
No requiere migración SQL. La versión anterior de la app ignora el JSON adicional.

## Moderación

Operadores autorizados pueden ocultar nickname manteniendo score como “Jugador
oculto”, invalidar por abuso y restaurar, descalificar y reincorporar. Cada
acción audita actor, fecha y motivo — y guarda **qué campos** cambiaron, nunca
sus valores: un log con el nombre viejo y el nuevo sería una segunda copia del
dato personal en un lugar que nadie purga.

Implementado en `/organizer`, detrás de una credencial de despliegue derivada
con scrypt y una sesión opaca de ocho horas. Una entrada nunca se borra: ocultar
el alias conserva el puesto y el puntaje, porque borrarla le daría a un insulto
el poder de sacar a alguien del ranking.

## Cierre, premios y exportación

El premio se resuelve sobre runs verificadas y mejores intentos; el organizador
acuerda premios compartidos o un desafío común separado si necesita un ganador
único. Un ID interno sólo estabiliza display, nunca define un ganador.

Antes de abrir se anuncian comparador, intentos, horario de cierre, tratamiento de
envíos pendientes y moderación. Al cierre se exporta un CSV con puesto, alias,
nombre, año, división, últimos cuatro dígitos, mejores puntajes, cantidad de
intentos y elegibilidad — sin clave de identidad, sin tokens, sin IP y sin logs
de acciones. El texto del alias se neutraliza contra inyección de fórmulas.
Retención y tooling quedaron cerrados en
[STAGE-09](../06-delivery/stage-09-fair-mode-server-ranking.md); el procedimiento
operativo está en el [runbook](fair-runbook.md#operación-de-la-competencia-implementada).

## Desempates externos — aclaración RC4

Si hace falta un desempate fuera del juego, el Departamento de Matemática del
establecimiento organizador define los criterios y resuelve la decisión.
Egresado no dispone de esa función ni es responsable de esa decisión externa:
su ranking mantiene los puestos compartidos. La aclaración aparece en `/puntajes`
y no autoriza a cambiar puntajes, comparador o versiones de partidas.

## Cantidad de desafíos en el detalle

«Ver partida» muestra `components[math].opportunities` como desafíos resueltos,
porque cada desafío ordinario puntuable aporta evidencia matemática y el score
excluye los repasos. `recoveries` se presenta por separado si es mayor que cero.
`eventsPlayed` conserva su significado de eventos totales (incluye narrativa)
y deja de mostrarse como «situaciones jugadas». No se modifica el JSON guardado:
el cambio se aplica también a resúmenes v1 existentes, sin backfill ni replay.
Sin componente matemático se omite la cantidad, sin deducirla del total de eventos.

## Presentación RC6

El ranking público usa el resumen persistido existente. Podio escalonado por
puesto real, filas comunes compactas y fila propia marcada sin depender de hover.
Los iconos de reconocimientos explican hitos existentes; no crean premios ni
puntos nuevos. Todas las filas conservan el detalle, agrupado por aportes al
puntaje, reconocimientos, años y estilo. El total proviene de `fairScore` oficial;
no se reconstruye sumando indicadores de carrera.
Sin migración, seed, backfill ni replay adicional para desplegar RC6. Los registros
sin resumen conservan el fallback de puntaje y detalle no disponible.
