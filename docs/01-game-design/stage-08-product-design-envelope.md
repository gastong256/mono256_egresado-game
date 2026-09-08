# Envolvente de diseño de producto de STAGE-08

- **Etapa:** STAGE-08
- **Fase:** Phase 0 — Full-Career Content Design
- **Estado de la fase:** `IN_PROGRESS`
- **Estado de esta envolvente:** `COMPLETE · ACCEPTED`
- **Implementación masiva:** fuera de alcance

Este documento fija la envolvente de producto para diseñar la carrera desde 1.º
hasta 5.º antes de producirla. La [matriz de carrera](full-career-content-matrix.md)
concreta el inventario candidato; el [sistema narrativo](narrative-system.md),
[eventos raros y Prestige](rare-events-and-prestige.md) y el
[diseño detallado de 1.º](grade-1-template-design.md) desarrollan sus áreas sin
convertirlas en comportamiento ya implementado.

## Propósito y frontera

Phase 0 responde qué experiencia vive el jugador desde la entrada ya establecida
en 7.º hasta el egreso y cómo conviven matemática, decisiones, consecuencias,
continuidad, recuperación, pacing, rejugabilidad y competencia.

Produce diseño, no contenido ejecutable. Incluye:

- arco narrativo y mapa matemático de la carrera;
- cobertura de dificultad, interacciones, Equipo, Aura y recuperación;
- presupuesto de pacing y plan de rejugabilidad;
- modelo de eventos raros y Prestige;
- matriz completa candidata y fichas detalladas por año;
- contrato de auditoría posterior a implementar 1.º;
- auditoría final de diseño de carrera.

No incluye producción masiva de variantes o años, ranking/backend, grandes sets
de assets ni una arquitectura nueva de motor. Phase 0 sigue abierta hasta que los
diseños detallados de 2.º–5.º y la auditoría final de diseño estén completos.

## Arco de carrera — `LOCKED`

7.º y 1.º transcurren en la misma escuela. Por eso 1.º no vuelve a presentar una
llegada a una institución nueva.

| Etapa | Función narrativa |
|---|---|
| 7.º | **Adaptación / entrada:** conocer la escuela, sus códigos, personas y la gramática del juego. |
| 1.º | **Consolidación:** estabilizar vínculos y responsabilidades; descubrir cómo se mueve el jugador dentro de lo ya conocido. |
| 2.º | **Pertenencia / identidad:** grupos, amistad, cooperación, reputación y lugar propio. |
| 3.º | **Autonomía:** tiempo, recursos, proyectos, movilidad, tecnología y organización más autodirigida. |
| 4.º | **Responsabilidad:** liderazgo, coordinación y consecuencias públicas que afectan a más personas. |
| 5.º | **Cierre / futuro:** proyecto y eventos finales, callbacks, egreso y síntesis del recorrido. |

```text
ADAPTACIÓN → CONSOLIDACIÓN → PERTENENCIA / IDENTIDAD
           → AUTONOMÍA → RESPONSABILIDAD → CIERRE / FUTURO
```

## Accesibilidad matemática — `LOCKED`

```text
AcademicStage != DifficultyBand
```

Toda la carrera conserva un piso de prerrequisitos accesible desde
aproximadamente 7.º. Los años posteriores maduran el contexto, la responsabilidad,
la ambigüedad y las consecuencias; no exigen currículo avanzado como puerta de
entrada.

La caja de herramientas principal incluye aritmética, fracciones, porcentajes,
proporcionalidad, tiempo y tasas simples, costos, estimación, medición, área,
perímetro, escala, tablas y gráficos, estadística descriptiva, probabilidad
intuitiva, clasificación, planificación, asignación, optimización, restricciones y
espacios combinatorios pequeños. Incógnitas simples, relaciones lineales,
coordenadas y escala sólo entran cuando pueden descubrirse sin formalismo.

No son prerrequisitos obligatorios el manejo polinómico avanzado, sistemas
complejos, trigonometría, funciones formales avanzadas, logaritmos ni cálculo. Se
evalúa la decisión o construcción, no una técnica escolar única. Sigue vigente la
regla de autoría: si se quitan los números y la decisión no cambia, la matemática
es decorativa.

## Dificultad e inventario — `ACCEPTED TARGET`

Las bandas siguen siendo `CORE / STANDARD / STRETCH`, con objetivo de catálogo
aproximado `25 / 50 / 25`, no una cuota rígida. La matriz auditada actual alcanza
`6 / 13 / 6`, es decir `24 % / 52 % / 24 %`, y distribuye las tres bandas a lo
largo de los años.

La dirección de inventario es `4–6` Templates por año y aproximadamente 25 entre
1.º–5.º. El 25 no es un contrato: calidad, diversidad semántica y cobertura
prevalecen. Una Template cambia el razonamiento; cambiar sólo números produce una
Variant.

## Interacciones — `ACCEPTED`

La carrera reutiliza familias de interacción y no puede convertirse en una
secuencia de texto con A/B/C. Además de elección, input numérico, clasificación,
ordenamiento, comparación y optimización, Phase 0 prioriza cinco familias:

1. **Allocation Board:** distribuir tareas, recursos o personas.
2. **Timeline / Schedule:** ordenar compromisos y ventanas temporales.
3. **Grid / Spatial Selection:** clasificar o seleccionar celdas, zonas o posiciones.
4. **Constraint Builder:** construir una solución acotada bajo restricciones.
5. **Geometry / Spatial Manipulation:** trabajar con planos, escala, áreas, trayectos y encastre sin canvas libre.

Arrastrar nunca es la única vía: teclado, botones o selección deben ofrecer una
alternativa equivalente. Una mecánica realmente nueva requiere una decisión
separada; no se esconde dentro de data.

## Evidencia secundaria — `LOCKED`

**Equipo** mide una decisión explícita de coordinación, reparto, cooperación,
participación o impacto grupal. Que el contexto tenga un grupo no alcanza. Es
válido separar factibilidad matemática de distribución social de la carga si usan
evidencia independiente.

**Aura** mide una consecuencia pública, reputacional o social distinta de la
corrección matemática. No representa moralidad ni corrección genérica y debe ser
menos frecuente que Equipo. Es válido que un año —incluido 1.º— no tenga una
oportunidad competitiva ordinaria de Aura.

**Estilo** conserva `Aplicado / Estratega / Improvisador`: ningún eje es mejor.
Phase 0 aumenta su utilidad narrativa mediante copy, callbacks, storylets,
epílogo y Hitos con evidencia independiente. Estilo no es parte de `FairScore`.

Matemática, Equipo, Aura y Prestige nunca cobran dos veces el mismo hecho.

## Decisiones con más de una salida válida — `LOCKED`

Parte del catálogo debe admitir varias soluciones matemáticamente válidas con
consecuencias diferentes: más segura pero costosa, más ajustada, mejor distribuida
o más flexible. La evaluación distingue factibilidad, calidad matemática y
señales independientes sin esconder una respuesta moralmente correcta.

## Narrativa y continuidad — `ACCEPTED`

El modelo es **braided-linear**: todas las runs válidas completadas recorren la
misma secuencia académica y egresan, mientras historia, flags y carrera cambian
storylets, copy, contexto, elegibilidad y, de forma limitada, opciones. No existe
un árbol narrativo exponencial ni ventajas matemáticas ocultas.

Previas y recuperaciones son principalmente memoria de carrera: alimentan
callbacks, Hitos y epílogo, pero no generan una deuda mecánica futura sin límite.
El detalle vive en el [sistema narrativo](narrative-system.md).

## Identidad, cultura y tono

- **Jugador — `ACCEPTED`:** nickname opcional; sin selección obligatoria de género ni creador complejo. Personalización visual mínima queda como stretch.
- **Escuela — `ACCEPTED`:** anónima en core para favorecer proyección. Una marca escolar ficticia/paródica es stretch y no puede acoplar el producto a una institución real.
- **Identidad argentina — `LOCKED DIRECTION`:** jerga y cultura escolar argentinas fuertes, con matemática comprensible sin conocer el localismo.
- **Humor — `LOCKED DIRECTION`:** vida escolar realista, humor frecuente y absurdo ocasional; nunca humillación ni chiste desconectado de la situación.
- **Romance — `ACCEPTED`:** no es sistema ni pilar; sólo referencias sutiles opcionales.
- **Conflicto — `ACCEPTED`:** tensiones de grupo, responsabilidad, liderazgo, puntualidad y reputación; se excluyen bullying severo, violencia, sexualización y dilemas adultos.

El elenco relacional recurrente usa por defecto roles, no nombres: mejor amigo,
persona que organiza todo, compañero competitivo no villano, profe de Matemática
usada con moderación y preceptor. Los nombres se agregan sólo si mejoran claridad.

## Tiempo, eventos y proyecto recurrente

Cada año se percibe como inicio → desarrollo → cierre, con fechas explícitas sólo
cuando aportan identidad. El eje emblemático candidato es:

| Año | Evento emblemático |
|---|---|
| 7.º | 25 de Mayo |
| 1.º | Día del Estudiante |
| 2.º | Intercurso |
| 3.º | Día del Amigo / vacaciones de invierno |
| 4.º | Feria, peña o evento solidario escolar |
| 5.º | Viaje o evento final + egreso |

Existe una única línea multianual **Proyecto del Curso**: exposición, encuesta,
proyecto tecnológico, recaudación/evento y proyecto final. Su continuidad es
narrativa; su Template matemática no es obligatoria en toda run. Cuando no es
seleccionada, un storylet corto puede mantenerla presente sin consumir un beat.

Deportes, dinero cotidiano/colectivo, tecnología, transporte, proyectos y eventos
son contextos aceptados. Los presupuestos deben ser ficticios o colectivos y no
inferir poder adquisitivo familiar.

## Pacing — `ACCEPTED TARGET · UNVALIDATED`

La carrera completa apunta a 8–10 minutos y normalmente a 9–10 beats ordinarios,
dentro del rango preferido de 8–10. La arquitectura sigue admitiendo 6–12. Las
Templates declaran `QUICK / MEDIUM / DEEP`; una composición candidata típica usa
3–4 QUICK, 4–5 MEDIUM y 1–2 DEEP. Una recuperación suele ser QUICK o MEDIUM.

Es un objetivo sin validar hasta que exista contenido real suficiente. El fixture
sintético de 12 beats demuestra capacidad y boundedness, no pacing de producto.

## Rejugabilidad — `LOCKED GOAL`

Las primeras tres runs deberían sentirse perceptiblemente distintas por la suma
de composición, variantes aprobadas, callbacks, eventos condicionales/raros y
consecuencias de Carrera/Estilo. La variación numérica masiva por sí sola no cuenta
como rejugabilidad.

## Epílogo e Hitos

**Career Epilogue v1 — `REQUIRED FOR STAGE-08`.** El egreso debe sintetizar
Promedio, Equipo, Aura, Estilo, previas/recuperaciones, flags y Hitos en un relato
breve; no termina sólo en una tabla ni reduce la carrera a una etiqueta.

**Career Milestones — `ACCEPTED DESIGN SCOPE`.** Phase 0 diseña familias
académicas, sociales, de Estilo, recuperación y eventos raros. Un Hito puede ser
sólo visual, elegible para Prestige o badge raro; nunca recibe competencia
automáticamente ni duplica evidencia ya puntuada.

## Estado y siguiente paso

La envolvente está completa y aceptada, pero Phase 0 sigue `IN_PROGRESS`. La
matriz v0.2 está auditada y 1.º tiene diseño detallado aprobado a nivel candidato.
El siguiente trabajo canónico es **STAGE-08 / Phase 0 / Grade 2 — Belonging
Template Design Pass**; todavía no se autorizó implementar 1.º.
