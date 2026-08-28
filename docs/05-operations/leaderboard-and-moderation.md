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

## Dirección propuesta para el ranking de feria

**RECOMENDADA / TEACHER GATE.** Extiende —no reemplaza todavía— la regla de ranking de arriba. Las reglas de score están en [score competitivo y ranking](../01-game-design/competitive-scoring-and-ranking.md); la operación y el congelamiento, en [modo feria y congelamiento](fair-mode-and-competition-freeze.md).

### Mejor intento, no suma

El leaderboard guarda el **personal best verificado** de cada participante. Acumular intentos convertiría el ranking en una medida de tiempo disponible en la feria. La regla de «mejor run por player/session» de arriba ya apunta en esa dirección; lo que agrega la recomendación es que el mejor intento sea la definición explícita del score del participante, y que la política de intentos sea configuración del evento.

### Comparador extendido

Comparación lexicográfica versionada, guardando el desglose completo para auditoría:

`FairScore` → desempeño matemático → cantidad de óptimos → precisión → dificultad resuelta → tiempo activo.

La matemática decide antes que la velocidad. El desempate vigente —óptimos, precisión, tiempo— es el mismo criterio con menos escalones.

### Empate exacto

**OPEN.** No se agrega ruido aleatorio al score para forzar unicidad. La política —puesto compartido, premio compartido o desempate anunciado— la decide el organizador por escrito antes de la feria. Un identificador interno puede dar orden de visualización estable, pero no puede decidir un premio en silencio.

### Determinación de ganadores

El premio se resuelve **sólo sobre runs verificadas y sobre el mejor intento**. Antes de la feria, el organizador aprueba: cantidad de ganadores, política de intentos, comparador, política de empate, horario de cierre, tratamiento de envíos pendientes tardíos y reglas de nickname.

### Exportación auditable

Al cierre se exporta la lista de candidatos con id interno de participante, nickname, id de la mejor run, desglose de score, tupla de versiones, estado de verificación y métricas de desempate. Existe para que el organizador confirme ganadores sin depender de la pantalla pública.

### Qué no se publica

Ni dominio matemático oculto, ni métricas de razonamiento, ni identificadores personales. Las métricas secundarias en público sólo si los docentes las aprueban.
