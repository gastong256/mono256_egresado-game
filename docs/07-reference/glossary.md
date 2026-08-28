# Glosario

**Action:** input lógico registrado durante una run.

**Challenge:** unidad de gameplay matemático.

**Challenge instance:** desafío concreto generado desde template + parámetros.

**Content version:** versión del conjunto de contenido.

**Event / Game Event:** contexto competitivo/temporal como una feria.

**Functional solution:** resuelve las restricciones mínimas.

**Game engine / core:** lógica determinista independiente de UI.

**Game state:** estado actual reproducible de una run.

**Interaction type:** patrón UI reutilizable para responder un challenge.

**Optimal solution:** mejor solución bajo función objetivo declarada.

**Player:** identidad pseudónima usada para asociar runs.

**Profile:** título narrativo final derivado de comportamiento.

**Replay:** reconstrucción de run aplicando acciones sobre seed/versiones.

**Ruleset version:** versión de reglas que afecta generación/evaluación/scoring.

**Run:** una carrera completa o intento.

**Seed:** valor que inicializa aleatoriedad determinista.

**Storylet:** fragmento narrativo elegible según estado/condiciones.

## Vocabulario de carrera y competencia

**Promedio:** media de las notas reales de la run, `1,0–10,0` con un decimal. `null` mientras no haya nota. No es un acumulador de aciertos.

**Equipo:** conducta hacia el grupo, `0–100`. No es moral ni barra de vida.

**Aura:** capital narrativo con signo y sin techo. La mueve lo memorable, no lo correcto.

**Estilo:** perfil ternario Aplicado · Estratega · Improvisador, que siempre suma 100. Ningún eje es el malo.

**Dominio matemático / mastery:** estado latente por categoría matemática. Sistema oculto: alimenta dificultad y analítica, **nunca se renderiza**.

**Scenario Family:** dominio narrativo reconocible —Colectivo, Mural, Stand—. No confundir con las «familias de interacción» del [sistema de desafíos](../01-game-design/challenge-system.md), que son patrones de UI.

**Template / ChallengeTemplate:** estructura de razonamiento distinta dentro de una misma familia de escenario. En el código es una `ChallengeDefinition`, identificada por un `ChallengeId`: son la misma cosa con el nombre que tenía antes del modelo de contenido.

**Variant:** parametrización concreta y determinista de una plantilla.

**Deployed variant / variante aprobada:** variante que pasó validación y entró a un catálogo versionado. **No confundir con el catálogo de contenido**, que dice qué familias y plantillas existen. Ver [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md).

**Approved variant catalog:** conjunto versionado de variantes aprobadas, con su dirección y su huella. Implementado como `ApprovedVariantCatalog`; desde [ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md) es de donde la partida saca su contenido. Una versión publicada es **inmutable**: cuando el contenido cambia se construye la siguiente. El catálogo oficial de la feria todavía no se congeló.

**Demo plan / Teacher Demo Candidate:** lo que se muestra a un docente, y **no** una partida. Implementado como `DemoPlan`, con validación propia que exige cobertura, un propósito escrito por beat y —para que no puedan confundirse— **más** beats ordinarios de los que un plan de run admite. Ver [ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md).

**Fuente de variantes:** de dónde salen las variantes de una plantilla — **autorada** (una lista curada) o **generada** (un espacio de candidatos direccionado por índice). Autorada no quiere decir sin validar.

**Candidato:** una dirección del espacio generado, `c00042`. Un candidato es una propuesta: generarlo no lo aprueba.

**Huella de variante / fingerprint:** `sha256` del contenido semántico canónico de una variante. Identidad de **contenido**, para deduplicar; distinta de la dirección, que es identidad **referencial**.

**Generación por restricción:** construir parámetros que ya cumplen la intención de la plantilla, en lugar de sortear campos y comprobar después. Incluye la generación inversa: elegir primero la respuesta buscada y derivar los datos que la producen.

**Oráculo independiente:** método de verificación que no comparte razonamiento con el generador, para que un error no se confirme a sí mismo.

**Content catalog:** todo el contenido autorado y disponible de un content set — familias y plantillas. Responde *qué existe y dónde puede aparecer*. Implementado como `ContentCatalog`.

**Run plan:** el contenido efectivamente elegido para una partida. Responde *qué juega esta run*. Implementado como `RunPlan`; **quién lo construye** es trabajo de STAGE-05.

**Rol de colocación:** `anchor`, `checkpoint`, `special` o `recovery`. Semántica de agendado, nunca de calidad ni de efecto de carrera. Ver [ADR-019](../03-architecture/adr/ADR-019-scenario-family-template-variant.md).

**Beat ordinario:** un beat que gasta presupuesto del año. Son `anchor`, `checkpoint` y `special`; la recuperación es condicional y queda afuera.

**Presupuesto de beats por etapa:** uno o dos beats ordinarios por año, con exactamente un `anchor`. Existe porque una run cruza seis años y tiene que poder volver a jugarse.

**Dirección de variante:** `familia/plantilla/variante`. Tres identificadores semánticos estables; ni índice de array ni posición en el catálogo.

**Difficulty budget:** masa de dificultad esperada asignada a una run para que distintas runs sigan siendo comparables.

**Banda de dificultad:** `CORE`, `STANDARD` o `STRETCH`, metadata de autoría y competencia. Corresponde aproximadamente a `DifficultyLevel` 1–2 / 3 / 4–5 del motor.

**MathPerformance:** medida normalizada de desempeño matemático orientada a competencia. No es una stat visible de carrera.

**FairScore:** score compuesto oficial usado para el ranking. Objetivo, no implementado, y sus coeficientes están abiertos.

**Personal best:** mejor run verificada de un participante en un evento. Es lo que el ranking compara, en vez de la suma de intentos.

**Run descriptor:** identidad y configuración inmutables de una run oficial: versiones, seed, variantes asignadas y metadata del evento.

**Fail forward:** el error cambia las consecuencias y el contenido siguiente en vez de terminar la partida.

**Golden seed:** seed conocida que se conserva para tests deterministas de regresión.

**Teacher Gate:** revisión formal del Departamento de Matemática que cierra decisiones de contenido, dificultad y competencia. Ver [gates docentes](../06-delivery/teacher-gates.md).

## Correspondencia de calidades de resolución

El motor y el blueprint nombran distinto la misma escala de cuatro escalones.

| Motor (`SolutionQuality`) | Blueprint | Significado |
|---|---|---|
| `optimal` | optimal / óptimo | mejor solución bajo la función objetivo declarada |
| `efficient` | resolved / resuelto | válida y con buen uso de recursos, sin ser la mejor |
| `functional` | partial / parcial | cumple lo mínimo o avanza sin completar |
| `invalid` | insufficient / insuficiente | rompe una restricción esencial; la run continúa igual |

Manda el vocabulario del motor. La escala del blueprint aparece en documentos de score competitivo y se lee contra esta tabla.
