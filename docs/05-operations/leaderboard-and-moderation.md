# Leaderboard y moderación

**Dirección de producto v1 LOCKED; runtime no implementado.**

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
La implementación transaccional, identidad y persistencia siguen pendientes.

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
oculto”, ocultar entrada, invalidar por abuso y restaurar. Cada acción audita actor,
fecha y motivo. No se selecciona un schema o sistema de auth en este documento.

## Cierre, premios y exportación

El premio se resuelve sobre runs verificadas y mejores intentos; el organizador
acuerda premios compartidos o un desafío común separado si necesita un ganador
único. Un ID interno sólo estabiliza display, nunca define un ganador.

Antes de abrir se anuncian comparador, intentos, horario de cierre, tratamiento de
envíos pendientes y moderación. Al cierre se exportan identificador interno,
nickname, run elegida, FairScore/Prestige y desglose, versiones y verificación,
sin datos personales innecesarios. Retención y tooling administrativo se cierran
en STAGE-09 bajo [operaciones](fair-mode-and-competition-freeze.md).
