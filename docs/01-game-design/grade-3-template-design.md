# Diseño de Templates de 3.º — Autonomía

- **Etapa académica:** 3.º
- **Función narrativa:** autonomía
- **Estado:** `DESIGN-CANDIDATE-APPROVED` · checkpoint #2, 9 de septiembre de 2026
- **Implementación:** `IMPLEMENTED` en STAGE-08 (2026-09-15) como contenido de
  desarrollo; ver [implementación runtime](#implementación-runtime)

La pregunta del año es **«¿Cómo organizo mis propias decisiones?»**. El jugador
organiza tiempo, recursos, movilidad y compromisos. Es deliberadamente el año más
rico en Estilo hasta este punto del recorrido; ninguna estrategia vital recibe
superioridad moral. Rige la [envolvente](stage-08-product-design-envelope.md).

## Taxonomía reconciliada

El Product Pass del 9 de septiembre normaliza las interacciones a los
[cinco motores reutilizables](challenge-system.md#cinco-motores-reutilizables-de-interacción-v1).
Los nombres específicos de esta ficha son modos/presentaciones, no frameworks
nuevos ni capacidades runtime ya implementadas. Estilo sólo usa evidencia
estratégica significativa para Career/Narrative; no aporta FairScore, Prestige
ni oportunidades competitivas. Aplican la composición y el DoR canónicos.

## Colocación y composición

Anchors: `y3.friend-day`, `y3.course-project-tech` y `y3.route-plan`.
Secundarias: `y3.week-planner` y `y3.transport-pass`.

La preferencia por diversidad cognitiva es **soft**: evitar
`week-planner + route-plan` cuando existe una composición igualmente válida y
más diversa. No es una exclusión dura. `course-project-tech` pertenece al
Proyecto del Curso según las
[políticas de composición](full-career-content-matrix.md#políticas-de-composición).

## `y3.friend-day`

**STANDARD · MEDIUM · anchor.** Organizar una salida del Día del Amigo mediante
disponibilidades, traslados, duraciones, restricciones y una optimización pequeña.
La interacción de diseño es `Timeline / Schedule` (modo disponibilidades).

Math evalúa viabilidad del plan. Equipo evalúa preferencias e inconvenientes
repartidos entre planes Math-valid; Estilo tiene una señal fuerte.

**Invariante `LOCKED`:** deben existir varios planes Math-valid con consecuencias
distintas de Equipo/Estilo. No alcanza encontrar la única franja libre común.

```text
Math = yes · Team = yes · Aura = none · Recovery = none
```

## `y3.course-project-tech`

**STANDARD · MEDIUM · anchor.** Organizar recursos compartidos del proyecto
tecnológico: almacenamiento, tasas, fechas límite y dependencias. La dirección de
interacción es `Allocate / Constrain` (modo recursos/dependencias).

**Invariante `LOCKED`:** cada variante utiliza más de un recurso o dependencia;
no puede resolverse como un único cálculo de tasa. El problema trata recursos
compartidos y dependencias del proyecto, no consumo personal de datos como en 1.º.

```text
Math = yes · Team = yes · Aura = none
Recovery = y3.rate-capacity-review
```

La contribución de Equipo debe declarar evidencia propia, separada de la
factibilidad matemática, bajo las reglas comunes de autoría.

## `y3.week-planner`

**STANDARD · MEDIUM · secondary.** Construir una organización de varios días
con capacidad temporal, deadlines y bloques flexibles, mediante `Timeline / Schedule` (modo varios días).
Tiene Math y Estilo fuerte, sin Equipo, Aura ni recuperación.

La escala de varios días y bloques flexibles la distingue del ensayo de una
tarde de 1.º. No es una app de productividad ni moraliza trabajo o descanso.

## `y3.transport-pass`

**CORE · QUICK · secondary.** Comparar costos fijos y variables según la
cantidad de usos; el umbral entre alternativas debe cambiar la decisión.
La interacción es `Choice / Compare` (modo umbral entre alternativas).

**Invariante `LOCKED`:** el umbral de cantidad de usos es estructuralmente
necesario. Comparar dos descuentos como en 7.º no cumple el diseño.

```text
Math = yes · Team = none · Aura = none
Recovery = y3.fixed-variable-review
```

Estilo sólo puede aparecer si varias elecciones siguen siendo racionales bajo
incertidumbre explícita; elegir la alternativa matemáticamente viable por sí
solo no define Estilo.

## `y3.route-plan`

**STRETCH · DEEP · anchor.** Construir un recorrido sobre mapa/red con **3–4
puntos relevantes**, razonando sobre distancia, tiempo y orden de visita.
Interacción de diseño: `Spatial / Graph Canvas` (modo recorrido en red).

**Invariante `LOCKED`:** cambiar el orden del recorrido modifica materialmente
la viabilidad o eficiencia. Es Math-only y no tiene recuperación.

## Evento raro y continuidad

`rare.y3.offline-project` es un modificador condicional y seeded del proyecto
tecnológico, neutral en oportunidades: no agrega beat, FairScore ni Prestige.
El contexto puede cambiar sin ampliar el techo competitivo. Su contrato está en
[eventos raros](rare-events-and-prestige.md#diseños-raros-aprobados-por-año).

La historia del Proyecto del Curso puede reaparecer aunque no se hayan jugado
sus Templates anteriores. Rige
[Callback Independence](narrative-system.md#callback-independence).

## Estado editorial

Equipo aparece sólo en `friend-day` y `course-project-tech`. No hay oportunidad
ordinaria de Aura en 3.º. Las rutas aprobadas de diseño son
`course-project-tech → rate-capacity-review` y
`transport-pass → fixed-variable-review`; las otras tres Templates declaran
`none`.

La [matriz](full-career-content-matrix.md) reúne la cobertura. Los parámetros,
evaluadores, feedback y variantes ya existen —ver abajo— y siguen en estado
`draft`: la revisión del Departamento de Matemática y el pacing empírico son
gates de producción. Aplican los
[requisitos editoriales de Phase 0](content-authoring-guide.md#diseño-aprobado-en-phase-0).

## Implementación runtime

Fuente: `src/content/grade-3/`. Mismas reglas que 2.º: generación por
restricción, gates de autoría en el pipeline, oráculo independiente por
evaluador y materialización sólo de direcciones aprobadas.

| Template | Formas semánticas | Escalera 100/75/40/10 | Equipo / Estilo |
|---|---|---|---|
| `y3.transport-pass` | Cuatro formas de pagar el mismo colectivo —boleto, tarjeta con costo único, combo con viajes incluidos y abono libre— contra seis formas de mes, de `pocos-viajes` a `mes-cargado`, con los viajes del mes pasado como estimación y un rango de cuánto puede cambiar este mes. Los precios son de la ciudad y del mes: ninguno se calcula con el rango. Cada dirección tiene el papel de una forma de pagar óptima, así que las cuatro son óptimas en el catálogo y ninguna en más del 40 %; en `likely` la más barata le saca a la segunda al menos $100 y el 2 % | INVALID nunca gana y encima es la más cara para los viajes esperados · FUNCTIONAL nunca gana pero tampoco es la peor · EFFICIENT gana en otra cantidad posible del mes, y el feedback dice a partir de cuántos viajes · OPTIMAL gana para los viajes esperados | Ninguno (D-S08-065). Ruta de Repaso a `y3.fixed-variable-review` |
| `y3.course-project-tech` | Tres recursos compartidos —notebook prestada, lugar en el pendrive y rato de laboratorio a una tasa— y tres cosas que producir con consumos distintos; formas `pendrive-corto`, `laboratorio-corto` y `notebook-corta` | INVALID se pasa de un recurso o no llega al mínimo de la feria · FUNCTIONAL mínimos · EFFICIENT dos de lo prometido · OPTIMAL lo prometido entero | **Equipo** 0–3 por los acuerdos del grupo, leído por dueño sobre el mismo plan (`LOCKED`). Ruta de Repaso a `y3.rate-capacity-review` |
| `y3.friend-day` | Cuatro personas con ventanas propias, dos lugares con viaje en el medio, dos bloques obligatorios y dos opcionales; formas `ventana-corta`, `traslado-largo` y `gustos-cruzados` | INVALID se pisa, no da el viaje o falta quien tiene que estar · FUNCTIONAL obligatorios · EFFICIENT un opcional · OPTIMAL los dos | **Equipo** 0–3: que nadie quede afuera, que lo que cada uno quería pase mientras está y que nadie espere de más (`LOCKED`). Estilo por la forma de la tarde |
| `y3.week-planner` | Cuatro días de tarde libre, dos compromisos que ya tienen día y hora, dos pendientes con vencimiento y dos opcionales; formas `semana-cargada`, `vencimiento-temprano` y `tarde-ocupada` | INVALID falta, se pisa, se sale de la tarde o vence · FUNCTIONAL obligatorios · EFFICIENT un opcional · OPTIMAL los dos | Sin Equipo ni Aura. **Estilo fuerte**: pegado al vencimiento → Improvisador; con un día entero libre → Estratega; repartido con margen → Aplicado |
| `y3.route-plan` | Cinco lugares del barrio en una cuadrícula de cuadras, con horario de apertura, rato adentro y hora de vuelta; formas `cierra-temprano`, `abre-tarde` y `lejos` | INVALID falta un mandado, llega cerrado o vuelve tarde · FUNCTIONAL los obligatorios · EFFICIENT uno opcional · OPTIMAL los dos | Ninguno: es Math sola |
| `y3.rate-capacity-review` | Cuánto entra a un consumo dado, en MB o en minutos | OPTIMAL la parte entera · FUNCTIONAL redondear para arriba · EFFICIENT uno menos · INVALID el resto | Sin Estilo ni score |
| `y3.fixed-variable-review` | A partir de cuántos viajes el abono sale más barato que el boleto | OPTIMAL el primer viaje en que ya conviene · FUNCTIONAL quedarse en la parte entera · EFFICIENT uno más · INVALID el resto | Sin Estilo ni score |

**Contratos nuevos.** 3.º necesitó dos, y ninguno es un framework nuevo
(D-S08-062): `route-builder` contrata el **orden** de las paradas como
respuesta semántica —el mapa dibuja esquinas y no suma ninguna distancia— y la
agenda gana un modo de varios días con minutos absolutos desde el primer día,
así que solapar, ordenar y comparar contra un vencimiento siguen siendo
comparaciones de enteros. Engine `9.0.0`, action log `7`, snapshot `7` intacto.

**Banda y metadata.** `bandOf(cognitive)` da: colectivo 4 → CORE; Día del Amigo,
feria y semana 7 → STANDARD; recorrido 8 → STRETCH; los dos Repasos 2 → CORE.
Eso es 1 CORE / 3 STANDARD / 1 STRETCH, la distribución que pide la matriz.

**Preferencia blanda.** La semana y el recorrido tienen casi el mismo vector de
rasgos, y de ahí sale la preferencia de diversidad cognitiva del año. Se
implementó como objetivo blando del compositor: cuenta las parejas de la etapa
cuyos perfiles difieren en un rasgo o menos y prefiere las que tienen menos
(D-S08-064). Contar en vez de maximizar la distancia importa: maximizarla tiene
un ganador único y dejaba a 3.º con la misma pareja en las 200 seeds medidas,
mientras que contando aparecen cuatro parejas distintas y la que el diseño
quiere evitar no aparece ninguna vez. Sigue siendo blanda: ordena planes válidos
y no filtra ninguno, así que cuando esa pareja es la única legal la carrera se
compone igual.

**Catálogo `grade-3-dev-3`.** 681 entradas, construido con
`pnpm game:variants build --content=grade-3`; re-aprueba 7.º, 1.º y 2.º sin
tocar sus artefactos publicados. Reemplaza a `grade-3-dev-2` por la
[remediación matemática](../04-quality/mathematics-remediation-implementation.md): colectivo generado por papel y los dos Repasos con feedback de dirección
según el signo del error, contenido `3.2.0-grade-3`. La práctica parcial `7.º → 3.º` es
`official: false`.

**Rareza.** `rare.y3.offline-project` sigue siendo hook, por la misma razón que
el de 2.º (D-S08-067).

## Remediación dirigida de ronda 2 · proyecto tecnológico

RS-RA-002 conserva STANDARD/MEDIUM/PROJECT, máximos 10/10/12, Equipo independiente
y `rate-capacity-review`. El generador 2 amplía a doce objetivos; once aparecen
en las 25 variantes publicadas. Ajusta notebook, pendrive y laboratorio por tasa:
23–53 minutos de notebook, 1050–3200 MB y 5–29 minutos. Las formas publicadas
son pendrive corto (9), laboratorio corto (8) y notebook corta (8).

El supremo publicado `(6,7,8)` necesita 55 minutos de notebook y no cabe en
ninguna variante. Cada variante conserva los tres niveles válidos, un óptimo
con Equipo máximo y dos evidencias de Equipo. Los 1573 vectores completos por
variante dan 116 óptimos distintos, K 35,8 y S 20 %, bajo K≤65/S≤35 %.
Contenido `3.3.0-grade-3`, catálogo `grade-3-dev-4`; ver
[informe de implementación](../04-quality/targeted-post-reaudit-mathematics-remediation.md).
