# Auditoría de equidad competitiva

**Estado: auditoría reducida post-TG1 ejecutada / auditoría completa pendiente.** STAGE-05/STAGE-06 implementaron el mecanismo y la [auditoría post-Gate](post-teacher-gate-1-score-audit.md) verificó `fair-score-dev-2`. Esto no reemplaza evidencia con estudiantes ni una auditoría de competencia real.

Un ranking con premios es una afirmación sobre personas. Esta auditoría existe para poder defender esa afirmación con evidencia, no con intención.

Lo que se audita está definido en [score competitivo y ranking](../01-game-design/competitive-scoring-and-ranking.md); acá están las preguntas que hay que poder contestar.

## Evidencia de ingeniería disponible ahora

- `pnpm game:compose` compone, valida, serializa y recompone planes, y mide distribución y carga estructural.
- `pnpm game:score` ejecuta la política candidata sobre 23.000 planes y comprueba techo perfecto, normalización de oportunidades, dominancia matemática y recomputación determinista.
- `pnpm game:score -- --compare` compara la histórica `fair-score-dev-1` 80/15/5 con la candidata post-TG1 `fair-score-dev-2` 85/10/5, además de controles 90/10/0 y sin recompensa.

Esta evidencia prueba invariantes del mecanismo y exhibe el efecto de candidatos concretos. No prueba que la calibración sea pedagógicamente correcta, que las bandas sean psicométricamente equivalentes ni que un ranking real sea justo.

## Comparabilidad

- ¿Las runs tienen presupuesto de dificultad equivalente?
- ¿Alguna plantilla otorga sistemáticamente más puntos que otra para la misma habilidad?
- ¿Se puede reintentar hasta recibir un calendario más fácil?

Si la respuesta a la tercera es sí, el descriptor de run tiene que emitirlo el servidor y el equiparado tiene que ser real, no nominal.

## Dominancia

- ¿`MathPerformance` domina efectivamente el score final?
- ¿Aura o Equipo pueden superar a una run matemáticamente mejor?
- ¿Promedio se está contando dos veces?
- ¿Algún eje de Estilo queda premiado indirectamente por el diseño del score?

La última es la más fácil de romper sin darse cuenta: si el bonus por eficiencia empuja siempre hacia Estratega, Estilo dejó de ser identidad y pasó a ser una build óptima.

## Sesgo de velocidad

- ¿Un jugador más lento y más preciso pierde contra uno mucho más rápido y menos preciso?
- ¿El tiempo activo participa sólo como desempate tardío?

El producto ya declara que el score no debe estar dominado por la velocidad, por accesibilidad y porque premia el cálculo mental sobre el razonamiento. Ver [reglas, scoring y progresión](../01-game-design/rules-scoring-and-progression.md).

## Sesgo de volumen de intentos

- ¿El leaderboard usa el mejor intento y no la suma?
- ¿Los intentos ilimitados son una política deliberada de aprendizaje o un descuido?

## Análisis de empates

Simular el comparador y estimar la tasa de empate. **No se agrega ruido aleatorio al score para forzar unicidad**: un score con decimales inventados deja de poder explicarse. Si quedan empates, la política de premio la decide el organizador, por escrito y antes de la feria.

## Transparencia

La regla publicada tiene que poder decirse en tres frases y coincidir con lo que hace el código. Si la explicación pública y la fórmula no coinciden, la que está mal es la fórmula.

## Entregable

La auditoría produce una tabla de respuestas con evidencia —salidas de simulación, distribuciones, tasas— y una lista explícita de lo que quedó sin resolver. Un «se ve bien» no cierra ningún punto.

La **auditoría completa** se ejecuta recién sobre contenido final, dificultad y `ScorePolicy` aprobadas, política de intentos y empates decidida, fair mode real y catálogo oficial congelado. Debe sumar distribución entre participantes, tasa de empate, sesgo por volumen/velocidad, elegibilidad, personal best y operación autoritativa; la auditoría reducida actual no reemplaza nada de eso.
