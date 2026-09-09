# Diseño de Templates de 2.º — Pertenencia e identidad

- **Etapa académica:** 2.º
- **Función narrativa:** pertenencia e identidad
- **Estado:** `DESIGN-CANDIDATE-APPROVED` · checkpoint #2, 9 de septiembre de 2026
- **Implementación:** `NOT_STARTED`; aprobación de diseño, no de contenido ejecutable

La pregunta del año es **«¿Qué lugar tengo entre los demás?»**. Grupos,
participación, intercurso y reputación hacen visible la pertenencia. Se conservan
el piso matemático universal y las reglas de la
[envolvente](stage-08-product-design-envelope.md).

## Colocación y continuidad

Anchors: `y2.intercurso-plan`, `y2.course-project-survey` y `y2.court-zones`.
Secundarias: `y2.team-kit-order` y `y2.standings-claim`.

El **cluster Intercurso** reúne `intercurso-plan`, `standings-claim` y
`court-zones`: una run normal admite como máximo **una** Template puntuable de
ese conjunto (`LOCKED`). La encuesta pertenece al arco recurrente Proyecto del
Curso. Los límites y su madurez viven en las
[políticas de composición](full-career-content-matrix.md#políticas-de-composición).

## `y2.intercurso-plan`

**STANDARD · MEDIUM · anchor.** El jugador distribuye personas entre actividades
y franjas horarias, considerando incompatibilidades. La interacción de diseño es
`Timeline + Allocation Board`: el tiempo participa de la asignación.

Math evalúa personas × actividades × franjas × incompatibilidades. Equipo usa
preferencias, exclusiones evitables, concentración de roles no deseados y
oportunidades de participación entre planes matemáticamente válidos.

**Invariante `LOCKED`:** toda variante debe admitir múltiples soluciones
Math-valid con consecuencias distintas de Equipo/Estilo. Se rechaza una variante
que sea la exposición de 1.º con vocabulario deportivo y reparto estático.

```text
Math = yes · Team = yes · Aura = none
Estilo = consecuencias entre planes válidos · Recovery = none
```

## `y2.course-project-survey`

**STANDARD · MEDIUM · anchor.** El curso necesita decidir qué puede afirmar o
publicar a partir de una encuesta. `Data Table + Claim Selection` conecta datos
con afirmaciones defendibles.

Math trabaja porcentajes, encuestados frente a población, elección del
denominador, afirmaciones respaldadas y datos incompletos. El resultado cambia
lo que el curso puede publicar legítimamente; nunca es una hoja de estadística
sin consecuencia.

```text
Math = yes · Team = none · Aura = none · Estilo = none
Recovery = y2.data-claim-review
```

## `y2.team-kit-order`

**CORE · QUICK · secondary.** Construir un pedido/asignación proporcional que
respete el total, la reserva y mínimos por categoría. La dirección de interacción
es `Constraint Builder`; cantidades, stock y redondeo deben servir a esas
restricciones.

Es Math-only y declara `Recovery = none`. No centra la escena en cuerpos o peso,
no pregunta un porcentaje aislado y no repite el problema de packs, mínimo y
presupuesto de 7.º.

## `y2.standings-claim`

**STANDARD · QUICK · secondary.** Ante puntos y un espacio pequeño de resultados
pendientes, distinguir qué está garantizado, qué es posible y qué es imposible.
La comparación/selección matemática precede a una decisión de comunicación
pública separada.

**Invariante `LOCKED`:** `Math action != Aura action`. Resolver bien la tabla no
otorga Aura automáticamente; ésta evalúa la acción pública independiente.

```text
Math = yes · Team = none · Aura = yes · Recovery = none
```

## `y2.court-zones`

**STRETCH · DEEP · anchor.** Definir regiones y zonas usando límites, distancias,
área y márgenes. La interacción espacial debe hacer necesarias esas relaciones.

Es Math-only y declara `Recovery = none`. La diversidad geométrica exige
**zonas/distancias**, frente al **encastre/escala** de `y1.classroom-layout`;
acomodar objetos en otro salón no cumple la intención.

## Evento raro y callbacks

`rare.y2.missing-player` es un modificador condicional, seeded y neutral en
oportunidades de `intercurso-plan`. No agrega beat, FairScore ni Prestige; su
aparición nunca concede un premio automático. Ver
[eventos raros](rare-events-and-prestige.md#diseños-raros-aprobados-por-año).

**Callback Independence — `LOCKED`:** la historia puede enriquecer texto,
contexto y opciones limitadas, pero nunca es requisito para comprender o resolver
la situación. Tampoco cambia el máximo de FairScore por existir historia previa.

## Estado editorial

Equipo aparece sólo en `intercurso-plan`; Aura sólo en `standings-claim`. La
única ruta de recuperación es `course-project-survey → data-claim-review`.
Todas las demás declaran `none` como diseño aprobado, sin inventar repasos por
cuota. La [matriz](full-career-content-matrix.md) reúne placement y cobertura.

Estas fichas conservan los invariantes aprobados; parámetros exactos,
evaluadores ejecutables, copy de feedback y variantes todavía no están
producidos. Aplican los
[requisitos editoriales de Phase 0](content-authoring-guide.md#diseño-aprobado-en-phase-0)
antes de avanzar hacia contenido revisado o de producción.
