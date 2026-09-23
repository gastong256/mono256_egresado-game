# Especificación funcional

## FR-001 Inicio
El sistema debe permitir iniciar una experiencia sin crear una cuenta tradicional.

### Comportamiento
- Mostrar nombre del juego y CTA principal.
- Permitir nickname opcional/obligatorio según modo.
- Validar longitud y caracteres.
- Crear identidad anónima local.

### Portada competitiva vigente — RC3 TASK-A

En `/`, la portada prioriza el acceso al evento. `upcoming` anticipa la apertura;
`open` muestra un único CTA **Jugar ahora** (o **Jugar de nuevo / Continuar partida**
según la sesión); `closed` prioriza los resultados y no ofrece nuevos intentos;
`not-configured` explica la indisponibilidad. La identificación conserva ADR-026.
El aviso configurado v1 completo se publica en `/privacidad`, accesible sin
identificación y sin JavaScript. Un pie institucional identifica Colegio Integral
Piacentini, Feria del Libro 2026 y `developed by gastong256.dev`, con un único enlace
«Política de Privacidad»; Home no repite el aviso.

Según [ADR-030](../03-architecture/adr/ADR-030-privacy-page-and-action-acknowledgement.md),
el formulario no tiene checkbox. Junto a **Aceptar y jugar** muestra: «Al elegir
“Aceptar y jugar”, confirmás que leíste y aceptás el tratamiento de datos explicado
en la Política de Privacidad para participar en la competencia». El enlace abre
otra pestaña, anunciado accesiblemente, y conserva los campos en memoria. Sólo
el envío válido remite el reconocimiento y la versión vigente al servidor;
navegar o leer no acepta. Sin configuración, la ruta explica la indisponibilidad
del aviso y permite acceder a `/test`; nunca inventa datos institucionales.

El contador usa exclusivamente `opensAt`/`closesAt` del DTO vigente. Muestra
segundos orientativos del reloj cliente y la fecha absoluta en hora argentina;
se puede ocultar, no anuncia cada segundo y respeta reduced motion. Al vencer
consulta el estado existente: nunca abre/cierra una edición ni autoriza intentos.
El estado se refresca cada 20 s en portada/identificación cuando está abierto o
próximo a abrir. La matemática es la contribución principal; Equipo y Aura también
suman, conforme a FairScore v1, sin una nueva métrica «Amigos».

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
Normal/Fair v1 completa seis etapas con exactamente nueve beats ordinarios; las
cuotas de dificultad, pacing y diversidad se mantienen en la matriz.

**Diseño objetivo STAGE-08, no implementado:** la composición de carrera debe
respetar los [clusters y arcos](../01-game-design/full-career-content-matrix.md#políticas-de-composición)
y la madurez declarada de cada política. Los callbacks enriquecen la escena sin
requerir historia previa para comprenderla o resolverla, ni cambiar por sí mismos
el máximo de FairScore.

## FR-004 Presentación de etapa
El jugador debe conocer siempre la etapa escolar actual.

## FR-005 Resolución de desafíos
El sistema debe soportar los [cinco motores reutilizables](../01-game-design/challenge-system.md#cinco-motores-reutilizables-de-interacción-v1)
y sus modos. No se confunden con kinds técnicos actuales; todo input esencial
admite teclado y tap sin drag según [UX](../01-game-design/ux-interaction-design.md).

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

**Career Epilogue v1 — producto cerrado, no implementado:** egreso siempre,
perfil breve, 3–5 recuerdos deterministas, carrera, Hitos y CTA según modo.
El [sistema narrativo](../01-game-design/narrative-system.md#quinto-año-y-career-epilogue-v1)
gobierna segmentos/prioridades sin duplicar el historial ni usar LLM runtime.

## FR-012 Ranking
En un evento competitivo, mostrar mejores resultados verificados según
[FairScore → Prestige → puesto compartido](../01-game-design/competitive-scoring-and-ranking.md#desempate).
Sin velocidad ni criterio oculto. Style sólo Career/Narrative; Prestige competitivo
usa hechos independientes y su [presupuesto canónico](../01-game-design/rare-events-and-prestige.md).

### Presentación del podio vigente — RC3 TASK-A

La UI agrupa las entradas por el puesto **ya calculado por el servidor**, conserva
empates completos y nunca inventa un segundo puesto cuando el siguiente es tercero.
Jerarquía visual 1 > 2 > 3, orden DOM por puesto, alias y puntaje legibles en móvil.
`isYou` identifica al participante; si no aparece en el podio, se muestra su puesto
privado con su mejor score. No se compara el puesto con la cantidad de filas.
El ranking público sigue limitado a los primeros tres puestos, sin lista pública
inferior ni Prestige (techo ofrecido 0). El vacío cambia su texto según el estado;
al cerrar dice **Resultados del evento**, sin prometer una adjudicación definitiva
mientras pueden existir envíos pendientes o moderación.

## FR-013 Reintento
El jugador puede iniciar otra run. Fair v1 permite reintentos ilimitados sobre
la misma Competition Seed de edición, sin reroll raro. Practice puede variar
seeds aprobadas y no aporta ranking oficial.

## FR-014 Modo feria
Un evento debe poder definir:
- período de vigencia;
- una Competition Seed compartida y server-issued por edición v1;
- ruleset;
- dificultad fija y plan/variantes/estado raro comunes;
- reintentos ilimitados, conservando mejor resultado verificado;
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
Top 3 público pseudónimo, sin exposición infinita de posiciones inferiores; puesto
propio/personal best privado según [operaciones](../05-operations/leaderboard-and-moderation.md).

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
Fundación implementada: un resultado insuficiente no crea fracaso terminal.
Producto v1: INVALID recovery-capable dispara **REPASO**; FUNCTIONAL y `none` no.
Una selección determinista interactiva por etapa, debrief de las restantes y cierre
de todas, sin FairScore/Prestige ni bloqueo de egreso. Debrief es delta futuro bajo
[ADR-025](../03-architecture/adr/ADR-025-full-career-contract-evolution.md).

### FR-T07 Cierre de carrera completa
El producto completo termina en `EGRESADO`, deriva el arquetipo final y produce el resumen de run. El slice de 7.º termina en el hito de año.

TG1 cerró la dirección 85/10/5, normalización de oportunidades e intentos ilimitados con mejor resultado verificado. Siguen abiertos la política oficial/freeze, la implementación de emisión y personal best; el desempate exacto ya es puesto compartido. Ver [preguntas abiertas](../07-reference/open-questions.md).

## FR-021 Práctica pública — RC3

`/test` permite una carrera completa anónima con el motor, catálogo aprobado
hosteable, interacciones, feedback, recuperación, egreso, epílogo y FairScore
vigentes. No pide alias, nombre, DNI, año real ni consentimiento competitivo.
Muestra **Modo práctica** y **No participa del ranking** durante toda la experiencia.

El servidor emite una seed aleatoria propia por inicio; nunca lee la edición
activa ni su seed. Al terminar recompone el descriptor y reproduce las acciones:
la pantalla muestra **Puntaje de práctica**, sin puesto ni estado competitivo
`VERIFIED`. Ninguna operación crea participantes, sesiones, intentos o resultados
oficiales, ni modifica el mejor intento o cookies existentes.

Guarda snapshot y log en un namespace local versionado. Recargar ofrece continuar
sin emitir otra run. Empezar otra exige confirmación si existe avance y sólo lo
reemplaza tras emisión exitosa. Al finalizar, jugar de nuevo emite otra seed.
Entre pestañas prevalece el último checkpoint. Guardado bloqueado o incompatible
se explica; jugar sin red sigue siendo posible después de iniciar y el cálculo
final puede reintentarse. No se prometen resultados guardados en servidor.

Home ofrece **Probar sin competir** como enlace secundario, incluso sin evento,
antes de abrir y después del cierre. `/test` no acepta controles de catálogo,
seed o debugging; `/dev` permanece cerrado en producción competitiva. La frontera
y los límites operativos están en [ADR-029](../03-architecture/adr/ADR-029-public-practice-mode.md).
