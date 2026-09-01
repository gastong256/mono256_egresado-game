# Dificultad y jugabilidad universal

**Estado: arquitectura implementada; calibración candidata.** El principio de piso bajo y techo alto es **RECOMENDADO** como principio de diseño y ya gobierna el contenido existente. Los seis rasgos estructurales, las bandas derivadas `CORE / STANDARD / STRETCH`, los costos y el presupuesto por etapa están **implementados** como políticas versionadas y configurables ([ADR-022](../03-architecture/adr/ADR-022-difficulty-model-and-run-composer.md)). Desde STAGE-06 también está implementada la recompensa competitiva separada por banda ([ADR-023](../03-architecture/adr/ADR-023-competitive-score-policy.md)). Umbrales, costos, targets y recompensas actuales son candidatos: la calibración final es **TEACHER GATE** y la elección entre dificultad manual, adaptativa o híbrida sigue **OPEN** ([pregunta 5](../07-reference/open-questions.md)).

Este documento explica *cómo debe subir* la dificultad. Qué matemática se usa en cada año está en el [marco matemático](math-design-framework.md); qué factores hacen difícil un desafío concreto está en el [sistema de desafíos](challenge-system.md).

## El problema de audiencia

En la feria juegan estudiantes de 7.º, estudiantes de 5.º, docentes, familias y visitantes adultos. Un único “nivel medio de currículo” es demasiado difícil para unos y trivial para otros, y no hay forma de preguntar la edad sin pedir datos que el producto decidió no pedir.

## Piso bajo, techo alto, paredes anchas

- **Piso bajo:** entender la situación no requiere conocimiento previo especial. Nadie queda afuera en la primera pantalla.
- **Techo alto:** el razonamiento profundo aparece por restricciones, comparación y optimización, no por currículo avanzado.
- **Paredes anchas:** más de un camino y más de una representación válida para llegar.

Consecuencia práctica: **un adulto no se distingue por saber matemática universitaria, sino por encontrar la mejor solución**. Un desafío de 7.º bien construido puede seguir teniendo una decisión no obvia para alguien de 45 años.

La base de la literatura de diseño de tareas está en [base teórica](../07-reference/research-basis.md).

## De dónde tiene que venir la dificultad

Sube por:

- cantidad de relaciones relevantes;
- restricciones simultáneas;
- necesidad de filtrar información irrelevante;
- planificación en varios pasos;
- optimización, no sólo factibilidad;
- comparación entre alternativas;
- incertidumbre e interpretación estadística.

**No** sube por:

- números grandes;
- decimales feos;
- fórmulas avanzadas;
- presión de velocidad.

Confundir «difícil» con «cuentas incómodas» produce un examen disfrazado y castiga a quien razona bien pero calcula lento.

## Apoyos no son trampa

Si el objetivo de una tarea es elegir la mejor alternativa, mostrar la fórmula o permitir calculadora no baja el techo: saca una barrera que no era el objetivo. Es la distinción de UDL entre barrera de acceso y objetivo real de la tarea.

Qué desafíos deben ofrecer qué apoyo es **TEACHER GATE**; si se permite calculadora en el ranking de feria sigue **OPEN** ([pregunta 7](../07-reference/open-questions.md)).

## Bandas de dificultad

**Implementadas** como metadata de autoría y scheduling; su interpretación y calibración exactas siguen **RECOMENDADAS / TEACHER GATE**. No se muestran al jugador.

| Banda | Estructura |
|---|---|
| **CORE** | una relación principal, ramificación cognitiva mínima |
| **STANDARD** | dos relaciones o restricciones, comparación o cadena corta de pasos |
| **STRETCH** | múltiples restricciones, optimización, selección de información u objetivos en conflicto |

### Relación con lo que ya existe

El motor define `DifficultyLevel` de 1 a 5 por plantilla (`src/game/challenges/taxonomy.ts`) y el marco matemático habla de variantes básica, intermedia y avanzada. Las tres escalas describen lo mismo con distinta resolución:

| Banda | Nivel del motor | Variante del marco matemático |
|---|---|---|
| CORE | 1–2 | básica |
| STANDARD | 3 | intermedia |
| STRETCH | 4–5 | avanzada |

**Este mapeo es una lectura documental, no una migración.** Nada en el código cambia por él; existe para que un documento que dice `STRETCH` y un test que dice `difficulty: 5` se puedan leer juntos.

Desde STAGE-05 las dos escalas coexisten con roles distintos y **pueden discrepar**: `DifficultyLevel` es la perilla que la política de dificultad del runtime mueve durante una partida, y la banda es la clasificación estructural con la que el compositor agenda. Donde no coinciden, es un hallazgo de calibración para el Gate y está registrado en la tabla de abajo, no un defecto que el motor tenga que reconciliar.

## De dónde sale la banda, en el código

Una plantilla declara seis rasgos de su estructura, y la banda sale de su suma. No se elige: se deriva.

| Rasgo | Qué mide | Rango |
|---|---|---|
| `steps` | pasos encadenados antes de que exista una respuesta | 1–4 |
| `constraints` | restricciones que tienen que valer **a la vez** | 0–3 |
| `selection` | cuánto del trabajo es decidir qué dato importa | 0–3 |
| `optimization` | si alcanza con una respuesta que funcione o hay que buscar la mejor | 0–2 |
| `uncertainty` | lectura estadística, estimación, información incompleta | 0–2 |
| `construction` | si la respuesta hay que **producirla** en vez de reconocerla | 0–1 |

`CORE` hasta 4, `STANDARD` hasta 7, `STRETCH` de 8 en adelante. Esos dos umbrales son toda la superficie de calibración de la clasificación: moverlos reclasifica contenido sin tocar una línea de composición.

Un autor que quiere que su plantilla se agende como más exigente tiene que nombrar el rasgo que la vuelve así, y eso es justamente lo que impide que «difícil» degenere en «cuentas más incómodas».

## Clasificación del contenido actual

**Calibración candidata de ingeniería, no verdad pedagógica.** El Teacher Gate puede mover cualquier fila sin que cambie nada de la arquitectura. Los rasgos van en el orden de la tabla de arriba.

| Plantilla | Dominio | Rasgos | Carga | Banda | Costo | Nivel autorado | Por qué |
|---|---|---|---|---|---|---|---|
| `g7.may-25-act` | patrones · cantidad | 1·0·2·0·0·1 | 4 | CORE | 1,00 | 2 ✓ | una regla por celda, escrita en pantalla; lo que pesa son tres reglas y veinticuatro celdas |
| `g7.bus-timing` | tiempo · porcentajes | 2·1·1·1·0·0 | 5 | STANDARD | 1,50 | 2 ✗ | demora aplicada a cuatro salidas y comparadas contra la entrada |
| `g7.notebook-offer` | porcentajes | 2·1·1·1·0·0 | 5 | STANDARD | 1,50 | 3 ✓ | dos ofertas que hay que llevar a la misma unidad, con el efectivo como límite |
| `g7.bus-latest-departure` | tiempo · porcentajes | 2·1·1·1·0·1 | 6 | STANDARD | 1,50 | 3 ✓ | la misma relación al revés, y sin opciones: el número lo produce el jugador |
| `g7.mural-paint` | espacio y forma | 3·1·1·1·0·0 | 6 | STANDARD | 1,50 | 2 ✗ | área, litros y envases enteros: cadena de tres donde perder el intermedio pierde el problema |
| `g7.stand-supplies` | optimización | 2·2·1·2·0·1 | 8 | STRETCH | 2,10 | 3 ✗ | porciones mínimas y presupuesto a la vez, sobre una combinación que se arma |
| `g7.group-tasks` | optimización | 2·2·2·2·0·1 | 9 | STRETCH | 2,10 | 3 ✗ | repartir todo sin pasarse de las horas de nadie, leyendo afinidad y disponibilidad |

**Las cuatro divergencias con el nivel autorado son el resultado más útil de la tabla.** `baseDifficulty` se escribió como perilla de runtime y no como clasificación estructural, y donde las dos no coinciden hay una pregunta concreta para el Gate: ¿el mural es realmente más liviano que el colectivo? ¿El stand y el trabajo grupal son `STRETCH` para un chico de 7.º, o el año entero está calibrado alto? Un test fija la clasificación, así que moverla es una decisión visible en un diff.

## Presupuesto de dificultad

**Implementado como mecanismo; calibración RECOMENDADA / TEACHER GATE.** Si las runs oficiales se arman con variantes procedurales, dos jugadores pueden recibir cargas distintas y el ranking deja de comparar habilidad. El presupuesto de dificultad ata la carga estructural esperada de cada run.

Forma discreta: por ejemplo 2 CORE, 3 STANDARD, 1 STRETCH.
Forma numérica: `Σ difficultyCost ≈ constante`, con tolerancia declarada.

**Implementado en la forma numérica.** Cada etapa declara objetivo y tolerancia, el compositor sólo produce planes que caen adentro, y un validador independiente lo vuelve a comprobar sobre el plan ya serializado. Los costos viven en centésimas enteras —100, 150, 210— porque un presupuesto que suma flotantes termina discutiendo consigo mismo si un plan entraba.

La evidencia post-STAGE-05: 20.000 seeds de la partida normal de 7.º producen 1.404 planes concretos, todos con costo 2,50, cero fuera del sobre, cero fallos de validación independiente, round-trip o recomposición. Una prueba aparte compone 10.000 carreras sintéticas de exactamente seis etapas con sus propios targets y cero fallos. Eso dice que el mecanismo produce carga estructural comparable bajo la política candidata; **no** dice que las runs sean igual de difíciles para una persona. Ver [ADR-022](../03-architecture/adr/ADR-022-difficulty-model-and-run-composer.md) y `pnpm game:compose`.

Los costos de scheduling son **metadata de armado de run** y están separados del multiplicador de score. El compositor necesita distinguir fuerte entre CORE y STRETCH para balancear; el score necesita multiplicadores chicos para que la suerte del sorteo no domine sobre la habilidad. El estado implementado está en [game engine](../03-architecture/game-engine.md) y la brecha restante en [arquitectura objetivo](../03-architecture/target-engine-architecture.md).

### Valores candidatos

Provisionales, **no oficiales**, sujetos a Teacher Gate:

| Banda | Costo de scheduling | Multiplicador de score |
|---|---|---|
| CORE | 1,00 | 1,00 |
| STANDARD | 1,50 | 1,08 |
| STRETCH | 2,10 | 1,15 |

Si el multiplicador de score crece mucho, el sorteo de variantes empieza a decidir el ranking. Ese es el motivo de que sean chicos, y es el criterio para discutirlos.

## Dificultad adaptativa en competencia

La adaptación es útil en modo libre o de práctica. En modo feria oficial, bajarle la dificultad en silencio a quien está fallando rompe la comparabilidad del ranking, salvo que el score compense formalmente esa diferencia y los docentes lo aprueben.

Dirección recomendada para la feria: **runs equiparadas por presupuesto de dificultad**, con pools de variantes emparejados. La adaptación queda para un modo posterior.

## Calibración

Antes de datos reales: juicio docente y experto sobre rasgos estructurales de cada plantilla.
Después de la feria: tasas empíricas de éxito y tiempo por plantilla. Esos datos alimentan **versiones futuras**; no redefinen retroactivamente un score oficial salvo que la política del evento lo permita explícitamente.
