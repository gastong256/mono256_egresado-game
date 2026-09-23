# Feedback de desempeño — TASK-C

**Presentation-only.** La franja se lee del FairScore verificado (escala
0–10.000) y no se guarda, no rankea y no cambia ningún número. Sin puntaje
del servidor (verificando, red caída, rechazado) no hay franja ni frase.

## Franjas

| Band | Umbral | Por qué ahí (calibración `fair-score-v1`: Óptimo 10.000 · Resuelto 7.500 · Parcial 4.000 · Insuficiente 1.000; matemática 85 %) |
|---|---|---|
| exceptional | ≥ 9.500 | Sólo una carrera casi toda Óptima llega: un Resuelto entre nueve ya baja de 9.800, dos lo dejan cerca del umbral. |
| strong | ≥ 8.000 | Mayoría de Óptimos con un par de Resueltos, o siete Óptimos y dos Insuficientes rondan 8.000. |
| solid | ≥ 6.000 | Todo Resuelto ronda 7.500; mitad Óptimo y mitad Parcial ronda 7.300. |
| weak | ≥ 4.000 | Todo Parcial ronda 4.000. |
| struggling | < 4.000 | Mayoría de Insuficientes. |

Fuente de la escala: `src/game/scoring/competitive-policy.ts`. Los umbrales
viven en `PERFORMANCE_THRESHOLDS` y sus bordes están testeados.

## Frases

| Band | Debajo del puntaje | Antes de las acciones |
|---|---|---|
| exceptional | Un recorrido de los que se cuentan. | Casi nada quedó sobre la mesa. Si volvés a jugar, es por gusto. |
| strong | Gran recorrido. | Sólido de punta a punta. Lo que falta está a un par de decisiones. |
| solid | Buen recorrido, con margen para rascar. | Estuviste bien. Una segunda vuelta puede mover bastante ese número. |
| weak | Egresaste. Digamos que no sobró demasiado. | Hay mucho puntaje todavía sobre la mesa, y ya conocés el camino. |
| struggling | Safaste: el diploma está, y el margen para mejorar también. | Llegaste al final, pero ese puntaje pide revancha. La próxima arranca con todo esto ya visto. |

## Reglas de tono (revisión de humor)

- Se ríe **de la partida**, no de la persona: «no sobró demasiado», «pide
  revancha», «safaste» hablan del resultado. Ninguna frase nombra capacidad,
  inteligencia ni compara con otras personas.
- Sin insultos, sin doble sentido, sin alcohol, sin «fracaso/pésimo/peor».
  Test: `ending-model.test.ts` y `career-ending.test.tsx` buscan esas palabras.
- La franja baja siempre trae una dimensión de mejora («ya conocés el
  camino», «la próxima arranca con todo esto ya visto»), nunca un tutorial.
- La intensidad sube con la franja: «gran recorrido» es strong; «de los que se
  cuentan» queda para exceptional. Nada de «increíble/legendario».
- «Safaste» es la referencia del PO: natural en Argentina, coloquial, no
  agresivo, y en 7.º el acto ya usa «Zafaste» como sello. Se usa una vez.

## Combinación con estilo

No se combinan por combinatoria. La franja habla del puntaje; el estilo
(`derivePlayStyle`) habla de cómo se jugó y tiene su propia línea. Son dos
lecturas separadas del mismo estado.
