# ADR-021 — El catálogo aprobado dentro del juego, y el demo docente

- Estado: Aceptado
- Fecha: 2026-08-28

## Contexto

[ADR-020](ADR-020-variant-generation-and-approved-catalog.md) dejó un catálogo de 133 variantes verificadas que **nadie jugaba**. La partida de 7.º seguía sacando su contenido de las dos o tres variantes curadas que cada plantilla declara, y el catálogo era un artefacto que `pnpm verify` comprobaba y el juego ignoraba.

Un pipeline que no alimenta una partida no es una capacidad: es una promesa. Y la promesa que faltaba probar era doble.

**La primera es la variación numérica.** Que la segunda partida traiga otros números. Eso el catálogo ya lo tenía y sólo faltaba conectarlo.

**La segunda es más difícil y es la que justifica el modelo.** [ADR-019](ADR-019-scenario-family-template-variant.md) agrupa plantillas en familias porque una situación puede alojar varias preguntas. Hasta ahora eso se había demostrado con contenido de desarrollo, en una familia de fixtures. Si en contenido de producción cada familia sigue teniendo exactamente una plantilla, la familia es una carpeta con un nombre bonito.

Y hay una tercera cosa, ajena a las dos anteriores: alguien va a poner esto en una pantalla delante de un aula. Lo que un docente necesita ver no es lo que un estudiante juega.

## Decisión

### 1. La partida elige dentro de lo aprobado

`EngineDependencies` acepta un `ApprovedVariantLookup`: dado un `templateId`, qué variantes fueron aprobadas.

```text
pool = aprobadas(plantilla)  si hay alguna
     = plantilla.variants    si no
```

El fallback no es cortesía: un content set sin catálogo —los fixtures de desarrollo, una plantilla nueva antes de su primer build— tiene que seguir jugando. Lo que cambia cuando el catálogo existe es el tamaño del universo, no el mecanismo.

El puerto es deliberadamente angosto. `src/game/challenges` no puede importar `src/game/content` —lo prohíbe la regla de capas y hay un test de arquitectura que lo verifica—, así que la selección no conoce catálogos, entradas ni huellas: conoce una lista de ids. El adaptador que convierte un `ApprovedVariantCatalog` en esa lista vive del lado del catálogo. Ensanchar la capa para que el selector viera el artefacto entero habría sido la alternativa fácil y habría acoplado la elección a la forma del archivo.

### 2. El seed elige cuál, nunca qué

La elección usa el substream `stage/N/event/M/variant-pick/<plantilla>`, derivado del seed de la run. El contenido detrás de la dirección elegida sigue derivándose de `VARIANT_SPACE_SEED` como fijó [ADR-020](ADR-020-variant-generation-and-approved-catalog.md).

Las dos mitades juntas son la propiedad que importa: dos jugadores con el mismo seed ven la misma variante, y esa variante es el mismo problema para los dos. Sin la primera mitad no hay reproducibilidad; sin la segunda, un catálogo prevalidado no significa nada.

### 3. Una run declara de qué catálogo salió, y el motor lo comprueba

`createRun` rechaza un descriptor cuyo `variantCatalogVersion` no coincida con el catálogo que se le está dando. Reproducir una run de `grade-7-dev-1` contra `grade-7-dev-2` produciría otro contenido y el mismo score: exactamente el fallo silencioso que un motor determinista no puede permitirse.

Poner ese guard encontró un defecto real: **el codec del action log descartaba `variantCatalogVersion`**. Una run se serializaba, se parseaba y volvía sin catálogo, y desde el guard eso dejó de reproducir. El campo estaba en el descriptor desde ADR-020 y en el snapshot; en el log no. Nadie lo había notado porque hasta ahora nada dependía de él.

### 4. Las versiones publicadas del catálogo son inmutables

`grade-7-dev-1` no se regeneró. Se agregó `grade-7-dev-2` como archivo nuevo, y los dos viven en el content set indexados por versión. Una run que declaró `dev-1` puede resolverse contra el conjunto que realmente jugó.

> **Aclaración, 2026-09-18 (D-S08-126).** El principio se enunció acá sobre 7.º, y leído
> en general parecería universal. No lo es hoy, y la
> [re-auditoría independiente](../../04-quality/independent-mathematics-reaudit.md#mat-ra-009-observation-alcance-del-replay-de-los-catálogos-de-1º-a-5º)
> lo detectó: 7.º conserva `dev-1` a `dev-6`, mientras 1.º a 5.º **renombran** el
> artefacto a la versión siguiente (D-S08-088, D-S08-109), así que una run que declarara
> `grade-5-dev-2` no resuelve. Es deliberado mientras ese contenido está en `draft` con
> `official: false`, y el sistema **falla cerrado**: la compatibilidad de versiones es
> igualdad exacta en motor, ruleset y contenido, así que nunca resuelve contra el
> conjunto equivocado. La garantía de retención de este punto rige, por ahora, para los
> catálogos que una run **oficial** puede declarar. Antes de que exista una edición
> oficial, el requisito **R-S09-CAT** de STAGE-09 exige escribir la política de retención
> de replay por año y garantizar que todo descriptor declarable siga siendo resoluble.

El artefacto es una frontera y se parsea con zod al cargar el content set, no se castea: un catálogo corrupto tiene que fallar al arrancar y no más tarde, como una dirección que no resuelve en la mitad de una partida.

Agregar una plantilla no mueve ningún problema existente, y hay un test que lo comprueba entrada por entrada. **Cambiar un generador sí**, y esta versión cambió uno: las direcciones generadas del acto valen otra coreografía en `dev-2` que en `dev-1` (ver §6). Todas las demás conservan su huella. Publicar al lado en vez de regenerar es lo que permite afirmar las dos cosas.

### 5. La familia colectivo pasa a tener dos plantillas

`g7.bus-latest-departure` es la primera plantilla de producción que comparte familia con otra, y comparte también la situación: el 60 viene con demora.

| | `g7.bus-timing` | `g7.bus-latest-departure` |
|---|---|---|
| Pregunta | ¿a qué salida me subo? | ¿con cuánto tiempo salgo? |
| Trabajo | evaluar cuatro candidatas y descartar | recorrer la relación al revés |
| Respuesta | está entre las opciones | la produce el jugador |
| Interacción | timeline | numeric-input |
| Error | elegir mal | quedarse corto o pasarse |

Que la interacción sea distinta no es decoración: es la evidencia de que el razonamiento es distinto. Una pregunta cuya respuesta está en pantalla y una cuya respuesta hay que construir no son la misma pregunta con otros números, que es precisamente el estándar que [el scope de esta etapa](../../06-delivery/implementation-sequence.md) fija para llamar «plantilla nueva» a algo.

La restricción es **asimétrica** y ahí está la enseñanza: pasarse cuesta esperar en la puerta, quedarse corto cuesta entrar tarde. El evaluador lo dice con cuatro bandas, no con un acierto y un error.

**Su espacio semántico está medido: 360 problemas distintos**, y es el producto exacto de sus restricciones —30 pares duración/demora que dan minutos enteros, 4 horas de entrada, 3 márgenes—. La auditoría de 10.000 candidatos aprueba los 360 y descarta el resto por duplicado, con **cero rechazos**. El aviso de tasa de duplicados que emite es aritmética, no un defecto: agotado el espacio, todo candidato nuevo repite. Que 360 alcancen es una afirmación sobre un catálogo de desarrollo, no sobre el juego terminado.

### 6. Poner el catálogo a jugar encontró un defecto de contenido

El acto del 25 de Mayo promete que **marcar la grilla entera no sirve**: cobertura perfecta, precisión de la mitad, y el F1 lo castiga. La documentación incluso afirmaba el número: `F1 = 0,67`, Insuficiente.

Eso era cierto de las tres coreografías escritas a mano. No lo era de todas las que el generador podía producir. Con hasta cinco objetivos por ronda, una variante de quince objetivos deja `F1 = 30/39 = 0,77`, y marcar las veinticuatro celdas pasaba a leerse «Salió».

El defecto existía desde STAGE-03 y nadie podía verlo, porque la partida no jugaba variantes generadas. Apareció el día en que empezó a jugarlas, y lo encontró un E2E que fallaba una vez cada tres.

La propiedad dejó de ser una coincidencia de la autoría y pasó a ser una restricción:

- el generador construye los objetivos **desde el techo del acto** —tres por ronda de piso, y el excedente hasta doce repartido de a uno—, no sorteando cada ronda y mirando después;
- un validador independiente recalcula el F1 de marcar todo con aritmética entera y rechaza la variante si alcanza para zafar;
- un test de contenido lo comprueba sobre las veintisiete coreografías aprobadas, no sobre las tres curadas.

La versión del generador subió a `2`, que es lo que dice en voz alta que la misma dirección produce otra coreografía. Ésa es también la razón por la que `grade-7-dev-2` **no** es un superconjunto de `dev-1`: comparten las direcciones de las plantillas que no se movieron, y difieren en las del acto. Que las dos versiones convivan es lo que permite afirmar ambas cosas y verificarlas.

### 7. El slot elige entre plantillas; eso no es el Run Composer

El storylet del colectivo declara `challengePool: [busTiming, busLatestDeparture]` y el motor sortea dentro del pool, que es el mecanismo que los storylets ya tenían. No hay presupuesto de dificultad, ni equiparación, ni construcción de planes: eso es STAGE-05 y sigue sin empezar.

### 8. El demo docente es otro artefacto, no una run larga

`DemoPlan` es un tipo aparte, con validación aparte, y muestra las siete plantillas del año.

La tentación era obvia: un `RunPlan` con el presupuesto de beats aflojado. Se rechazó porque **una regla que cualquier llamador puede ensanchar con un argumento dejó de ser una regla**. El techo de uno a dos beats ordinarios por año es lo que mantiene jugable una carrera de seis años; si el demo se obtuviera relajándolo, el techo sería una sugerencia.

La separación se enforza desde el lado del demo, y en la dirección contraria a la esperable: un `DemoPlan` está **obligado** a llevar más beats ordinarios que los que un `StageContentPlan` admite. No puede convertirse en una run por accidente, y hay un test que corre el demo por `validateStagePlan` y comprueba que lo rechaza —por presupuesto y por cantidad de anchors, dos razones independientes—.

Un beat de demo además declara `showcases`: qué demuestra, en la frase que diría quien lo está mostrando. En una run, por qué está un beat es asunto del compositor y el jugador nunca lo pregunta; en una demostración es lo único que se pregunta.

La cobertura que el validador exige incluye una condición que no es de cantidad: **alguna familia tiene que aportar dos plantillas**. Un demo de siete situaciones distintas probaría amplitud; lo que hay que mostrar es que una misma situación aloja dos preguntas.

## Alternativas consideradas

**Dejar que la partida siguiera jugando variantes curadas.** Es lo que había. Convierte a STAGE-03 en tooling que se valida a sí mismo.

**Un `RunPlan` con presupuesto configurable para el demo.** Descrito arriba: vuelve negociable la única regla que mantiene corta una run.

**Que el selector de variantes leyera el `ApprovedVariantCatalog` completo.** Habría requerido ensanchar la frontera entre `challenges` y `content` —o debilitar la regla de capas— para que la elección conociera huellas y versiones que no necesita.

**Regenerar `grade-7-dev-1` con la plantilla nueva.** Un archivo menos, y la reproducción de cualquier run anterior reescrita en silencio.

**Una segunda plantilla en otra familia.** El mural o el cuaderno también admiten una segunda pregunta. El colectivo se eligió porque es el primer beat del año: el contraste se ve en los primeros treinta segundos de la segunda partida, que es exactamente cuando hay que verlo.

**Meter más margen y más horarios en el generador para agrandar los 360.** Habría cambiado huellas por una ganancia que ningún consumidor pide todavía. El número está medido y escrito; agrandarlo es trabajo de contenido cuando el inventario se decida.

## Consecuencias

- `ENGINE_VERSION` pasa a `4.1.0` y `ACTION_LOG_VERSION` a `2`. La forma serializada del log cambió —lleva `variantCatalogVersion`— y la semántica de selección también. La huella del motor se movió a `2477ca1f`; **el ruleset quedó idéntico en `d3319440`**, que es la evidencia de que ninguna política de juego se tocó.
- El contenido de 7.º sube a `0.6.0-grade-7` por la plantilla nueva. El contenido de desarrollo no se movió y su huella lo confirma.
- Las runs golden cambian de hash y **no de resultado**: mismo recorrido, mismo score, mismo perfil, misma cantidad de comandos. Lo único que se movió adentro del estado es la versión que el descriptor declara.
- El catálogo vigente es `grade-7-dev-2`: 159 variantes, 161 candidatos, 0 rechazos, 2 duplicados. Sigue siendo de desarrollo. **El catálogo de la feria no se congeló** y congelarlo sigue siendo una decisión de evento.
- El generador del acto pasa a `2` y sus direcciones cambian de contenido entre `dev-1` y `dev-2`. La barrida profunda vuelve a dar **36.064 candidatos y 0 rechazos** con el techo nuevo, así que la restricción no le sacó población.
- 7.º tiene siete plantillas y seis beats por partida. Cuál de las dos del colectivo sale lo decide el seed.
- El inventario de escenarios sigue `OPEN`. Que la familia colectivo tenga dos plantillas no dice cuántas tendrá ninguna otra.

## No objetivos

Run Composer, bandas de dificultad y presupuesto equiparado siguen siendo STAGE-05; score competitivo, ranking y modo feria, más adelante. El demo docente **no** está aprobado por ningún docente: es un candidato, y el Teacher Gate 1 es un gate externo que no pasó nadie todavía.
