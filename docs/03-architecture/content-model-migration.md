# Migración del contenido al modelo de familia, plantilla y variante

Cómo se mueve el contenido existente al modelo de [ADR-019](adr/ADR-019-scenario-family-template-variant.md), qué se migró ya y qué queda deliberadamente para después.

**Estado: la migración estructural está hecha, STAGE-03 completó el pipeline posterior y STAGE-04 lo puso a jugar.** Las siete plantillas de 7.º y las ocho de desarrollo declaran familia, rol de colocación y variantes con identidad propia. Las plantillas de producción también declaran su `VariantSourceSpec`, validadores y canonización según [ADR-020](adr/ADR-020-variant-generation-and-approved-catalog.md), y la partida elige dentro del catálogo aprobado según [ADR-021](adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md). Lo que **no** hizo la migración, a propósito, es mover contenido de año ni tocar una sola cuenta.

## Principio de la migración

> Direccionar el contenido no es rediseñarlo.

La migración cambia **cómo se nombra y se ubica** una situación. No cambia qué pregunta, con qué números, ni qué le hace a la carrera. La evidencia de que se cumplió está en las runs golden: mismo recorrido, mismo score, mismo perfil, misma cantidad de comandos.

## Los seis desafíos como sondas de arquitectura

Los seis se inspeccionaron para comprobar que el modelo representa lo que necesitan **sin ningún caso especial en el motor**. Cubren seis dominios matemáticos, seis interacciones y cuatro combinaciones distintas de efectos de carrera.

| Desafío | Familia | Estructura cognitiva | Variantes | Rol | Interacción | Efecto de carrera | ¿Sin caso especial en el motor? |
|---|---|---|---|---|---|---|---|
| `g7.bus-timing` | `bus` | tiempo con demora porcentual contra un límite | `demora-25`, `demora-50` | `anchor` | timeline | Estilo | sí |
| `g7.mural-paint` | `mural` | área y cobertura por envase entero | `pared-6x24`, `pared-5x24` | `checkpoint` | decision-card | Promedio, Estilo | sí |
| `g7.notebook-offer` | `notebook` | porcentaje contra descuento fijo con efectivo limitado | `precio-alto`, `precio-bajo` | `anchor` | decision-card | Estilo | sí |
| `g7.group-tasks` | `group-project` | asignación con capacidad y afinidad | `equipo-a`, `equipo-b` | `anchor` | assignment-board | Equipo, Estilo | sí |
| `g7.stand-supplies` | `school-fair` | packs, mínimo requerido y presupuesto | `porciones-24`, `porciones-20` | `anchor` | budget-builder | Equipo, Estilo | sí |
| `g7.may-25-act` | `may-25` | clasificación por regla, juzgada con F1 | `coreografia-a`, `coreografia-b`, `coreografia-c` | `special` | number-grid | Aura, Estilo | sí |

Lo que la tabla prueba:

- **Seis interacciones distintas** entran en el mismo contrato de plantilla.
- **Los roles son semántica de colocación, no de calidad.** El mural es `checkpoint` porque la profesora lo toma como trabajo del trimestre; el acto es `special` porque ocurre en público. Ninguno de los dos «vale más».
- **Los efectos de carrera no se derivan del rol.** El acto es `special` y mueve Aura; el mural es `checkpoint` y pone nota. Son ejes independientes.
- **La cantidad de variantes es propiedad de la plantilla**, no del modelo: el acto declara tres y las demás dos.

> **Esta tabla no es el inventario final de escenarios de Egresado.** Es la matriz de sondas con la que se validó la arquitectura, tal como estaba al migrar. La ubicación de los seis en 7.º es consecuencia del primer slice vertical.

STAGE-04 sumó una séptima, `g7.bus-latest-departure`, en la familia `bus`: misma situación, otra pregunta, interacción `numeric-input`, rol `anchor`, Estilo. Es la primera vez que dos plantillas de producción comparten familia. Ver [ADR-021](adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md).

## Qué cambió en cada desafío

Exactamente dos cosas por archivo:

1. **La declaración.** Se agregaron `family`, `placement` y `variants`; el array `VARIANTS` pasó a llevar un `id` por entrada.
2. **La selección.** `const variante = rng.pick(VARIANTS)` pasó a `const variante = authoredVariant(ID, VARIANTS, variantId)`.

Nada más. Ni la narrativa, ni la presentación, ni el evaluador, ni las invariantes, ni un solo número.

## Dónde se eligen ahora las variantes

Antes la variante se elegía **dentro** del generador, en el substream del intento de generación. Ahora se elige **al construir la dirección de la instancia**, en un substream propio, y la dirección viaja en el `ChallengeInstanceRef`.

Consecuencia declarada: para un mismo seed de run, una plantilla de 7.º puede caer en otra variante autorada que antes. La matemática, el conjunto de variantes alcanzables y las invariantes son las mismas. Eso es un cambio de identidad de contenido y por eso la versión de contenido de 7.º subió a `0.4.0-grade-7`.

Desde ADR-020 hay una separación adicional: el `runSeed` puede seleccionar una dirección, pero sus parámetros semánticos se materializan desde `VARIANT_SPACE_SEED` y la dirección `familia/plantilla/variante`. Bajo el mismo contrato versionado de contenido/generador, cambiar de run o de slot no cambia el problema detrás de esa dirección. Esa semántica y las fuentes híbridas llevaron el contenido a `0.5.0-grade-7` sin cambiar el ruleset.

Las plantillas de desarrollo declaran **una sola variante** cada una, y una lista de un elemento no gasta ningún sorteo: su generación es byte a byte la de antes, que es lo que mantiene las runs golden intactas.

## Lo que la migración NO hizo

La migración no dividió ninguna familia en varias plantillas: la prueba de que dos conviven en una familia se hizo con contenido de desarrollo, en la familia `school-data`, para no crear gameplay de producción fuera de alcance. **STAGE-04 sí dividió una**: `bus` tiene desde entonces la comparación de salidas y la anticipación necesaria, y la migración quedó como lo que era, un cambio de direccionamiento. Que la familia pueda tener cuatro estructuras —comparación de recorridos, frecuencia— sigue siendo capacidad disponible y no trabajo hecho; autorarlas es contenido, no arquitectura.

No se renombró ningún id de contenido. `g7.bus-timing` sigue llamándose así aunque el prefijo `g7.` sugiera una ubicación que el modelo ya no necesita. Renombrarlo es cambiar identidad de contenido y pertenece a la etapa que decida ubicaciones.

No se movió contenido de año, no se sacó nada y no se agregó contenido de producción.

## Cómo migrar una plantilla nueva

Para quien traiga contenido al modelo más adelante:

1. Elegir la **familia**: ¿en qué situación reconocible ocurre? Si la familia no existe, agregarla al módulo de familias del content set.
2. Elegir el **rol**: ¿es el beat primario del año (`anchor`), una evaluación (`checkpoint`), un momento social o excepcional (`special`) o contenido condicional de recuperación (`recovery`)?
3. Declarar la **elegibilidad**: en qué etapas *puede* aparecer. Permiso, no selección.
4. Nombrar las **variantes curadas de respaldo** con ids estables y semánticos. El orden de `variants` afecta qué dirección elige un seed cuando el content set no aporta catálogo aprobado, pero no define identidad: esa identidad es el id dentro de la dirección completa.
5. Declarar un `VariantSourceSpec`: parámetros `authored`, validadores, vista `canonical` y, si el dominio lo justifica, un `VariantGenerator` constraint-first. Tanto authored como generated pasan por el mismo pipeline.
6. Escribir `generate` sobre los parámetros ya resueltos. No leer `runSeed` para decidir su contenido: el `variantRng` deriva del seed fijo del espacio de variantes y de la dirección semántica.
7. Registrar la plantilla en el `ContentCatalog`; construir, auditar y verificar el `ApprovedVariantCatalog` con `pnpm game:variants build`, `audit` y `check`. Aprobarla no la agrega por sí solo a un `RunPlan`. **No hace falta tocar el motor ni el pipeline.**

La ficha de autoría previa al código está en [la guía de autoría](../01-game-design/content-authoring-guide.md).

## Trabajo futuro de ubicación de contenido

Cuando el proyecto decida el inventario definitivo, cada escenario existente se clasificará como **KEEP**, **MOVE**, **REWORK**, **MERGE**, **REPLACE** o **REMOVE**. Esa auditoría no se hizo y no corresponde hacerla desde la arquitectura: depende del alcance de contenido, del gate docente y de la duración objetivo de una run. Ver [preguntas abiertas](../07-reference/open-questions.md) y [el roadmap](../06-delivery/implementation-sequence.md).
