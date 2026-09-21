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

## Pantalla pública v1

Top 3 destacado, nickname/pseudónimo, FairScore y Prestige secundario; iconografía
de Hitos opcional. El Top 3 refiere a puestos: un empate legítimo no se corta
arbitrariamente para mostrar exactamente tres personas.

La posición propia, resultado y personal best pueden mostrarse privadamente al
jugador, con CTA de reintento. Se supersede el top5/10 genérico y no se exige una
lista pública infinita de estudiantes con posiciones bajas. No se muestran curso,
edad, nombre legal, contacto, mastery ni métricas ocultas. Sin copy de vergüenza,
comparaciones de valor personal o rachas de fracaso.

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
