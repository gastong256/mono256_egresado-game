# ADR-025 — Evolución acotada de contratos para carrera completa

- Estado: Aceptado para implementación futura; **NOT IMPLEMENTED**
- Fecha: 2026-09-10
- Origen: [conformidad técnica de Phase 0](../../04-quality/full-career-technical-conformance.md), `PASS WITH MINOR CONTRACT DELTAS`

## Contexto

El Product Pass cerró el diseño de carrera. La auditoría contra `147df60` encontró
fundaciones compatibles y deltas acotados, no un motivo para reemplazar el motor.
Las reglas de producto siguen en sus [fuentes especializadas](../../07-reference/full-career-product-audit-integration.md);
este ADR decide fronteras técnicas, no duplica su calibración.

Extiende ADR-022 para composición global y ADR-024 para representar el debrief.
Conserva sus invariantes: enumeración acotada, plan previo a ejecución, validador
independiente, recuperación fuera del plan ordinario, máximo uno y cierre de todas
las obligaciones. No modifica contratos ni versiones ejecutables en este commit.

## Decisión

### Composición por metadata y restricciones globales

El contenido declarará una familia primaria de razonamiento, motor principal de
interacción, pacing, contexto, cluster y arco cuando correspondan. Son ejes
distintos de `ScenarioFamily`, `InteractionKind` y banda cognitiva. La ubicación
exacta —registro tipado asociado o extensión de metadata— se resuelve al implementar,
sin duplicar valores entre catálogo y política.

El composer enumerará combinaciones legales por etapa y combinará la carrera
mediante búsqueda determinista acotada con poda por mínimos/máximos restantes.
No bastan penalizaciones blandas para restricciones duras globales. Los objetivos
lexicográficos se aplican sobre planes válidos, con desempate seeded canónico.
No habrá reglas por ID de template dentro del algoritmo, solver externo ni
resorteos sin cota. El validador independiente comprobará también completitud de
etapas y cuotas globales contra metadata autoritativa.

El plan se fija antes de jugar y no se recompone según respuestas. Las carreras
parciales de desarrollo y Teacher Demo conservan su identidad separada: no se
declaran oficiales por pasar el validador genérico. Una restricción nueva no exige
por sí sola cambiar el formato de `RunPlan`; sí deben cubrirse sus inputs y
políticas mediante identidades y fingerprints versionados.

### Respuestas semánticas y UI

Los cinco motores de producto usan la frontera existente: presentación pública
sin solución → respuesta tipada → evaluador puro. Nuevos modos constructivos
requieren extensiones explícitas y exhaustivas de presentación, respuesta,
validación, replay y adapters. Geometría evalúa posiciones discretas y relaciones,
no coordenadas de píxel del DOM. Teclado, tap y drag producen la misma respuesta.

Una escena multi-eje puede confirmar una respuesta compuesta acotada con hechos
separados para Math y comunicación social. No necesita varios beats puntuables.
Los borradores UI no son acciones autoritativas; persistirlos o confirmar etapas
intermedias exige un contrato explícito, no registrar cada movimiento del puntero.
Implementar sólo los modos que el año en curso necesita.

### Repaso: uno seleccionado, debrief del resto

Se conserva `RecoveryObligation` por origen y el cierre conjunto de ADR-024.
La selección es una función pura sobre obligaciones y contenido versionado. El
orden actual por evento/ID ya satisface determinismo; `reviewPriority` editorial
con desempate por ID semántico es la recomendación de producto, no un nuevo
campo implementado ni requisito de otro scheduler.

Antes del único Repaso, la presentación debe distinguir la obligación practicada
de las restantes y mostrar sus debriefs autorados. El cierre no certifica que todos
los conceptos fueron practicados. Se deriva ese conjunto de las obligaciones;
si hace falta conservar la distinción, se persiste únicamente el identificador
seleccionado y se versiona el snapshot. No se agrega un comando por debrief si
éste no contiene una decisión del jugador.

Con catálogo aprobado presente, una lista vacía de variantes de recovery debe
rechazarse explícitamente, no recurrir a variantes curadas no aprobadas. El
fallback observado en la auditoría es un delta pendiente, no una excepción nueva
a ADR-024. El [stress gate post-G1](../../04-quality/post-grade-1-scalability-audit.md)
sigue siendo obligatorio y todavía no fue ejecutado.

### Hechos narrativos, saliencia y Prestige separados de FairScore

Prestige será un agregador puro independiente, con política versionada y hechos
semánticos reconstruibles por replay. No recibe el total de Math/Team/Aura,
Promedio o Estilo como atajo de elegibilidad; una misma evidencia no paga dos
componentes competitivas. Cada logro declara identidad, evidencia, slot, máximo
y deduplicación. Los slots y su máximo se fijan para toda la edición; la aparición
rara y el historial de fallos no crean oportunidades adicionales.

History, flags y progreso existentes se reutilizan para saliencia. Se agregan sólo
hechos de compromiso/elección/hito no derivables; no se duplica todo el historial
en otro estado de carrera. Si una decisión narrativa relevante no está en comandos
actuales, deberá registrarse mediante una respuesta semántica o comando acotado
antes de usarla como evidencia verificable. No se infiere de un texto mostrado.

Callbacks pueden recibir contexto de presentación de sólo lectura; no se inyectan
flags ocultos en generación/evaluación matemática para cambiar la dificultad o el
techo competitivo. El epílogo usa selección y prosa autoradas, sin LLM runtime.

### Rareza y autoridad de Competition Seed

Selección rara usa substreams semánticos propios y arbitraje canónico del
presupuesto. No se direcciona por `runId`, reloj o índices desplazados por Repasos.
Los modificadores matemáticos usan variantes aprobadas con identidad propia;
cambiar parámetros bajo la misma dirección está prohibido. Todo reemplazo ocupa
un slot compatible y mantiene roles, cantidad y techo de oportunidades.

STAGE-09 vinculará cada intento a un descriptor emitido y registrado por servidor,
una edición y su seed compartida, dificultad fija, plan y políticas/catálogos
congelados. El `runId` es distinto por intento, aunque la seed se repita. El
fingerprint del plan no sustituye esa vinculación. El servidor verifica egreso,
completitud, cuotas y acciones antes de calcular FairScore y Prestige por separado.
El resultado legacy `officialScore` no se usa como FairScore del ranking.

La edición y su persistencia viven fuera del core. No se seleccionan aquí tablas,
auth, endpoints ni proveedores nuevos.

## Consecuencias y versionado futuro

| Cambio al implementar | Identidad a revisar |
|---|---|
| Algoritmo de composición, transición, comandos o addressing RNG | engine |
| Cuotas, selección, probabilidades, presupuestos | política y ruleset |
| Templates, metadata, debriefs, mappings, variantes y evidencia | contenido; nuevo catálogo inmutable cuando corresponda |
| Nuevos datos persistidos | snapshot |
| Nuevos comandos/respuestas o forma serializada del descriptor | action log |
| Prestige independiente | política propia; no cambia por sí solo `scoreVersion` de FairScore |
| Fórmula, pesos o factores de FairScore | score policy/version |

No subir codecs si su contrato no cambia; saliencia derivada no exige un bump de
snapshot. No reinterpretar logs históricos bajo nuevas reglas. Identidades,
metadata y mappings nuevos deben entrar a la cobertura de fingerprints y tests.

## Alternativas descartadas

- Un rule engine genérico o ILP/SAT: innecesario para el espacio acotado de seis etapas.
- Sólo objetivos blandos: no garantizan cuotas duras de carrera.
- Otro Career Model o scorer combinado FairScore + Prestige: rompe separación y autoridad.
- Un Repaso por error o excluir el stress case de composición: evade ADR-024 y el gate aprobado.
- Inferir logros de corrección, Estilo o aparición: duplica evidencia o premia azar.
- Cambiar toda serialización anticipadamente: declara incompatibilidades sin necesidad.

## Gates y orden

Antes/durante G1: metadata mínima, contratos constructivos utilizados por G1,
debrief, catálogo aprobado fail-closed, tests de variantes y replay. La respuesta
Math/Aura separada debe estar lista cuando G2 la use; no se difiere a G5.

G4/5: agregación completa de Prestige, selector de saliencia y modos avanzados;
los hechos necesarios deben originarse desde el año correspondiente.
STAGE-09: emisión, vinculación, persistencia, elegibilidad oficial y ranking.
El [plan de Phase 1](../../06-delivery/implementation-sequence.md#phase-1-implementar-1º-real)
es el orden de ejecución, no este ADR.
