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

Cuando exista modo competitivo, cada evaluador declarará su calidad matemática normalizada y, si corresponde, una contribución acotada de Equipo o de Aura, **aparte** de los efectos de carrera visibles. Ver [score competitivo y ranking](competitive-scoring-and-ranking.md).

### Ocultos: dominio y flags

¿Qué dominios matemáticos ejercita? ¿Qué flag narrativo escribe? Ninguno de los dos se renderiza.

## Invariantes antes que generador

Los invariantes de una variante se escriben **antes** que el código que la genera: al menos una solución válida, sin óptimo ambiguo salvo diseño explícito, aritmética legible, contexto escolar plausible, sin opciones duplicadas, posición de la opción correcta no fija y banda de dificultad declarada.

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

`GENERATED` no significa producir números arbitrarios durante una partida. Bajo un contrato versionado de contenido y generador, cada candidato es una función pura de su dirección y del seed fijo del espacio de contenido; sólo una variante aprobada puede entrar al catálogo. Los seis generadores actuales se ejecutan y auditan con tooling offline. El browser materializa una dirección conocida, no improvisa contenido sin validar.

Cambiar el contrato de un generador exige una versión nueva de generador, contenido y catálogo. La versión publicada anterior permanece reconstruible: no se la regenera para adoptar la semántica nueva. El acto del 25 de Mayo, versión `1` en `grade-7-dev-1` y versión `2` en `grade-7-dev-2`, es el caso vigente.

La estrategia matemática no obliga a proceduralizar la escena. Una plantilla puede mantener autorados narrativa, personajes, copy y estructura de interacción mientras genera sus parámetros concretos. El acto del 25 de Mayo conserva autoradas la coreografía y sus tres reglas; las grillas numéricas son la parte generada.

## Declarar dónde vive el contenido

Desde [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md), una plantilla declara tres cosas además de su regla de juego:

- **familia de escenario** — la situación reconocible en la que ocurre. Una familia puede alojar varias estructuras de razonamiento y no está atada a un año.
- **rol de colocación** — `anchor` (el beat primario del año), `checkpoint` (una evaluación), `special` (un momento social o excepcional) o `recovery` (contenido condicional). Es semántica de agendado: no dice nada sobre la calidad del resultado ni sobre qué mueve en la carrera.
- **variantes curadas de respaldo** — la lista `variants` de ids que la selección usa cuando el content set no aporta un catálogo aprobado para esa plantilla. Con `ApprovedVariantLookup`, la partida elige sobre las direcciones aprobadas. Reordenar el respaldo cambia qué dirección elige un seed en ese modo y requiere versionado de contenido, pero **el orden no define la identidad semántica**: ésta es la dirección estable `familia/plantilla/variante`.

Y declara su **elegibilidad por etapa**, que es permiso y no selección: una plantilla elegible para 7.º no aparece en toda run de 7.º.

Un año aporta **uno o dos beats ordinarios**, con exactamente un `anchor`. Un `checkpoint` o un `special` gasta uno de esos dos; no es un beat extra. La recuperación es condicional y queda afuera del presupuesto. Ver [la migración del modelo de contenido](../03-architecture/content-model-migration.md) para el procedimiento completo.

No confundir los cuatro artefactos: `ContentCatalog` registra familias y plantillas disponibles; `ApprovedVariantCatalog` contiene direcciones concretas que pasaron el pipeline bajo una versión; `DemoPlan` enumera lo que muestra una demostración; `RunPlan` referencia lo que una run normal efectivamente juega. Aprobar una variante no la agenda, y un demo no es un run plan con más presupuesto.

## Ficha de autoría

Una plantilla nueva se registra antes de que exista código. La forma de esa ficha —narrativa, dominios matemáticos, apoyos, banda, invariantes, interacción, resultados, efectos de carrera, contribución competitiva, ocultos y estado de revisión docente— está en [challenge-authoring.example.yaml](../07-reference/challenge-authoring.example.yaml).

Es un ejemplo documental: no se importa desde runtime ni reemplaza al [schema de contenido](../07-reference/content-schema.example.json).
