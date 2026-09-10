# Threat model

## Activos

- integridad del leaderboard;
- disponibilidad durante feria;
- datos pseudónimos de jugadores;
- secretos de backend;
- integridad de contenido/reglas.

## Amenazas

### T1 Score falsificado
Actor modifica JS/request.

**Mitigación:** replay y scoring server-side.

### T2 Finish repetido
Intenta duplicar entradas.

**Mitigación:** endpoint idempotente; estado completed; constraints DB.

### T3 Creación masiva de runs
Spam/DoS ligero.

**Mitigación:** rate limits, quotas por evento/IP/session.

### T4 Nickname ofensivo
Contenido visible en proyector.

**Mitigación:** validación + filtro + ocultamiento manual inmediato.

### T5 Enumeración/lectura de runs
Acceso a datos no necesarios.

**Mitigación:** IDs no secuenciales, endpoints públicos sólo agregados/ranking, RLS/permisos.

### T6 Secret leakage
Clave Supabase elevada en bundle.

**Mitigación:** secret sólo env server; revisión de build/env.

### T7 Manipulación de elapsed time
Intenta alterar métricas temporales para ganar ventaja.

**Mitigación:** excluir tiempo de FairScore, Prestige y ranking v1. Timestamps y
plausibility checks sólo operativos/diagnósticos, sin penalizar razonamiento lento.

### T8 Version skew
Cliente viejo finaliza contra reglas nuevas.

**Mitigación:** versiones en run; replay según versión; rechazar incompatibilidad explícitamente.

### T9 Wi-Fi caído
No es atacante, pero amenaza disponibilidad.

**Mitigación:** gameplay local-first y sync diferido.

## Riesgo aceptado

No se intenta impedir a un actor altamente motivado que automatice respuestas correctas leyendo el cliente. Para una feria escolar, el objetivo es evitar manipulación trivial del score y detectar outliers. Un anti-cheat invasivo sería desproporcionado.

## Amenazas que agrega la competencia con premios

Se suman a las anteriores cuando el ranking decide premios. Los controles se dimensionan al riesgo: esto es una feria escolar, no una plataforma de esports, pero el browser no puede decidir un premio.

### T10 Action log modificado
El cliente envía una secuencia de comandos que nunca ocurrió.

**Mitigación:** el replay determinista valida legalidad de cada comando contra el estado; una secuencia imposible se rechaza con un código de motivo que no filtra información sensible.

### T11 Descriptor de run manipulado
El cliente altera seed, versiones o asignación de variantes para recibir una run más fácil.

**Mitigación:** el descriptor lo emite y lo guarda el servidor; se valida la ligadura run–participante–evento; se rechaza cualquier asignación de variante desconocida.

### T12 Mezcla de versiones en una competencia
Un envío oficial llega con una tupla de versiones distinta de la congelada del evento.

**Mitigación:** el evento habilita explícitamente una única tupla y rechaza el resto. Es T8 visto desde la integridad del premio, no sólo desde la compatibilidad.

### T13 Reintento hasta recibir una run fácil
No es una intrusión: es un uso del reglamento que rompe la comparabilidad.

**Mitigación:** Competition Seed compartida emitida/registrada por servidor por
edición; mismas variantes, dificultad fija, estado raro y oportunidades en cada
reintento. RunId único no cambia ese plan; Practice no compite oficialmente. Ver [auditoría de equidad competitiva](competition-fairness-audit.md).

### T14 Consumo de recursos sin restricción
Ráfagas de emisión de runs, envíos gigantes o action logs desmedidos.

**Mitigación:** límites de tasa, tope de cantidad de comandos y de bytes del log, tamaño máximo de request y timeouts. Corresponde a OWASP API4; ver [base teórica](../07-reference/research-basis.md).

### T15 Abuso de privilegio administrativo
Las acciones de moderación pueden cambiar lo que el público ve.

**Mitigación:** rol administrativo autenticado, mínimo privilegio y auditoría de actor, motivo y timestamp. **La obscuridad de una URL no es autorización.**

La arquitectura de estas mitigaciones está en [arquitectura objetivo del motor](../03-architecture/target-engine-architecture.md); su operación, en [modo feria y congelamiento](../05-operations/fair-mode-and-competition-freeze.md).
