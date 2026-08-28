# Familias de escenario, plantillas y variantes

**Estado: implementado para STAGE-02/STAGE-03/STAGE-04.** La jerarquía `ScenarioFamily → ChallengeTemplate → ChallengeVariant` está aceptada en [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md), el pipeline híbrido con catálogo aprobado de desarrollo en [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md), y su consumo por la partida real en [ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md). La promesa de que una familia aloja varias plantillas está cumplida en contenido de producción: la familia `bus` tiene dos, con razonamientos distintos. El determinismo sigue **LOCKED**. El inventario, la profundidad cognitiva del resto de las familias y el catálogo oficial de feria permanecen abiertos.

## El problema

Un desafío fijo se memoriza. Cambiar `25 %` por `15 %` compra una partida más: el jugador igual aprende “la segunda opción”. Lo que hace falta es **variación estructural** —que cambie el razonamiento, no sólo los números.

Un docente que juega dos veces la demo tiene que ver una diferencia real. Si sólo se reordenan las opciones, no se puede llamar variación.

En 7.º eso ya pasa: la segunda partida trae otros números en las seis situaciones, y en la del colectivo puede traer **otra pregunta** —de «¿a qué salida me subo?» a «¿con cuánto tiempo salgo?»—, que es el mismo dato recorrido al revés.

## Cuidado con la palabra «familia»

El proyecto usa «familia» en dos sentidos y conviene no confundirlos:

| Término | Qué agrupa | Dónde se define |
|---|---|---|
| **Familia de interacción** | el patrón de UI con el que se responde: Decision Card, Timeline, Number Grid… | [sistema de desafíos](challenge-system.md) |
| **Familia de escenario** (`ScenarioFamily`) | el dominio narrativo reconocible: Colectivo, Mural, Cuaderno, Proyecto grupal, Stand | este documento |

Una familia de escenario puede usar varias familias de interacción, y al revés. Cuando un documento diga «familia» sin calificar, el contexto manda: en `challenge-system.md` es interacción; acá es escenario.

## La jerarquía

```text
ScenarioFamily          contexto narrativo reconocible
  └─ Template           estructura de razonamiento distinta dentro de ese contexto
       └─ Variant       parametrización concreta y determinista de esa estructura
```

### Familia

El contexto que el jugador reconoce: Colectivo, Mural, Cuaderno, Proyecto grupal, Stand de feria.

### Plantilla

Una estructura de razonamiento distinta dentro del mismo contexto. No es «el mismo problema con otros números»: es otra pregunta.

Colectivo, por ejemplo:

- **demora porcentual** — duración normal + porcentaje de demora + hora de entrada;
- **última salida posible** — derivar el último horario seguro;
- **comparación de rutas** — dos alternativas con duración y demora distintas;
- **frecuencia** — próximo servicio + duración + límite de llegada.

Mural: cobertura; cobertura descontando aberturas; cobertura con precios de envase y presupuesto.
Cuaderno: porcentaje contra descuento fijo; cuotas contra efectivo disponible; descuento más costo adicional.
Proyecto grupal: asignación por habilidad; restricción de capacidad y horas; reparto balanceado.
Stand: selección de packs; requisitos mínimos; optimización de presupuesto.

### Variante

Un caso concreto y reproducible de una plantilla, identificado por la dirección estable `familia/plantilla/variante`. Sus parámetros pueden ser autorados o generados, pero su identidad semántica nunca depende de una posición de array o del lugar donde una run lo juegue.

## Dirección y seed de contenido

**LOCKED e implementado.** [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md) separa selección de contenido y contenido semántico:

```text
seed fijo del espacio de variantes + dirección familia/plantilla/variante
    → parámetros semánticos reproducibles

runSeed
    → selección de qué dirección recibe una run
```

El código lo implementa con `VARIANT_SPACE_SEED`, `variantRngPath(ref)` y `createVariantRng(ref)`. Bajo el mismo contrato versionado de contenido y generador, el mismo `ChallengeVariantRef` materializa el mismo problema aunque cambien la run, la etapa o el slot. `runSeed` puede elegir otra dirección; no redefine qué significa una dirección aprobada. La lógica de dominio nunca llama a `Math.random()` ambiente y reutiliza los substreams de [ADR-012](../03-architecture/adr/ADR-012-seeded-prng-and-substreams.md).

## Generación por restricción, no por sorteo

**Implementado.** Generar desde la propiedad pedagógica deseada, no desde parámetros arbitrarios con la esperanza de que el resultado siga siendo válido.

Ejemplo de mural: se quiere que 1 L no alcance, 2 L sea óptimo y 4 L sea válido pero derrochador. Con cobertura de 8 m²/L, se genera primero el área requerida en `(8, 16]` y recién después se eligen dimensiones legibles que den ese área. El camino inverso —elegir dimensiones y ver qué sale— produce variantes triviales o imposibles.

Esto ya es el patrón vigente del motor: el generador produce parámetros, el verificador comprueba invariantes y la presentación nunca lleva la solución. Ver [game engine](../03-architecture/game-engine.md).

## Variación no es azar

```text
fuente autorada o generada → resolver/materializar → validar
    → canonizar → fingerprint → deduplicar → catálogo aprobado versionado
```

Un número al azar en runtime puede producir decimales feos, óptimos ambiguos, opciones duplicadas, estados imposibles, variantes triviales o dificultad desbalanceada. En una partida de práctica eso es un bug; en una competencia con premios es una injusticia que no se puede deshacer.

Una fuente `generated` es un espacio finito direccionado y determinista que pasa por el pipeline offline; no es generación arbitraria en el browser. Una fuente `authored` es una lista curada, pero no evita validación, fingerprint ni deduplicación.

El principio viene de STACK, que recomienda pregenerar, testear y desplegar variantes aleatorias en vez de exponer al estudiante a casos defectuosos generados en vivo. Ver [base teórica](../07-reference/research-basis.md).

## Catálogo aprobado de desarrollo

**Implementado.** `ApprovedVariantCatalog` guarda la dirección, el origen `authored`/`generated` y el fingerprint de cada variante aprobada. No guarda parámetros ni posiciones: los parámetros se reconstruyen desde la dirección y la huella comprueba que siguen siendo los mismos.

El artefacto vigente es `grade-7-dev-2`, con 159 entradas para las siete plantillas de producción; `grade-7-dev-1`, con 133, sigue publicado sin cambios. **Una versión publicada no se edita**: cuando el contenido cambia se construye la siguiente y la anterior queda tal cual, porque una run que declaró `dev-1` tiene que poder resolverse contra el conjunto que realmente jugó. Los dos son reproducibles byte a byte y `pnpm game:variants check` verifica la integridad del vigente dentro de `pnpm verify`.

`grade-7-dev-2` no es un superconjunto **semántico exacto** de `dev-1`: las plantillas cuyo contrato de generación no cambió conservan direcciones y huellas, pero el generador del acto del 25 de Mayo pasó a versión `2` y puede materializar otro contenido en una misma dirección bajo el contrato nuevo. `dev-1` conserva la versión anterior; no se reescribe. Ver [ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md).

Desde [ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md) **la partida elige dentro del catálogo aprobado**: el motor recibe un `ApprovedVariantLookup` y sortea sobre lo aprobado, con lo declarado por la plantilla como respaldo para un content set que todavía no tiene catálogo. `createRun` rechaza una run cuyo `variantCatalogVersion` no sea el del catálogo contra el que se la juega o reproduce.

Es un **catálogo aprobado de desarrollo**, no el catálogo oficial ni justo de la feria. La partida real de 7.º ya lo consume; lo que sigue pendiente para STAGE-05 es construir planes normales automáticamente por dificultad, variedad y presupuesto.

La huella es `sha256` de la vista semántica canónica declarada por la plantilla. Dos direcciones que producen el mismo problema colisionan y se deduplican intencionalmente.

## Controles anti-memorización

- barajado de opciones derivado del seed cuando la semántica lo permita;
- verificación de que la posición de la opción correcta esté balanceada;
- evitar repetir plantilla o variante inmediatamente dentro de una run;
- mantener presupuesto de dificultad equivalente entre runs — futuro de STAGE-05;
- no exponer el seed como una forma de elegir la run fácil.

Los criterios de aceptación de estos controles están en [validación y auditoría de variantes](../04-quality/variant-validation-and-audit.md).

## Estado de implementación

| Capacidad | Estado |
|---|---|
| Generación seeded, verificación de invariantes y vista pública sin solución | **implementado** en `src/game/challenges/` |
| Reproducibilidad por seed + versiones + acciones | **implementado**, con property tests y golden replays |
| Jerarquía explícita `ScenarioFamily → Template → Variant` | **implementada** — [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md), `src/game/challenges/content-model.ts` |
| Variante con identidad, dirección y substream propios | **implementada**; la dirección es `familia/plantilla/variante` |
| Catálogo de contenido disponible, separado del plan de la run | **implementado** — `ContentCatalog` y `RunPlan` |
| Elegibilidad por etapa declarativa, incluso no contigua | **implementada** |
| Roles de colocación y presupuesto de beats por año | **implementados** como contrato de plan validable |
| Fuentes híbridas `authored` / `generated`, ambas validadas | **implementadas** — seis plantillas generadas y `g7.group-tasks` autorada |
| Generador por restricción como abstracción reutilizable | **implementado** — [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md) |
| Validación, fingerprint, deduplicación y auditoría de población | **implementados** para el catálogo de desarrollo |
| Catálogo aprobado y versionado de variantes | **implementado** como `grade-7-dev-1` histórico e inmutable y `grade-7-dev-2` vigente, consumido por la partida real; el oficial de la feria sigue sin congelar |
| `variantCatalogVersion` en la identidad de la run | **implementado** como campo opcional: una run que juega variantes curadas no salió de ningún catálogo y lo dice omitiéndolo |

Cuidado con la palabra «catálogo»: `ContentCatalog` dice qué familias y plantillas existen; `ApprovedVariantCatalog` dice qué variantes concretas fueron aprobadas bajo una versión; `DemoPlan` dice qué muestra la demo docente; `RunPlan` dice qué juega una run normal. Son contratos distintos. Lo que todavía no existe es el catálogo **oficial y congelado de feria**, el compositor automático y la comparabilidad final por dificultad.

La brecha completa y su orden están en [arquitectura objetivo del motor](../03-architecture/target-engine-architecture.md) y en [la secuencia de implementación](../06-delivery/implementation-sequence.md).
