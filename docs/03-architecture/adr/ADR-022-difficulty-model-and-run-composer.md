# ADR-022 — Modelo de dificultad y compositor de runs

- Estado: Aceptado
- Fecha: 2026-08-29

## Evolución de carrera completa — 2026-09-10

La enumeración por etapa de este ADR sigue siendo la baseline implementada.
ADR-025 extiende composición y validación a restricciones globales de carrera;
no declara que el algoritmo actual ya garantice nueve beats ni cuotas completas.
[Decisión técnica futura](ADR-025-full-career-contract-evolution.md);
[reconciliación de producto](../../07-reference/full-career-product-audit-integration.md).
No se modifican runtime ni versiones en esta integración.

## Contexto

[ADR-021](ADR-021-approved-catalog-in-play-and-teacher-demo.md) puso el catálogo aprobado adentro del juego. Lo que quedó sin resolver es **quién elige**.

Hoy elige el storylet dentro de su pool y el seed dentro de lo aprobado. Nadie mira dificultad, variedad, cobertura ni presupuesto. En una competencia eso significa que parte del resultado lo decide el sorteo, y ése es exactamente el problema que [la auditoría de equidad](../../04-quality/competition-fairness-audit.md) señala.

Hay además una deuda concreta y vieja. [ADR-019](ADR-019-scenario-family-template-variant.md) fijó que un año aporta **uno o dos beats ordinarios**, porque una carrera cruza seis años y el producto depende de que se pueda volver a jugar. El año de 7.º juega seis. Eso no era una violación —el contrato existía antes que el contenido, y STAGE-04 lo declaró densidad de demostración— pero seguía sin haber una partida normal en ninguna parte.

La pregunta de esta etapa es una sola:

> Tenemos un catálogo rico y confiable. ¿Cómo se elige lo poco que juega una run, de modo que siga siendo corta, determinista, variada, válida y comparable?

## Decisión

### 1. La dificultad se declara como estructura, no como número

Una plantilla declara seis rasgos de su estructura —pasos encadenados, restricciones simultáneas, selección de información, optimización, incertidumbre, y si la respuesta hay que **construirla** o alcanza con reconocerla—. De ahí sale la banda `core / standard / stretch` por una función pura.

Eso convierte en ejecutable lo que [el documento de dificultad](../../01-game-design/difficulty-and-playability.md) ya decía: la dificultad sube por relaciones, restricciones, planificación y optimización, y **no** por números grandes, decimales feos, fórmulas avanzadas ni presión de tiempo. Un autor que quiere que su plantilla se agende como `stretch` tiene que nombrar el rasgo que la vuelve así.

El caso que mejor lo muestra es la familia colectivo. Sus dos plantillas comparten situación, matemática y hasta los cuatro primeros rasgos; se separan en uno solo:

| | `g7.bus-timing` | `g7.bus-latest-departure` |
|---|---|---|
| construcción | 0 — la respuesta está entre cuatro salidas | 1 — el número lo produce el jugador |

Seis rasgos y no treinta: uno que nadie puede clasificar dos veces igual es peor que ninguno.

### 2. Costo de scheduling ≠ multiplicador de score

El compositor necesita una señal **fuerte** entre `core` y `stretch` para poder equilibrar; el score necesita una **débil** para que la suerte del sorteo no le gane a la habilidad. Son dos números distintos y viven en lugares distintos. Este ADR define el primero. El segundo es STAGE-06 y sigue siendo documentación.

Los costos van en **centésimas enteras** —100, 150, 210— y no en decimales. Un presupuesto que suma flotantes y después compara contra un límite termina discutiendo consigo mismo si un plan entraba; el motor ya rechaza el punto flotante donde el resultado importa ([ADR-013](ADR-013-exact-rational-arithmetic.md)) y un presupuesto es uno de esos lugares.

### 3. La calibración es un dato versionado, no una constante

Bandas, costos, objetivos, presupuestos y tolerancias viven en dos objetos —`DifficultyCostPolicy` y `CompositionPolicy`— con `id`, `version` y `official: false`. Recalibrar es cambiar datos; ningún algoritmo de composición se toca. Es lo que un Teacher Gate necesita poder hacer.

Ninguno de los números es oficial. Son los candidatos que el documento de diseño ya proponía, y siguen siendo `RECOMENDADA` con la calibración final en el Gate ([pregunta 44](../../07-reference/open-questions.md)).

### 4. El compositor enumera; no sortea hasta acertar

Un año juega un anchor y como mucho un secundario, así que el espacio factible es

```text
anchors × (nada | secundarios)
```

y cabe entero en memoria. El compositor lo construye completo, filtra por las restricciones duras y recién entonces ordena.

Un `while (!válido) volver a sortear` habría sido más corto de escribir y esconde su propia distribución: sesga hacia lo que el RNG alcanza primero y no tiene peor caso acotado. La enumeración tiene una respuesta inspeccionable a «¿por qué este plan?»: le ganó a los otros, en este orden, por estos objetivos.

### 5. Duras son filtros; blandas son un orden lexicográfico

**Duras** —nunca se negocian, nunca se convierten en penalización—: elegibilidad de etapa, variante aprobada, exactamente un anchor, el presupuesto de uno a dos beats, rol secundario permitido, ninguna plantilla dos veces en un año, ninguna plantilla repetida en la carrera, y el sobre de dificultad.

**Blandas** —declaradas en la política, aplicadas en orden—: cercanía al objetivo de dificultad, variedad de familia, variedad de interacción, cobertura de dominios, frescura de plantilla. Lexicográfico y no suma ponderada: una suma esconde por qué ganó un plan y deja que una preferencia menor le gane a la que importaba.

Los empates que sobreviven a todos los objetivos los rompe un sorteo con el seed sobre una lista ordenada canónicamente. Ahí es donde la variedad entre partidas es real: 5.000 seeds de 7.º producen **1.374 planes distintos con carga idéntica**.

### 6. No repetir una plantilla es una restricción dura

Empezó como preferencia y la carrera de desarrollo mostró por qué no alcanza: el storylet que aloja una plantilla suele ser de una sola vez, así que agendarla de nuevo deja al segundo beat **sin dónde ocurrir**, y la run se acortaba en silencio. Es dura, y configurable por si algún día una plantilla debe reaparecer a propósito.

Las **familias** sí pueden repetirse entre años: transferir el mismo razonamiento a otro contexto es un objetivo de diseño, y esto es sobre plantillas.

### 7. El plan se decide una vez y se ejecuta

`createRun` compone. El motor ejecuta. Un beat ordinario ya no se sortea en `beginEvent`: viene del plan.

La capa narrativa no perdió nada — decide **dónde** ocurre un beat, y el plan decide **cuál** es. Un storylet con desafíos sólo es elegible si puede alojar el beat que toca; uno puramente narrativo entra sólo si al año le sobra un evento. Sin esa segunda regla, un content set conversador podía dejar a un año sin sus decisiones.

La duración de una etapa compuesta sale del plan, no de `eventCount`. Ahí está la reconciliación de la deuda: la demo de 7.º sigue declarando ocho eventos y **una partida normal juega tres**.

### 8. Recomponer en runtime está prohibido, y se comprueba

Reanudar juega el mismo plan; reproducir, el mismo; el servidor verifica el mismo. El snapshot guarda el plan **concreto** en vez de la forma de recalcularlo, porque una reanudación tiene que jugar el año que el jugador empezó y no el que la calibración de hoy compondría.

El descriptor lleva una **huella del plan**. `createRun` compone y compara: si la calibración se movió desde que la run se creó, la run se rechaza en lugar de jugar otro año con la misma identidad.

### 9. El validador es otro programa

El compositor construye planes válidos; el validador decide si un plan lo es. Igual que en [ADR-020](ADR-020-variant-generation-and-approved-catalog.md) con generador y validador, y por el mismo motivo: un chequeo que re-ejecuta al constructor y compara sólo puede confirmar la opinión del constructor, y rechazaría un plan distinto pero perfectamente legal. Hay un test que le da exactamente ese plan y comprueba que lo acepta.

Tampoco le cree al plan sus propias afirmaciones. Un beat declara rol, banda y costo; los tres se recalculan desde el catálogo y la política y se comparan. Un plan que dice que una plantilla `stretch` vale un beat `core` parsea perfecto y es el que una competencia tiene que poder rechazar.

### 10. El compositor no conoce ningún id de contenido

Ni familias, ni plantillas, ni materias, ni años. Lee metadata. Lo que 7.º tiene de particular —que su cadena narrativa corta sólo alcanza el colectivo y el acto— vive en la **política** como dato, no en el algoritmo.

La prueba de que eso alcanza es una carrera de desarrollo de cinco etapas que se compone con el mismo código, con objetivos que suben de 250 a 310, sin que nada sepa qué es un año escolar. Agregar 1.º a 5.º de verdad será una entrada de política y contenido.

## Alternativas consideradas

**Dejar que el storylet siguiera eligiendo.** Es lo que había. Hace imposible cualquier afirmación sobre carga comparable y deja el ranking parcialmente al sorteo.

**Un `RunPlan` con presupuesto configurable para poder seguir jugando seis beats en 7.º.** Vuelve negociable la única regla que mantiene corta una carrera. Ya se había rechazado en [ADR-021](ADR-021-approved-catalog-in-play-and-teacher-demo.md) para el demo docente, y vale igual acá.

**Migrar la pantalla de 7.º a partidas compuestas.** Habría borrado la demo amplia que STAGE-04 acababa de construir y documentar, y habría necesitado marco narrativo nuevo para beats compuestos —contenido de producción, fuera del alcance de esta etapa—. Las dos formas conviven: el ruleset `grade-7` juega el arco completo y `grade-7-composed` juega el año normal. Cuál usa la pantalla es una decisión de producto que tiene sentido cuando existan los años 1.º a 5.º.

**Dificultad por variante.** Se evaluó y se descartó: las variantes de una plantilla se mantienen dentro de su envolvente porque los generadores están restringidos, y darle a cada una un número propio habría multiplicado la superficie de calibración sin evidencia de que haga falta. Si aparece una plantilla cuyo espacio cruza bandas, la primera respuesta es apretar el generador.

**Una suma ponderada de objetivos.** Más flexible y menos explicable. Con cinco objetivos y un espacio de dos beats, el orden lexicográfico dice lo mismo y se puede leer.

**Un solver ILP/SAT.** Innecesario para un espacio de dos beats, y habría cambiado una decisión inspeccionable por una caja negra.

## Consecuencias

- `ENGINE_VERSION` pasa a `5.0.0`, `SNAPSHOT_SCHEMA_VERSION` a `5` y `ACTION_LOG_VERSION` a `3`. Componer cambia **qué es una run**, y las dos formas serializadas se movieron para llevar el plan y su huella.
- **El ruleset ahora incluye la política de composición.** Es una regla, no contenido: decide cuántos beats juega un año, qué roles pueden llenarlos y cuánta carga lleva una run, y dos jugadores con políticas distintas no están jugando al mismo juego. Su huella la cubre entera, número por número, para que una recalibración no pueda viajar en silencio bajo la misma versión.
- El contenido sube a `0.7.0-grade-7` y `0.5.0-dev`: el perfil cognitivo es contenido que decide scheduling, así que entra a la huella de contenido.
- El catálogo aprobado vigente pasa a `grade-7-dev-3`. Sus entradas y huellas son las de `grade-7-dev-2`; lo único que cambió es contra qué versión de contenido se construyó. Se publicó al lado igual, porque la regla de inmutabilidad no admite excepciones «chicas».
- Las runs golden cambian de hash y **no de resultado**: mismo recorrido, mismo score, mismo perfil, misma cantidad de comandos.
- `pnpm game:compose` reporta la distribución de una barrida de seeds, y `pnpm game:simulate --content=…-composed` juega miles de runs compuestas verificando replay y snapshot.
- Un content set sin política de composición no cambia en nada. La demo amplia de 7.º sigue jugando sus ocho eventos.

## Lo que esto no prueba

Que dos runs sean **igual de difíciles para una persona**. Lo que hay es comparabilidad estructural bajo una calibración que ningún docente validó todavía. Que 5.000 runs tengan carga idéntica dice que el presupuesto funciona, no que el presupuesto mida lo correcto. Eso lo deciden el Teacher Gate y, después, los datos de la feria.

## No objetivos

Score competitivo, `FairScore`, multiplicadores y `scoreVersion` siguen siendo STAGE-06. Egreso, recuperaciones y contenido de 1.º a 5.º, más adelante. La dificultad adaptativa en modo oficial sigue `OPEN` ([pregunta 5](../../07-reference/open-questions.md)), y este diseño no la decide: define el mecanismo con el que una política, adaptativa o no, tendría que expresarse.
