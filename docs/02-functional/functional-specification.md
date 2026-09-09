# Especificación funcional

## FR-001 Inicio
El sistema debe permitir iniciar una experiencia sin crear una cuenta tradicional.

### Comportamiento
- Mostrar nombre del juego y CTA principal.
- Permitir nickname opcional/obligatorio según modo.
- Validar longitud y caracteres.
- Crear identidad anónima local.

## FR-002 Creación de run
En modos online oficiales, el cliente debe solicitar al servidor una run antes de jugar.

El servidor devuelve como mínimo:
- `run_id`;
- `seed`;
- `mode`;
- versiones de reglas/contenido;
- timestamp de inicio;
- configuración de evento.

## FR-003 Generación de carrera
A partir de seed y configuración, el motor debe producir una secuencia reproducible de años, desafíos y storylets.

**Diseño objetivo STAGE-08, no implementado:** la composición de carrera debe
respetar los [clusters y arcos](../01-game-design/full-career-content-matrix.md#políticas-de-composición)
y la madurez declarada de cada política. Los callbacks enriquecen la escena sin
requerir historia previa para comprenderla o resolverla, ni cambiar por sí mismos
el máximo de FairScore.

## FR-004 Presentación de etapa
El jugador debe conocer siempre la etapa escolar actual.

## FR-005 Resolución de desafíos
El sistema debe soportar múltiples interaction types definidos en `challenge-system.md`.

## FR-006 Evaluación
Cada acción debe generar un `ChallengeResult` determinista con:
- calidad;
- score parcial;
- explicación;
- cambios de stats;
- flags;
- datos de telemetría no sensibles.

**Diseño objetivo de contenido STAGE-08:** cada contribución de Math, Equipo,
Aura o Prestige requiere evidencia propia. En `y4.represent-class`, una propuesta
Math-valid, su comunicación pública y un logro histórico para Prestige son
hechos distintos; la aparición vale 0. En `y5.next-step-options`, FairScore sólo
evalúa viabilidad de escenarios hipotéticos: una preferencia personal opcional
alimenta Estilo/epílogo, nunca se califica como correcta o incorrecta. Ver las
fichas de [4.º](../01-game-design/grade-4-template-design.md) y
[5.º](../01-game-design/grade-5-template-design.md).

## FR-007 Feedback
Después de confirmar, el juego debe explicar la consecuencia antes de avanzar.

## FR-008 Herramientas
Los desafíos pueden habilitar herramientas. El schema declara cuáles están disponibles.

## FR-009 Persistencia local
La run activa debe guardar checkpoint tras cada evento completado.

## FR-010 Reanudación
Si existe checkpoint compatible con la versión actual, ofrecer reanudar.

## FR-011 Finalización
Al completar la carrera, generar tarjeta de egreso con score, perfil y resumen.

**Diseño objetivo de Career Epilogue v1:** convergencia visible del recorrido y
aproximadamente 3–5 hechos significativos; la selección exacta queda diferida.
El [sistema narrativo](../01-game-design/narrative-system.md) declara los insumos
y evita una descarga cruda del historial. Su pase detallado todavía está pendiente.

## FR-012 Ranking
En un evento competitivo, el sistema debe consultar y mostrar leaderboard según reglas del evento.

## FR-013 Reintento
El jugador puede iniciar otra run. El evento define si conserva o cambia seed.

## FR-014 Modo feria
Un evento debe poder definir:
- período de vigencia;
- seed o estrategia de seeds;
- ruleset;
- dificultad;
- límites de intentos si existieran;
- ranking;
- moderación.

## FR-015 Moderación
Operadores autorizados deben poder ocultar una entrada de ranking sin borrar necesariamente la run auditada.

## FR-016 Degradación de red
Una interrupción después del inicio no debe impedir continuar el gameplay local. El resultado puede quedar pendiente de validación/sincronización.

## FR-017 Versionado
Toda run oficial guarda `game_version`, `ruleset_version` y `content_version`.

## FR-018 Replay técnico
El backend debe poder reconstruir una run oficial a partir de seed, versiones y acciones para validar score.

## FR-019 Analytics
Registrar eventos mínimos definidos en `analytics-observability.md` sin requerir PII.

## FR-020 Pantalla pública
Debe existir una vista de leaderboard apta para proyector/TV en el modo feria.

## Requisitos administrativos post-MVP

### FR-A01 Gestión de eventos
Crear, activar, cerrar y archivar eventos.

### FR-A02 Contenido
Gestionar estados de contenido o importar paquetes versionados.

### FR-A03 Moderación
Ocultar/restaurar nicknames y scores.

### FR-A04 Exportación
Exportar estadísticas agregadas del evento.

## Requisitos objetivo del modo competitivo

**No implementados.** Estos requisitos aparecen cuando exista la feria con ranking y premios. Se numeran aparte para que nadie los confunda con comportamiento actual; su arquitectura está en [arquitectura objetivo del motor](../03-architecture/target-engine-architecture.md).

### FR-T01 Descriptor de run oficial
Antes de que una run pueda ser candidata a premio, el servidor emite un descriptor inmutable con la tupla de versiones —incluidas `scoreVersion` y `variantCatalogVersion`—, el seed y la asignación de variantes. El cliente no puede pedir un seed arbitrario ni una dificultad más fácil.

### FR-T02 Vista pública sin solución
El motor expone de una variante sólo lo que el renderer necesita. Ni la respuesta ni el evaluador se filtran por la forma del contenido público.

### FR-T03 Envío sin score
El cliente envía identidad de run y action log canónico, con clave de idempotencia. Un campo `score` provisto por el cliente se ignora o se rechaza.

### FR-T04 Verificación por replay
El servidor recarga las versiones exactas, reconstruye las variantes, reproduce los comandos, rechaza logs imposibles y escribe un resultado oficial inmutable.

### FR-T05 Personal best
El verificador actualiza el mejor resultado del participante según el comparador versionado. Una run peor queda en el historial auditable pero no reemplaza al mejor público.

### FR-T06 Continuar después del fracaso
Un resultado académico insuficiente no crea un estado terminal global. Cuando el contenido lo habilite, la progresión agenda un evento de recuperación comprimido.

### FR-T07 Cierre de carrera completa
El producto completo termina en `EGRESADO`, deriva el arquetipo final y produce el resumen de run. El slice de 7.º termina en el hito de año.

TG1 cerró la dirección 85/10/5, normalización de oportunidades e intentos ilimitados con mejor resultado verificado. Siguen abiertos la política oficial/freeze, la implementación de emisión y personal best, y el desempate exacto; ver [preguntas abiertas](../07-reference/open-questions.md).
