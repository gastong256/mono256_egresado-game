# Leaderboard y moderación

## Principios

- Competencia opcional, no condición para disfrutar el juego.
- Mostrar pseudónimos.
- Evitar exponer curso/edad individual junto al score.
- Sólo runs oficiales válidas.

## Regla de ranking inicial

Ordenar por `official_score DESC`.

Desempate sugerido:
1. mayor cantidad de soluciones óptimas;
2. mayor precisión;
3. menor tiempo sólo como último criterio.

Documentar y mantener estable durante evento.

## Best run

Por defecto mostrar mejor run por player/session para evitar que una misma persona ocupe múltiples posiciones. Configurable por evento.

## Moderación

Acciones:
- ocultar nickname manteniendo score como “Jugador oculto”;
- ocultar entrada completa;
- invalidar run por abuso;
- restaurar.

Toda acción administrativa debe auditar actor, timestamp y motivo.

## Pantalla pública

Mostrar:
- top 5/10;
- cantidad de runs;
- perfil más común opcional;
- actualización reciente.

No mostrar datos que permitan identificar inequívocamente a un menor.
