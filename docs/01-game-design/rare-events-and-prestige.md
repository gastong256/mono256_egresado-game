# Eventos raros y Prestige

- **Producto v1:** cerrado por el Product Pass del 9 de septiembre de 2026.
- **Arquitectura futura:** aceptada en [ADR-025](../03-architecture/adr/ADR-025-full-career-contract-evolution.md); **NOT IMPLEMENTED**.
- **Calibración de rareza:** defaults v1 versionables, no constantes inmutables.
- **Oficialización:** pendiente de contenido validado, STAGE-09/TG2 y freeze.

Los eventos raros deben volver memorables y diferentes las carreras sin convertir
el ranking en una lotería. Prestige puede reconocer trayectorias y acciones
independientes como segundo criterio competitivo; nunca compensa un `FairScore`
menor. Este documento fija semántica de producto, no autoriza ni describe un
runtime existente.

## RNG determinista — regla de producto `LOCKED`

Una selección pseudoaleatoria sólo es válida si es explícita, seeded, reproducible
y verificable por replay/servidor:

```text
misma seed + versiones/políticas + contexto determinista pertinente
= misma selección rara
Fair v1: misma edición → misma presencia rara, también en reintentos
```

No entra `Math.random()`, reloj implícito ni otra entropía ambiente en el core. La
dirección aceptada es un substream semántico propio —junto a composición,
variantes, narrativa y recuperación— para que cambios ajenos no desplacen el
resultado. Su arquitectura concreta deberá seguir las convenciones del motor y
está delimitada por ADR-025. El runId distinto de cada intento no altera la
selección; tampoco los índices desplazados por Repasos.

## Clases y selección

- **COMMON:** contenido ordinario del catálogo/run.
- **CONDITIONAL:** aparece sólo si Carrera, historial y flags satisfacen su elegibilidad.
- **RARE:** requiere elegibilidad y luego selección RNG determinista.

### Defaults de Practice v1

**RECOMENDADA como calibración v1 aceptada**, configurable/versionada; no freeze
competitivo ni propiedad inmutable del motor. Supersede porcentajes/topes abiertos:

| Banda | Probabilidad por draw elegible |
|---|---|
| UNCOMMON | 15 % |
| RARE | 7,5 % |
| VERY_RARE | 2 % |

Presupuesto de carrera: **máximo 2 eventos raros**, **máximo 1 modificador/reemplazo
puntuable** y **máximo 1 VERY_RARE**. Se evalúa elegibilidad antes del draw y se
aplica el presupuesto con orden canónico; los porcentajes no prometen frecuencia
marginal observada después de esos filtros. Overrides requieren justificación y
política versionada, no números dispersos entre Templates.

En Practice puede variar el contexto elegible por historia. En **Fair v1** la
Competition Seed de la edición fija presencia y oportunidades para todos; no se
resortea en reintentos ni se limita acceso por Estilo, Math o posición previa.
El desempeño determina si se logra la acción independiente, no si apareció la
oportunidad competitiva. Ver [modo feria](../05-operations/fair-mode-and-competition-freeze.md).

## Tratamientos

### `NARRATIVE_ONLY`

Cambia storylet, callback, badge o display de rareza. Impacto por defecto:
`FairScore = 0`, `Prestige = 0`.

### `PRESTIGE_REPLACEMENT`

Reemplaza una oportunidad ordinaria/condicional de Prestige con el mismo máximo.
El RNG cambia la historia, no el techo competitivo.

### `SPECIAL_MILESTONE`

Puede habilitar Prestige si el jugador realiza una acción especial con evidencia
independiente, dentro del presupuesto global/de track. Debe usarse poco.

### Modificador o reemplazo de gameplay neutral

El diseño de 2.º y 3.º incluye modificadores de una Template existente;
`y4.represent-class` es un reemplazo raro puntuable y 5.º admite modificador o
narrativa. Ninguno agrega un beat puntuable ni techo adicional de FairScore o
Prestige. La frontera futura sigue ADR-025; su implementación falta. Los
nombres de tratamiento son diseño de producto, no enums runtime nuevos.

## Guardrails competitivos — `LOCKED`

El RNG nunca puede:

1. decidir si el jugador egresa;
2. cambiar qué es matemáticamente correcto;
3. crear una oportunidad máxima adicional de `FairScore`;
4. decidir directamente quién gana el ranking;
5. superar el techo estructural de recuperación;
6. otorgar Prestige porque el evento apareció;
7. dar a una run un techo de Prestige mayor que a otra comparable.

## FairScore y Prestige

`FairScore ∈ [0, 10.000]` sigue primario; Prestige es secundario, máximo **100**.
El comparador canónico vive en [score competitivo y ranking](competitive-scoring-and-ranking.md#desempate):
no suma ambos scores ni usa velocidad. Comparador, persistencia y Prestige todavía
no existen en runtime.

## Presupuesto Prestige v1 — `LOCKED`

**Supersesión explícita:** el candidato 25×4, incluido STYLE competitivo, queda
retirado. Estilo sólo pertenece a Career/Narrative y badges de display.

| Track | Máximo | Oportunidades autoradas |
|---|---|---|
| CAREER ARC | 40 | hasta dos logros multianuales de 20 |
| SPECIAL ACHIEVEMENTS | 40 | cuatro slots opcionales de 10 |
| RARE EVENTS | 20 | como máximo un logro independiente de 20 |
| Total | 100 | no es parte de la suma de FairScore |

Career Arc puede reconocer una promesa narrativa no puntuable cumplida después
o un objetivo recurrente independiente; Special usa objetivos opcionales que no
sean puntos Math/Team/Aura disfrazados. Rare exige acción/payoff independiente:
aparición sola = 0. Los nombres y condiciones exactos se autoran con contenido,
no son un bloqueo de prediseño ni permiso para cambiar los tracks.

Toda oportunidad declara fuente de evidencia, identidad, slot y deduplicación.
La configuración de edición fija los mismos slots/techos para todos. Un reemplazo
raro no agrega un slot: conserva una oportunidad equivalente. Si una oportunidad
no existe en esa edición, no se inventan puntos ni una normalización ad hoc para
completar 100; el techo ofrecido debe quedar explícito y ser común a todos.
El máximo estructural es 100, no un premio automático ni promesa de 100 alcanzables
sin autorar sus oportunidades.

## No doble conteo — `LOCKED`

Toda oportunidad debe preguntar si Matemática, Equipo o Aura ya usan la misma
evidencia. Si la respuesta es sí, puede existir como badge display-only pero
`PrestigeEligible = false`.

- “Matemática perfecta” no puede sumar Prestige: ya domina `FairScore`.
- Una identidad o trayectoria de Estilo nunca da Prestige competitivo, ni habilita una oportunidad competitiva exclusiva.
- Math perfecto, Equipo/Aura altos, necesitar/completar Repaso, acumular/cerrar previas, aparición rara y completar el juego sólo pueden dar badges de display.
- Un comeback narrativo sólo es elegible por hechos adicionales independientes; jamás por fallar o recuperar.

La misma regla separa Math, Team, Aura y Prestige en cada Template.

En `y4.represent-class` la separación es triple: propuesta matemática viable,
acción pública de Aura y logro independiente del historial para eventual
Prestige. Ni aparecer ni resolver/comunicar correctamente generan Prestige por
sí mismos. Si una evidencia ya pagó Math, Equipo o Aura, su Prestige competitivo
es **0**. `y5.course-project-final` tampoco paga Prestige directo por esas tres
señales; sólo puede aportar evidencia independiente a un futuro Hito de Career Arc.

## RNG y normalización — `LOCKED DIRECTION`

La forma válida es:

```text
RNG → aparece/reemplaza oportunidad → acción o trayectoria independiente → Prestige
```

Nunca `RNG → Prestige`. Una oportunidad rara reemplaza normalmente otra estándar
con igual techo. Así dos runs pueden contar historias distintas y seguir teniendo
la misma oportunidad competitiva máxima, lo que reduce azar y seed farming bajo
intentos ilimitados.

## Rareza visible

La rareza puede mostrarse por separado del valor competitivo, por ejemplo “MUY
RARO · 3,2 % de carreras”, sólo cuando telemetría real lo respalde. Un evento más
raro no vale automáticamente más Prestige.

## Empates e intentos

El puesto compartido después de FairScore y Prestige es obligatorio en v1; no
queda un tercer criterio oculto. Intentos ilimitados y mejor resultado verificado
se juegan sobre la misma Competition Seed. La política de premios externos y el
freeze se mantienen en [operaciones](../05-operations/fair-mode-and-competition-freeze.md).

## Diseños raros aprobados por año

| Año | Evento | Tratamiento aprobado de diseño |
|---|---|---|
| 1.º | `rare.y1.power-outage` | `UNCOMMON / CONDITIONAL / NARRATIVE_ONLY / Prestige 0`; conserva el contrato inicial antes de la expo, sin challenge puntuable adicional. |
| 2.º | `rare.y2.missing-player` | RARE; modificador condicional + seeded de `intercurso-plan`, neutral en oportunidades; sin beat, FairScore ni Prestige extra. |
| 3.º | `rare.y3.offline-project` | RARE; modificador condicional + seeded del proyecto tecnológico, neutral en oportunidades; sin beat, FairScore ni Prestige extra. |
| 4.º | `y4.represent-class` | VERY_RARE; reemplazo condicional + seeded, neutral en oportunidades, STANDARD/MEDIUM; Aura sí, Equipo no, recovery `none`; aparición Prestige 0. |
| 5.º | `rare.y5.five-minutes-before-act` | RARE; condicional + seeded, modificador neutral o `NARRATIVE_ONLY`; sin beat, FairScore ni recovery extra; aparición Prestige 0; sólo crisis escolares de baja gravedad. |

La clasificación por evento es calibración recomendada de v1. En Fair se fija
antes de jugar y no ofrece la oportunidad sólo a quienes ya vienen ganando.
`represent-class` separa propuesta Math, comunicación Aura y logro de Prestige;
ninguna señal se duplica. Modificadores deben materializar una variante aprobada
identificable y preservar corrección, recovery y cantidad de beats.

El pase detallado Rare Events / Milestones / Prestige está completo a nivel de
producto; no hace falta repetirlo. No hay todavía implementación ni catálogo de
logros competitivo aprobado.

## Trabajo diferido, no bloqueos de Phase 0

- Autoría de nombres, hechos, condiciones y variantes de logros concretos.
- Implementación de selección, slots, agregación y replay bajo ADR-025.
- Ajustes de calibración por simulación/telemetría, sin convertirlos en constantes.
- Persistencia, emisión, moderación y premios operativos en STAGE-09.

Las aperturas residuales están indexadas en [preguntas abiertas](../07-reference/open-questions.md).
El cap/tracks, la exclusión de Style, el puesto compartido y la Competition Seed
no siguen abiertos.
