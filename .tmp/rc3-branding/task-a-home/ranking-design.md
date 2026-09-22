# Ranking

`Leaderboard` agrupa por `entry.rank`, sin recalcular ni ordenar scores. Lista
ordenada de puestos, cada uno con lista de participantes; DOM 1/2/3 según la
respuesta, sin intercambiar 1 y 2 mediante CSS. No agrega un puesto que el
comparador saltó. El primero tiene numeral mayor, filete más grueso y escalón más
alto; segundo y tercero conservan una jerarquía decreciente sin medallas/colores
nuevos. En mobile los bloques se apilan a ancho completo.

Empates enteros sin slice. Cuando sólo existe un puesto, usa el ancho disponible
y distribuye los alias en columnas en desktop. Alias largos permiten wrap.
Cada score conserva formato es-AR y el texto «puntos»; Prestige no se publica.

`isYou` decide la pertenencia al podio, con texto `(vos)` y borde. Fuera del podio,
se muestra puesto y mejor score del resumen propio. Se reemplazó la inferencia anterior
`rank > entries.length` por pertenencia explícita. La auditoría del comparador
confirma ranking 1/1/3/3/3/6: no se afirma un bug histórico con datos válidos. No se agrega una lista pública de puestos inferiores: la fuente sigue
siendo Top 3 por puesto para minimizar exposición.

Vacío: invita a publicar la primera partida sólo OPEN, anticipa UPCOMING y dice
sin resultados CLOSED. Cerrado prioriza «Resultados del evento», sin inventar
una adjudicación final antes de envíos pendientes/moderación.

Tests: cero entradas, un puesto, 1/2/3, puestos omitidos, múltiples empatados,
usuario dentro/fuera, caso de cinco filas y puesto propio 6, cerrado, mobile,
zoom, axe y regresión del comparador/DTO existente.
