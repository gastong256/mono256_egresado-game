# Modo feria, congelamiento y control de cambios

**Estado: dirección de producto v1 cerrada; implementación STAGE-09 pendiente.**
El congelamiento sigue siendo política vigente ([runbook](fair-runbook.md),
[Definition of Done](../06-delivery/definition-of-done.md)); cierre de diseño no
oficializa las políticas de desarrollo.

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
Auth, tablas, endpoints e idempotencia se implementan en STAGE-09, no en Phase 0.

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
- `variantCatalogVersion` del catálogo oficial cuando el evento lo defina —el campo técnico ya existe, pero ninguno de los catálogos de desarrollo `grade-7-dev-1` a `dev-5` es un freeze de feria—;
- `scoreVersion` de la política competitiva aprobada —el campo técnico y dos versiones resolubles ya existen, pero `fair-score-dev-2` sigue `official: false`—;
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
- Hay que decidir antes si una run emitida antes del cierre puede enviarse después, y con cuánta tolerancia.
- El premio se resuelve **sólo sobre runs verificadas y sobre el mejor intento**.
- Se exporta una lista auditable de candidatos con: id interno de participante, nickname, id de la mejor run, desglose de score, tupla de versiones, estado de verificación y métricas de desempate.

Esa exportación existe para que el organizador confirme ganadores sin depender de la pantalla pública.

## Empate exacto

**LOCKED v1:** puesto compartido tras FairScore y Prestige. La política de entrega
de premios puede reconocer co-ganadores o un desafío común separado anunciado;
no introduce velocidad ni otro criterio oculto en el ranking. La logística de
premios sigue siendo decisión operativa previa a la feria.

## Privacidad de menores en competencia

El ranking no necesita una cuenta escolar. Se prefiere nickname más identificador pseudónimo de participante, y sólo los datos de run necesarios para verificar.

Se evita, salvo que la institución lo requiera y lo gobierne: nombre completo, correo, teléfono, edad o fecha de nacimiento exactas y perfil personal innecesario.

Si hace falta identidad real para entregar un premio, se prefiere un mapeo externo controlado por el organizador o un código de evento, no publicar identidad dentro del juego.

Retención —cuánto viven los action logs, cuánto queda público el leaderboard, qué se archiva o anonimiza después de la feria— se define antes del lanzamiento y es **OPEN** ([pregunta 31](../07-reference/open-questions.md)). Esto es guía de producto; la política legal aplicable la define la institución. Ver [seguridad y privacidad](../03-architecture/security-privacy.md).

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
