# Modo feria, congelamiento y control de cambios

**Estado: implementado en STAGE-09 y congelado para v1 por ADR-027.**
El [manifiesto y reporte RC](../06-delivery/production-v1-release-candidate.md)
fijan las versiones exactas; el [runbook operativo](fair-operations-runbook.md)
describe apertura, cierre, respaldo y recuperación. STAGE-10 conserva el GO.

Este documento cubre la operación de la competencia. Las reglas del score están en [score competitivo y ranking](../01-game-design/competitive-scoring-and-ranking.md); la presentación y moderación del ranking, en [leaderboard y moderación](leaderboard-and-moderation.md).

## Competition Seed e intentos v1

**LOCKED en producto.** Una seed compartida, emitida y registrada por el servidor,
por edición de leaderboard. Todos reciben el mismo RunPlan, variantes, dificultad
fija, estado raro y techo de oportunidades. Reintentos ilimitados reutilizan esa
seed; cuenta el mejor resultado verificado, nunca suma ni cantidad de intentos.
Esto supersede la elección pendiente entre seed común y pool equivalente, y el
default configurable de 1/N intentos para v1.

Cada intento tiene runId propio vinculado a participante/edición/descriptor.
El servidor contrasta esa emisión, versiones y plan, reproduce acciones y exige
completitud/egreso antes de admitir al ranking. El hash enviado no prueba emisión.
Auth, tablas, endpoints e idempotencia quedaron implementados en
[STAGE-09](../06-delivery/stage-09-fair-mode-server-ranking.md); el procedimiento
operativo, en el [runbook](fair-runbook.md#operación-de-la-competencia-implementada).

Practice usa seeds procedurales aprobadas y puede favorecer novedad entre carreras;
no presenta esos resultados como ranking oficial. Un pack común multi-seed queda
como evolución posterior, no alternativa abierta de v1.

## Configuración de evento

Un evento oficial declara, antes de abrir:

- período de vigencia y horario de cierre del servidor;
- Competition Seed compartida, plan/variantes, dificultad fija y estado raro;
- tupla de versiones permitida, incluidas las políticas de Prestige y composición;
- política de intentos;
- comparador de ranking y su versión;
- política de empate exacto;
- cantidad de premios;
- reglas de nickname y moderación;
- si se muestran métricas secundarias en público.

El ejemplo documental de esa forma está en [event-config.example.json](../07-reference/event-config.example.json). Es un ejemplo histórico: no es configuración de producción ni se importa desde
runtime. Sus campos/candidatos no reemplazan estas decisiones v1; actualizar su
forma ejecutable corresponde a la futura tarea de contrato, no a esta reconciliación.

## Congelamiento antes del inicio oficial

Se congelan:

- engine y Competition Seed/RunPlan de la edición;
- `rulesetVersion`;
- `contentVersion`;
- `variantCatalogVersion`: `grade-5-dev-6`, fijado por SHA-256 sin renombrarlo;
- `scoreVersion`: `fair-score-v1@1.0.0-fair-edition-v1`, oficial y numéricamente equivalente a `fair-score-dev-2`, que se conserva para replay;
- política de Prestige, slots/techos de evidencia y selección rara;
- el comparador del leaderboard;
- la política de intentos.

El registro del evento debe permitir **sólo** la tupla congelada. Una versión de desarrollo no puede convertirse en versión oficial por accidente; hoy eso ya está sostenido por el flag `production` del ruleset, que se niega a construir un ruleset oficial desde una política de desarrollo.

## Durante la competencia oficial

Permitido sin cambiar la versión de score:

- arreglo visual que no altere información ni forma de responder;
- arreglo de crash que preserve la semántica;
- escalado de infraestructura;
- acción de moderación.

Alto riesgo, **no se toca en vivo**:

- datos de desafíos;
- lógica de evaluación;
- coeficientes de score;
- factores de dificultad;
- opciones de respuesta;
- aleatorización.

Si un defecto de corrección obliga igual, se crea una versión nueva y se decide explícitamente si las runs previas se pueden reproducir y recalcular de forma consistente. **No se mezclan scores de versiones no comparables sin recomputación declarada.**

Corolario de disciplina: no se cambia una regla de score porque en la primera hora alguien dijo que estaba difícil. Eso se anota para la próxima versión. Ver [ciclo de entrega real](../00-product/real-delivery-lifecycle.md).

## Cierre y premios

- El cierre es un timestamp del servidor, no del cliente.
- **Decidido en STAGE-09:** una run emitida antes del cierre se puede enviar
  hasta `closesAt` más una tolerancia configurada por edición
  (`submission_grace_seconds`, cinco minutos por defecto). La alternativa
  estricta le saca el resultado a quien empezó a las 17:52 una carrera de doce
  minutos, que no hizo nada mal. Se anuncia antes de abrir.
- El premio se resuelve **sólo sobre runs verificadas y sobre el mejor intento**.
- Se exporta una lista auditable de candidatos con: id interno de participante, nickname, id de la mejor run, desglose de score, tupla de versiones, estado de verificación y métricas de desempate.

Esa exportación existe para que el organizador confirme ganadores sin depender de la pantalla pública.

## Empate exacto

**LOCKED v1:** puesto compartido tras FairScore y Prestige. La política de entrega
de premios puede reconocer co-ganadores o un desafío común separado anunciado;
no introduce velocidad ni otro criterio oculto en el ranking. La logística de
premios sigue siendo decisión operativa previa a la feria.

## Privacidad de menores en competencia

El ranking no necesita una cuenta escolar, y sigue sin tenerla: lo público es el
alias y nada más.

Lo que **cambió en STAGE-09** es que la identidad real vive dentro del producto y
no en una planilla aparte. Este documento prefería «un mapeo externo controlado
por el organizador»; se evaluó y se descartó, porque una planilla suelta es una
copia de datos de menores sin control de acceso, sin auditoría y sin fecha de
borrado — el dato existe igual y lo único que cambia es que nadie lo protege. La
condición que este mismo documento ponía —«salvo que la institución lo requiera
y lo gobierne»— es la que se cumple: la institución responsable se declara en la
configuración del despliegue y sin ella la aplicación no atiende.

Se piden cuatro campos y ninguno más, el documento no se guarda —se deriva con
HMAC por competencia y se conservan los últimos cuatro dígitos— y la frontera
entre lo público y lo privado está verificada por tipos y por tests. La decisión
completa, con su marco normativo, está en
[ADR-026](../03-architecture/adr/ADR-026-participant-identity-and-minor-privacy.md).

**Retención: cerrada.** Los datos privados se conservan
`EGRESADO_PRIVACY_RETENTION_DAYS` días después del cierre —120 por defecto— y se
anonimizan con una operación explícita. El leaderboard queda legible: sobreviven
el alias y el puntaje, que no identifican a nadie. Esto es guía de producto; la
política legal aplicable la define la institución. Ver
[seguridad y privacidad](../03-architecture/security-privacy.md).

## Ensayo de carga y red

Una feria genera llegadas en ráfaga, Wi-Fi compartido y refrescos de ranking simultáneos. Escenarios a ensayar:

- ráfaga de emisión de runs;
- envíos finales concurrentes;
- polling del leaderboard mientras se verifican envíos;
- envíos duplicados o reintentados;
- latencia alta;
- caída transitoria de red durante una run;
- reinicio o degradación de base de datos y API;
- moderación bajo carga.

Propiedades que tienen que sostenerse: ningún resultado oficial duplicado; personal best correcto bajo concurrencia; las lecturas del ranking no bloquean la verificación; el cliente conserva su envío pendiente; el límite de tasa rechaza abuso sin frenar la ráfaga esperada.

Los números de concurrencia salen de la asistencia estimada por un factor de seguridad; no se inventa escala de nube sin una estimación del evento. La [pregunta 15](../07-reference/open-questions.md) sigue abierta.

## Refresco del ranking

Tiempo real es opcional. Un polling cada pocos segundos suele ser más simple y más robusto a escala de feria. Se elige por carga real, no por novedad.
