# ADR-019 — Modelo de contenido: familia de escenario, plantilla y variante

- Estado: Aceptado
- Fecha: 2026-08-28

## Contexto

Hasta ahora un desafío era una `ChallengeDefinition` plana: un id, una interacción, unas categorías, las etapas donde puede aparecer y una función `generate` que adentro elegía al azar de un array privado de parámetros.

Ese modelo alcanzó para el slice de 7.º y no alcanza para el resto. Tiene tres problemas que no se arreglan agregando contenido.

**Una definición confunde el lugar con la pregunta.** «El colectivo» es una situación reconocible que puede albergar varias estructuras de razonamiento —la demora porcentual, la última salida segura, comparar dos recorridos—, pero el modelo sólo podía representar una. Para tener la segunda había que escribir otro desafío entero, con su narrativa, su presentación y su evaluador duplicados.

**La variante no tenía identidad.** `rng.pick(VARIANTS)` elige un elemento de un array por índice. No se puede nombrar, no se puede pedir, no se puede guardar en un plan, no se puede aprobar en un catálogo y no se puede reproducir salvo repitiendo el sorteo completo. Un catálogo prevalidado de competencia necesita decir «la variante `bus/g7.bus-timing/demora-25`», y eso no era expresable.

**No existía la diferencia entre lo que hay y lo que se juega.** El registro de desafíos era a la vez el catálogo disponible y, vía los pools de storylets, lo que la run terminaba jugando. Con seis desafíos en un año eso no molesta. Con seis años y un catálogo grande, confundir las dos cosas significa que agrandar el catálogo alarga la partida, que es exactamente lo contrario de lo que el producto necesita.

## Decisión

### 1. Tres niveles con significados distintos

```text
ScenarioFamily     ¿dónde pasa esto?        contexto reconocible y estable
  └─ ChallengeTemplate   ¿qué hay que razonar?    una estructura cognitiva
       └─ ChallengeVariant  ¿qué caso concreto es?   una parametrización reproducible
```

Una **familia** es temática, no matemática, y no está atada a un año. Una **plantilla** es una estructura de razonamiento: dos plantillas de la misma familia son preguntas distintas, no la misma pregunta con otros números. Una **variante** es una dirección, no un objeto generado.

Una `ChallengeDefinition` **es** una plantilla. No se renombró el tipo ni el `ChallengeId`: direccionan exactamente la misma cosa, y renombrar setenta referencias habría agregado riesgo sin agregar significado. Lo que sí cambió es que el campo del `ChallengeInstanceRef` se llama `templateId`, que es como el modelo lo nombra.

### 2. La variante es una dirección, no un objeto serializado

```ts
interface ChallengeVariantRef {
  familyId: ScenarioFamilyId
  templateId: ChallengeId
  variantId: VariantId
}
```

Tres identificadores semánticos estables y nada más: ni índice de array, ni posición en el catálogo, ni orden de inserción. El modelo detrás de la dirección lo recalcula la plantilla, igual que antes. Eso mantiene el estado de la run chico, los snapshots JSON-puros y el replay exacto.

La dirección tiene forma plana `familia/plantilla/variante`, con round-trip total y parseo que rechaza en vez de adivinar.

### 3. Cada variante tiene su propio substream determinista

`variantRngPath(ref)` direcciona por identidad semántica y **sólo** por identidad semántica: no entra ni la etapa, ni el índice de evento, ni cuántas familias tenga el catálogo. Una variante saca los mismos números la juegue el año que la juegue, que es la propiedad de la que va a depender un catálogo pregenerado.

Se reutiliza la derivación de substreams de [ADR-012](ADR-012-seeded-prng-and-substreams.md). No hay un segundo generador.

### 4. El catálogo disponible no es el plan de la run

`ContentCatalog` responde *qué existe y dónde puede aparecer*. `RunPlan` responde *qué se eligió para esta partida*. Son tipos distintos y el segundo referencia al primero por identidad.

Agregar contenido al catálogo **no** lo agrega a un plan existente, y reordenar el catálogo **no** cambia lo que un plan resuelve. Las dos cosas están probadas.

Esto tampoco es el futuro *catálogo desplegado de variantes competitivas*, que contendrá variantes generadas, validadas y aprobadas. Éste contiene definiciones autoradas.

### 5. La elegibilidad por etapa es declarativa

Una plantilla declara `stages`. Es **permiso, no selección**: una plantilla elegible para 7.º no aparece en toda run de 7.º. La elegibilidad admite una etapa, varias o un conjunto no contiguo —`dev.trip-budget` es elegible en 2.º, 3.º y 5.º, sin 4.º—, y dos plantillas de la misma familia pueden diferir.

Una variante no puede ampliar la elegibilidad de su plantilla: no tiene dónde declararla, porque es una dirección.

El motor no conoce ningún id de contenido. No hay `if (challengeId === 'mural')` en ninguna parte del núcleo, y el lint de fronteras impide que `src/game` importe `src/content`.

### 6. Roles de colocación

`anchor`, `checkpoint`, `special`, `recovery`.

Son semántica de **colocación**: dicen cómo se puede agendar un contenido y nada sobre qué tan bien le fue al jugador ni qué le hace a la carrera. Un `checkpoint` no vale más que un `anchor`.

### 7. Un año aporta uno o dos beats ordinarios

`DEFAULT_STAGE_BEAT_BUDGET = { min: 1, max: 2 }`.

Uno es el piso porque un año por el que se pasa sin decidir nada no es un año. Dos es el techo porque una run completa cruza seis —`7.º → 1.º → 2.º → 3.º → 4.º → 5.º`— y el producto depende de que esa run se pueda volver a jugar. La riqueza viene de *cuáles* dos salen de un catálogo grande, no de jugar más.

**El checkpoint gasta uno de esos dos.** Modelarlo como una evaluación obligatoria *además* del presupuesto es exactamente cómo una run de seis años se convierte en una de veinte minutos. `special` también gasta: un evento social sigue siendo un beat que el jugador juega.

**La recuperación queda afuera del presupuesto**, porque es condicional. Sólo la lógica de progresión —que no existe todavía— puede agendarla.

Además, un plan de etapa válido tiene **exactamente un `anchor`**. Un año sin beat primario no tiene centro, y uno con dos tampoco: el segundo es en realidad un checkpoint o un special.

### 8. Definir un plan válido no es construirlo

STAGE-02 define qué hace válido a un plan; el compositor de runs, que elige por presupuesto de dificultad, variedad y coherencia narrativa, es trabajo posterior. `validateStagePlan` y `validateRunPlan` existen; ningún selector automático existe.

### 9. Los seis desafíos actuales son sondas de arquitectura

Colectivo, mural, cuaderno, proyecto grupal, stand y el acto del 25 de Mayo se inspeccionaron los seis para comprobar que el modelo representa sus dominios matemáticos, evaluadores, interacciones y efectos de carrera sin casos especiales en el motor. Ninguno se movió de año, ninguno se sacó y ninguna matemática se reescribió.

**Su ubicación actual en 7.º es consecuencia del primer slice vertical, no una decisión de producto.**

## Alternativas consideradas

**Dejar el registro plano y agregar desafíos.** Es lo más barato hoy y lo más caro después: cada estructura cognitiva nueva duplica narrativa, presentación y evaluador, y la variante sigue sin poder nombrarse. Es la situación que motivó esta etapa.

**Un desafío fijo por escenario, variando sólo números.** Es lo que hay hoy dentro de cada `generate`. Alcanza para que cambien los valores y no para que cambie la pregunta: el jugador aprende «la segunda opción» y la segunda partida deja de aportar.

**Codificar el año en la identidad del contenido.** Es lo que insinúa el prefijo `g7.`. Habría hecho imposible que una familia abarque varios años, que es justamente lo que un catálogo para seis años necesita.

**Implementar ya el generador procedural completo.** Habría mezclado dos problemas: qué *es* una variante y cómo se producen poblaciones grandes de variantes válidas. Sin lo primero, lo segundo no tiene dónde apoyarse; con lo primero resuelto, lo segundo es contenido y herramientas, no motor.

**Renombrar `ChallengeId` a `ChallengeTemplateId`.** Setenta referencias en veintiséis archivos para expresar la misma identidad. Se documentó la equivalencia en el glosario y en los tipos.

## Consecuencias

- `ENGINE_VERSION` pasa a `3.0.0` y `SNAPSHOT_SCHEMA_VERSION` a `3`: la dirección de una instancia lleva ahora familia, plantilla y variante. Un snapshot v2 se rechaza explícitamente y la aplicación ofrece partida nueva, igual que en [ADR-016](ADR-016-career-player-model.md).
- Las versiones de contenido suben —`0.3.0-dev`, `0.4.0-grade-7`— y **las de ruleset no**. Las políticas de score, dificultad y perfil no se tocaron, y el fingerprint de ruleset quedó idéntico, que es la evidencia de que no se movieron.
- El orden de la lista `variants` de una plantilla es parte del contrato de contenido: la selección saca un índice de ahí. Reordenarla cambia qué caso produce un seed guardado.
- Las runs golden reproducen **el mismo recorrido, el mismo score, el mismo perfil y la misma cantidad de comandos**. Lo único que cambió es el hash del estado final. Las plantillas de desarrollo declaran una sola variante cada una y por eso no gastan ningún sorteo eligiéndola: su generación es idéntica.
- La validación de contenido recorre ahora **todas** las variantes declaradas en vez de esperar que los seeds las visiten, y falla si dos variantes de una plantilla renderizan igual.
- Agregar una familia, una plantilla o una variante ordinarias no requiere tocar el motor. Hay un test que registra contenido sintético que el motor nunca vio y lo materializa.

## No objetivos

Generación por restricción reutilizable, validación estadística de poblaciones, catálogo desplegado y `variantCatalogVersion` son de la etapa siguiente. Bandas de dificultad, presupuesto y compositor de runs, de la posterior. Score competitivo, egreso, recuperaciones y ranking, más adelante todavía. Ver [el roadmap](../../06-delivery/implementation-sequence.md).

## Decisión que queda abierta

**El inventario final de escenarios sigue sin decidir.** Cuántas familias, cuántas plantillas por familia, cuántas variantes, qué año usa cada cosa y cuáles de los seis actuales se mantienen, se mueven, se rehacen o se reemplazan: nada de eso se cierra acá. Ver [preguntas abiertas](../../07-reference/open-questions.md).
