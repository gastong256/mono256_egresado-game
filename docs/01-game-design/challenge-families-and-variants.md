# Familias de escenario, plantillas y variantes

**Estado: mixto.** El seed determinista y la reproducibilidad son **LOCKED** ([ADR-003](../03-architecture/adr/ADR-003-deterministic-seeded-engine.md), [ADR-012](../03-architecture/adr/ADR-012-seeded-prng-and-substreams.md)). La jerarquía `ScenarioFamily → Template → Variant` y el catálogo prevalidado de competencia son **RECOMENDADOS**: dirección de arquitectura, no contrato cerrado. La cantidad de plantillas por año es **OPEN**.

## El problema

Un desafío fijo se memoriza. Cambiar `25 %` por `15 %` compra una partida más: el jugador igual aprende “la segunda opción”. Lo que hace falta es **variación estructural** —que cambie el razonamiento, no sólo los números.

Un docente que juega dos veces la demo tiene que ver una diferencia real. Si sólo se reordenan las opciones, no se puede llamar variación.

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

Los números y las opciones concretas, generados o seleccionados de forma determinista.

## Seed determinista

**LOCKED.** Toda variante tiene que poder reconstruirse desde la identidad de la run. La lógica de dominio nunca llama a un `Math.random()` ambiente; el motor ya impone esto y lo verifica con property tests.

Derivación sugerida para el nivel de variante:

```text
variantSeed = H(runSeed, familyId, templateId, slotIndex, contentVersion)
```

La función de derivación es propiedad del proyecto y está versionada, para que cambiar de librería de PRNG no reordene en silencio una competencia ya jugada. El contrato de substreams vigente está en [ADR-012](../03-architecture/adr/ADR-012-seeded-prng-and-substreams.md).

## Generación por restricción, no por sorteo

**RECOMENDADO.** Generar desde la propiedad pedagógica deseada, no desde parámetros arbitrarios con la esperanza de que el resultado siga siendo válido.

Ejemplo de mural: se quiere que 1 L no alcance, 2 L sea óptimo y 4 L sea válido pero derrochador. Con cobertura de 8 m²/L, se genera primero el área requerida en `(8, 16]` y recién después se eligen dimensiones legibles que den ese área. El camino inverso —elegir dimensiones y ver qué sale— produce variantes triviales o imposibles.

Esto ya es el patrón vigente del motor: el generador produce parámetros, el verificador comprueba invariantes y la presentación nunca lleva la solución. Ver [game engine](../03-architecture/game-engine.md).

## Variación no es azar

```text
Generador → N seeds candidatas → invariantes → auditoría de dificultad
          → auditoría estadística → catálogo aprobado → selección determinista en runtime
```

Un número al azar en runtime puede producir decimales feos, óptimos ambiguos, opciones duplicadas, estados imposibles, variantes triviales o dificultad desbalanceada. En una partida de práctica eso es un bug; en una competencia con premios es una injusticia que no se puede deshacer.

El principio viene de STACK, que recomienda pregenerar, testear y desplegar variantes aleatorias en vez de exponer al estudiante a casos defectuosos generados en vivo. Ver [base teórica](../07-reference/research-basis.md).

## Catálogo desplegado

**RECOMENDADO / TARGET.** Para modo competitivo, un job de build genera muchas seeds candidatas, retiene sólo las validadas y publica un catálogo versionado:

```json
{
  "catalogVersion": "fair-2026-v1",
  "templateId": "bus.delay.v1",
  "variants": [{ "seed": 123, "difficulty": "STANDARD", "fingerprint": "..." }]
}
```

El runtime elige de ese catálogo con el seed de la run. Un catálogo con cientos o miles de combinaciones válidas sigue dando variedad, sin exponer nada que nadie revisó.

Cada variante lleva un **fingerprint canónico** de sus parámetros públicos y de la semántica de su respuesta, para detectar seeds distintas que producen la misma pregunta.

## Controles anti-memorización

- barajado de opciones derivado del seed cuando la semántica lo permita;
- verificación de que la posición de la opción correcta esté balanceada;
- evitar repetir plantilla o variante inmediatamente dentro de una run;
- mantener presupuesto de dificultad equivalente entre runs;
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
| Generador por restricción como abstracción reutilizable | **no implementada** |
| Catálogo desplegado y versionado de variantes competitivas | **no implementado** |
| `variantCatalogVersion` en la identidad de la run | **no implementado**; hoy la tripleta es `gameVersion`/`rulesetVersion`/`contentVersion` |

Cuidado con la palabra «catálogo»: el **catálogo de contenido** que ya existe es lo autorado y disponible; el **catálogo desplegado de variantes** que todavía no existe es el conjunto generado, validado y aprobado para competencia. Son dos cosas distintas.

La brecha completa y su orden están en [arquitectura objetivo del motor](../03-architecture/target-engine-architecture.md) y en [la secuencia de implementación](../06-delivery/implementation-sequence.md).
