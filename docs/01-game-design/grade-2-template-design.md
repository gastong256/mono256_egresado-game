# Diseño de Templates de 2.º — Pertenencia e identidad

- **Etapa académica:** 2.º
- **Función narrativa:** pertenencia e identidad
- **Estado:** `DESIGN-CANDIDATE-APPROVED` · checkpoint #2, 9 de septiembre de 2026
- **Implementación:** `IMPLEMENTED` en STAGE-08 (2026-09-15) como contenido de
  desarrollo; ver [implementación runtime](#implementación-runtime)

La pregunta del año es **«¿Qué lugar tengo entre los demás?»**. Grupos,
participación, intercurso y reputación hacen visible la pertenencia. Se conservan
el piso matemático universal y las reglas de la
[envolvente](stage-08-product-design-envelope.md).

## Taxonomía reconciliada

El Product Pass del 9 de septiembre normaliza las interacciones a los
[cinco motores reutilizables](challenge-system.md#cinco-motores-reutilizables-de-interacción-v1).
Los nombres específicos de esta ficha son modos/presentaciones, no frameworks
nuevos ni capacidades runtime ya implementadas. Estilo sólo usa evidencia
estratégica significativa para Career/Narrative; no aporta FairScore, Prestige
ni oportunidades competitivas. Aplican la composición y el DoR canónicos.

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
`Allocate / Constrain` (modo asignación, combinado con Timeline / Schedule): el tiempo participa de la asignación.

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
publicar a partir de una encuesta. `Choice / Compare` (modo datos/afirmaciones) conecta datos
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
es `Allocate / Constrain` (modo pedido); cantidades, stock y redondeo deben servir a esas
restricciones.

Es Math-only y declara `Recovery = none`. No centra la escena en cuerpos o peso,
no pregunta un porcentaje aislado y no repite el problema de packs, mínimo y
presupuesto de 7.º.

## `y2.standings-claim`

**STANDARD · QUICK · secondary.** Ante puntos y un espacio pequeño de resultados
pendientes, distinguir qué está garantizado, qué es posible y qué es imposible.
`Choice / Compare` separa la selección matemática de una decisión de comunicación
pública separada.

**Invariante `LOCKED`:** `Math action != Aura action`. Resolver bien la tabla no
otorga Aura automáticamente; ésta evalúa la acción pública independiente.

```text
Math = yes · Team = none · Aura = yes · Recovery = none
```

## `y2.court-zones`

**STRETCH · DEEP · anchor.** Definir regiones y zonas usando límites, distancias,
área y márgenes. `Spatial / Graph Canvas` (modo zonas/distancias) debe hacer necesarias esas relaciones.

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

Estas fichas conservan los invariantes aprobados. Los parámetros, evaluadores,
copy de feedback y variantes ya existen —ver abajo— y siguen en estado `draft`:
la revisión del Departamento de Matemática y el pacing empírico son gates de
producción, no de esta implementación. Aplican los
[requisitos editoriales de Phase 0](content-authoring-guide.md#diseño-aprobado-en-phase-0).

## Implementación runtime

Fuente: `src/content/grade-2/`. Cada Template declara su `VariantSourceSpec`
generado por restricción, con los gates de autoría del pipeline decidiendo qué
se aprueba, y cada evaluador tiene un oráculo independiente que los tests
comparan sobre todos los planes. Las mecánicas compartidas se promovieron a
`src/content/authoring.ts` (D-S08-059): 1.º las re-exporta sin cambiar nada.

| Template | Formas semánticas | Escalera 100/75/40/10 | Equipo / Aura / Estilo |
|---|---|---|---|
| `y2.team-kit-order` | `exact-share` (el reparto proporcional da justo), `remainder` (deciden los restos mayores), `stock-capped` (a un equipo se le acaba el color). Tres equipos, tope de unidades y stock por color | INVALID excede stock, tope o deja a alguien sin pechera · FUNCTIONAL reparte parejo · EFFICIENT proporcional con un resto mal puesto · OPTIMAL proporcional por restos mayores | Ninguno |
| `y2.course-project-survey` | Seis afirmaciones sobre la encuesta del nivel —más elegida entre quienes contestaron, más de la mitad de las respuestas, más de la mitad del nivel, «el nivel entero prefiere», le ganó a la segunda según la regla del curso, la menos elegida—. Formas `denominator` (mayoría entre respuestas y no del nivel), `missing-data` (contestó menos de la mitad), `margin` (la diferencia con la segunda no cumple la regla) y `high-response` (contestó al menos el 85 %). **Regla de publicación** en pantalla y como constante única: una opción le ganó a otra sólo si le saca más de 1 de cada 10 respuestas (`diferencia × 10 > respuestas`), sin variantes a una respuesta del borde. **`year-prefers`** por cota de peor caso: cierta sólo si la primera le saca a cada otra más que toda la gente que no contestó, y sólo en `high-response`. Un ciclo de diez papeles reparte forma y vector de verdad: 7 claves en el catálogo, ninguna forma con clave única y el contraste del denominador en el 60 % | INVALID publica algo que los datos no sostienen · FUNCTIONAL retiene dos o más ciertas · EFFICIENT retiene una · OPTIMAL cada afirmación en su lugar. Los cuatro niveles, en toda variante | Ninguno. Ruta de Repaso a `y2.data-claim-review` |
| `y2.standings-claim` | Tabla de cuatro cursos con puntos, partidos pendientes y puntos por victoria; cuatro afirmaciones —dos de «termina primero» y dos de «termina arriba de»— clasificadas como seguro, posible o imposible. Formas `settled`, `open` y `eliminated`. Los pendientes se juegan **entre estos cuatro cursos** y cada partido lo gana uno —la consigna lo dice—: suma par y ningún curso con más pendientes que los otros tres. **Gate de modelo**: la categoría por cotas de cada curso es idéntica a la del torneo conjunto bajo todo fixture y todo resultado. «Arriba» es estricto —empatar no es terminar arriba— y se rechaza toda tabla donde contar el empate como arriba cambiaría una categoría. Ninguna afirmación tiene la misma categoría en más del 70 % del catálogo | INVALID llama seguro a lo que no lo es · FUNCTIONAL dos o más categorías mal · EFFICIENT una · OPTIMAL clasificación exacta | **Aura** por la postura pública, leída de un campo distinto del de las etiquetas: acertar la matemática nunca concede Aura (`LOCKED`) |
| `y2.court-zones` | Zonas, distancias de Chebyshev y bordes de la cancha; formas `separation`, `margin` y `covered` | INVALID postas pisadas o fuera · FUNCTIONAL separación mínima · EFFICIENT una más · OPTIMAL la separación pedida | Ninguno |
| `y2.intercurso-plan` | Tres actividades en dos turnos, cuatro personas con disponibilidad por turno; formas `tight-availability`, `clash` y `spare` | INVALID falta cobertura, choque de turno o alguien que no está · FUNCTIONAL obligaciones cubiertas · EFFICIENT una opcional · OPTIMAL todas | **Equipo** 0–3 por los acuerdos del grupo, leído entre planes que ya cierran (`LOCKED`). Estilo por la forma del reparto |
| `y2.data-claim-review` | Una cifra, quienes contestaron y el nivel, con tres afirmaciones: más de la mitad de quienes contestaron, más de la mitad del nivel y «sabemos qué eligió quien no contestó» (control siempre falso). Vectores de las dos primeras: `TF` en la mitad del catálogo (el contraste del denominador), `TT` y `FF` en un cuarto cada uno; ninguna cifra en la mitad exacta | INVALID publica una falsa · FUNCTIONAL dos ciertas retenidas (sólo en `TT`) · EFFICIENT una · OPTIMAL exacta. `FF` sólo tiene OPTIMAL e INVALID: es un Repaso, no se le exige witness de niveles | Sin Estilo ni score |

**Banda y metadata.** `bandOf(cognitive)` da: pedido de pecheras 4 → CORE;
encuesta, tabla y plan del Intercurso → STANDARD; postas 8 → STRETCH; el Repaso
4 → CORE. El cluster `intercurso` lo declaran las tres Templates del evento, así
que una run normal aporta como máximo una de ellas.

**Catálogo `grade-2-dev-3`.** 508 entradas, construido con
`pnpm game:variants build --content=grade-2`; re-aprueba las de 7.º y 1.º sin
tocar sus artefactos publicados. La práctica parcial `7.º → 2.º` es
`official: false`. Reemplaza a `grade-2-dev-2` por la
[remediación matemática](../04-quality/mathematics-remediation-implementation.md):
encuesta, Repaso del denominador y tabla generados por papel —el gate
`addressGates` comprueba que cada dirección juegue el suyo—, contenido
`2.2.0-grade-2`.

**Incertidumbre, sin probabilidad.** La encuesta y la tabla trabajan con datos y
cotas: lo que la gente que no contestó podría haber elegido, lo que los partidos
que faltan podrían dar. No hay probabilidad cuantificada ni vocabulario
inferencial (MAT-012).

**Rareza.** `rare.y2.missing-player` sigue siendo hook: la orquestación de
rareza se implementa una sola vez en la integración de carrera completa
(D-S08-067), no por año.
