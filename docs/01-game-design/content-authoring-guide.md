# Guía de autoría de contenido

## Objetivo

Permitir que nuevos desafíos se incorporen con consistencia lúdica, matemática y técnica.

## Plantilla de diseño

Cada desafío debe responder:

1. **Situación:** ¿qué ocurre?
2. **Objetivo del personaje:** ¿qué quiere lograr?
3. **Datos:** ¿qué números conoce?
4. **Restricciones:** ¿qué limita las opciones?
5. **Acción del jugador:** ¿qué manipula/elige?
6. **Matemática:** ¿qué razonamiento ayuda?
7. **Soluciones:** ¿qué es inválido, funcional, eficiente u óptimo?
8. **Consecuencia:** ¿cómo se explica el resultado?
9. **Efecto narrativo:** ¿qué stats/flags cambian?
10. **Variantes:** ¿qué parámetros pueden generarse proceduralmente?

## Regla “sin números”

Eliminar mentalmente todos los números del evento. Si la decisión sigue siendo obvia o equivalente, la matemática probablemente es decorativa.

## Regla “no examen”

Reformular:
- “¿Cuál es el área?” → “¿Qué pack de pintura alcanza?”
- “¿Cuánto es 20% de 800000?” → “¿Qué oferta realmente cuesta menos?”
- “¿Cuál es la media?” → “¿Qué grupo tuvo mejor rendimiento considerando tamaño?”

## Accesibilidad matemática universal

TG1-01 convierte el piso bajo/techo alto en requisito para todos los años. Antes de aprobar una plantilla, responder:

1. ¿Un jugador capaz a nivel aproximado de 7.º entiende los conceptos necesarios?
2. ¿La dificultad viene del razonamiento y no de currículo avanzado?
3. ¿Unidades y términos se introducen con claridad?
4. ¿El año académico cambia el contexto y la responsabilidad, no el prerrequisito?
5. ¿La situación se entiende sin fórmulas especializadas de años posteriores?

Accesible no significa trivial: el techo puede subir mediante restricciones, optimización, planificación, información irrelevante y consecuencias.

## Longitud

- Título: 2–6 palabras.
- Contexto principal: idealmente <60 palabras.
- Opciones: frases cortas.
- Explicación posterior: fragmentada visualmente, no párrafo largo.

## Parámetros

Definir rangos seguros.

Ejemplo:

```text
wall_width: [3.0, 8.0]
wall_height: [2.0, 3.5]
coverage_per_liter: [5, 10]
packages: generated so that >=1 valid and >=1 invalid option exist
```

## Invariantes de generación

Un challenge procedural debe poder afirmar automáticamente:
- tiene al menos una solución funcional;
- si declara solución óptima, ésta existe;
- no hay dos opciones visualmente distintas con mismo resultado si eso confunde;
- las unidades son consistentes;
- el resultado entra en límites de UI;
- no se produce división por cero;
- el valor no excede precisión razonable para la etapa.

## Estados de contenido

- `draft`.
- `math_reviewed` — revisado por el Departamento de Matemática.
- `playtest_ready` — listo para prueba con jugadores. Antes de la feria eso significa **prueba proxy con adultos**, no con estudiantes del rango objetivo; ver [ciclo de entrega real](../00-product/real-delivery-lifecycle.md).
- `production_ready`.
- `retired`.

## Checklist editorial

- Lenguaje argentino neutral, comprensible fuera de una provincia específica.
- No usar marcas comerciales reales salvo decisión expresa.
- No asumir nivel socioeconómico como norma.
- Evitar presión financiera personal; contextualizar presupuestos como recursos del proyecto/curso.
- No usar salud, religión, política partidaria u otros datos sensibles del jugador como personalización.
- Humor sin humillación.

## Tres preguntas que la plantilla original no hacía

### Efectos de carrera: sólo los que se pueden mover

¿El evento toca genuinamente Promedio, Equipo, Aura o Estilo? La mayoría de los eventos deberían tocar **una o dos** dimensiones, no las cuatro. Una clave ausente significa que el evento no puede mover esa dimensión, y por eso `Promedio +0` ni siquiera es representable. Ver [ADR-016](../03-architecture/adr/ADR-016-career-player-model.md).

Promedio se mueve sólo si el evento es genuinamente académico. Aura se mueve sólo si el momento es socialmente memorable: un cálculo correcto no produce Aura.

### Efectos de competencia: separados de las stats visibles

Cada evaluador declara su calidad matemática normalizada y, si corresponde, una contribución acotada de Equipo o de Aura, **aparte** de los efectos de carrera visibles. TG1-05/TG1-06 permiten multi-evaluación, con esta regla canónica:

> Una misma escena puede evaluar más de una dimensión, pero no puede otorgar crédito competitivo dos veces por la misma evidencia.

Checklist obligatorio:

1. ¿Qué propiedad matemática se mide?
2. ¿Qué propiedad de Equipo se mide, si existe?
3. ¿Qué propiedad de Aura se mide, si existe?
4. ¿Son hechos genuinamente diferentes?
5. ¿Se puede quitar una componente sin cambiar el significado de otra?
6. ¿Alguna señal se está contando dos veces?

Válido: factibilidad matemática y calidad independiente del reparto de responsabilidades. Inválido: copiar el mismo F1 del acto del 25 de Mayo a Matemática y Aura. Si no existe evidencia independiente, la componente es `none`; no se fuerza Equipo/Aura por plantilla.

La idea docente del colectivo —varios márgenes matemáticamente válidos con consecuencias sociales distintas— es un ejemplo futuro de autoría, no una regla runtime actual. Del mismo modo, May-25 sólo podrá aportar Aura competitiva si incorpora una decisión pública/social distinta de la clasificación numérica.

### Ocultos: dominio y flags

¿Qué dominios matemáticos ejercita? ¿Qué flag narrativo escribe? Ninguno de los dos se renderiza.

## Invariantes antes que generador

Los invariantes de una variante se escriben **antes** que el código que la genera: al menos una solución válida, sin óptimo ambiguo salvo diseño explícito, aritmética legible, contexto escolar plausible, sin opciones duplicadas y posición de la opción correcta no fija. La dificultad no se declara como etiqueta elegida: la plantilla declara su perfil cognitivo y la banda se deriva.

La lista completa y sus criterios de aceptación están en [validación y auditoría de variantes](../04-quality/variant-validation-and-audit.md).

## Elegir la fuente de variantes

Desde [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md), cada plantilla declara un `VariantSourceSpec` con parámetros autorados, validadores, una vista canónica y, cuando corresponde, un generador determinista.

Hay dos estrategias de primera clase:

```text
AUTHORED
parámetros curados → validar → canonizar → fingerprint
    → deduplicar → catálogo aprobado de desarrollo

GENERATED
dominio paramétrico + generador constraint-first → materializar
    → validar con oráculo → auditoría profunda → canonizar
    → fingerprint → deduplicar → catálogo aprobado de desarrollo
```

`AUTHORED` no significa «confiable sin validar»: cada registro pasa por los chequeos genéricos y específicos, la huella y la deduplicación. Es la estrategia deliberada para contenido cuyo valor está en nombres, entidades o escritura curada; `g7.group-tasks` es el ejemplo actual.

`GENERATED` no significa producir números arbitrarios durante una partida. Bajo un contrato versionado de contenido y generador, cada candidato es una función pura de su dirección y del seed fijo del espacio de contenido; sólo una variante aprobada puede entrar al catálogo. Los siete generadores actuales se ejecutan y auditan con tooling offline. El browser materializa una dirección conocida, no improvisa contenido sin validar.

Cambiar el contrato de un generador exige una versión nueva de generador, contenido y catálogo. La versión publicada anterior permanece reconstruible: no se la regenera para adoptar la semántica nueva. El acto del 25 de Mayo, versión `1` en `grade-7-dev-1` y versión `2` desde `grade-7-dev-2`, es el caso vigente; `dev-3` y `dev-4` preservaron las direcciones previas al alinear nuevas identidades de contenido, y el catálogo actual `dev-5` conserva las 159 entradas de `dev-4` y suma 26 de `g7.bus-travel-review` bajo `contentVersion 0.9.0-grade-7`.

La estrategia matemática no obliga a proceduralizar la escena. Una plantilla puede mantener autorados narrativa, personajes, copy y estructura de interacción mientras genera sus parámetros concretos. El acto del 25 de Mayo conserva autoradas la coreografía y sus tres reglas; las grillas numéricas son la parte generada.

## Declarar dónde vive el contenido

Desde [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md) y [ADR-022](../03-architecture/adr/ADR-022-difficulty-model-and-run-composer.md), una plantilla declara, además de su regla de juego:

- **familia de escenario** — la situación reconocible en la que ocurre. Una familia puede alojar varias estructuras de razonamiento y no está atada a un año.
- **rol de colocación** — `anchor` (el beat primario del año), `checkpoint` (una evaluación), `special` (un momento social o excepcional) o `recovery` (contenido condicional). Es semántica de agendado: no dice nada sobre la calidad del resultado ni sobre qué mueve en la carrera.
- **variantes curadas de respaldo** — la lista `variants` de ids que la selección usa cuando el content set no aporta un catálogo aprobado para esa plantilla. Con `ApprovedVariantLookup`, la partida elige sobre las direcciones aprobadas. Reordenar el respaldo cambia qué dirección elige un seed en ese modo y requiere versionado de contenido, pero **el orden no define la identidad semántica**: ésta es la dirección estable `familia/plantilla/variante`.
- **interacción y dominios matemáticos** — metadata que el compositor usa para variedad y cobertura, separada de la familia narrativa.
- **perfil cognitivo** — `steps`, `constraints`, `selection`, `optimization`, `uncertainty` y `construction`. La banda y el costo de scheduling se derivan de estos rasgos y de una policy versionada; el autor no los fuerza con un número mágico.

También declara su **elegibilidad por etapa**, que es permiso y no selección: una plantilla elegible para 7.º no aparece en toda run de 7.º. Si una cadena narrativa corta sólo puede alojar un subconjunto, el content set lo explicita en `hostableTemplates`; esa restricción no se esconde en el compositor.

Un año aporta **uno o dos beats ordinarios**, con exactamente un `anchor`. Un `checkpoint` o un `special` gasta uno de esos dos; no es un beat extra. La recuperación es condicional y queda afuera del presupuesto. Ver [la migración del modelo de contenido](../03-architecture/content-model-migration.md) para el procedimiento completo.

## Autoría de recuperación

El ruteo se declara por **plantilla ordinaria de origen**, no sólo por año. Para cada plantilla, el content set elige una de dos respuestas explícitas: una o más plantillas con rol `recovery` que aíslen un paso relevante, o `none` con una razón editorial. No toda plantilla necesita repaso y usar el de otra situación sólo para completar cobertura es contenido incoherente.

El techo de un repaso por etapa es estructural bajo [ADR-024](../03-architecture/adr/ADR-024-progression-recovery-and-graduation.md); no es una perilla de authoring ni de `RecoveryPolicy`. La policy calibra qué calidades dejan obligación. El [diseño de 1.º](grade-1-template-design.md) propone dos rutas distintas y el [contrato de auditoría](../04-quality/post-grade-1-scalability-audit.md) obliga a fallarlas en la misma etapa: debe comprobar selección, resolución semántica, relevancia matemática, rastro narrativo, pacing, egreso y exclusión de `FairScore` antes de implementar ampliamente 2.º–5.º. Esa auditoría reúne evidencia: no prescribe hoy cómo resolver el caso.

No confundir los cuatro artefactos: `ContentCatalog` registra familias y plantillas disponibles; `ApprovedVariantCatalog` contiene direcciones concretas que pasaron el pipeline bajo una versión; `DemoPlan` enumera lo que muestra una demostración; `RunPlan` fija lo que una run normal efectivamente juega. El `RunComposer` construye ese último artefacto una vez, antes de ejecutar. Aprobar una variante no la agenda, elegibilidad no garantiza selección y un demo no es un run plan con más presupuesto.

## Ficha de autoría

Una plantilla nueva se registra antes de que exista código. La forma de esa ficha —narrativa, dominios matemáticos, apoyos, perfil cognitivo y banda derivada, invariantes, interacción, resultados, efectos de carrera, contribución competitiva, ocultos y estado de revisión docente— está en [challenge-authoring.example.yaml](../07-reference/challenge-authoring.example.yaml).

Es un ejemplo documental: no se importa desde runtime ni reemplaza al [schema de contenido](../07-reference/content-schema.example.json).
