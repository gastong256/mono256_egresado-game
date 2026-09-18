# Especificación de remediación matemática dirigida · ronda 2

- **Estado:** `CANONICAL CONTRACT` — emitida el 2026-09-18 por la
  [adjudicación de hallazgos posteriores a la re-auditoría](post-reaudit-mathematics-findings-adjudication.md)
- **Gate que la consume:** `TARGETED POST-REAUDIT MATHEMATICS REMEDIATION`
- **Gate que la verifica:** `INDEPENDENT MATHEMATICS RE-AUDIT ROUND 2`
- **Base:** `main` en `0a1f6ba`; motor `10.0.0`; action log `7`; snapshot `8`;
  catálogos `grade-1-dev-2`, `grade-2-dev-3`, `grade-3-dev-3`, `grade-4-dev-3`,
  `grade-5-dev-4`, `grade-7-dev-6`; score `fair-score-dev-2` sin cambios

Este documento es **sólo contrato**. Las razones, la evidencia, los estudios de
factibilidad y los desacuerdos están en la adjudicación; acá no se vuelven a discutir.
Quien implementa **no redecide producto**: si un criterio resulta imposible, aplica la
regla de STOP (sección 2.10).

La ronda 1 —los catorce contratos de la
[especificación original](mathematics-remediation-spec.md)— está **cerrada y vigente**.
Esta ronda no la reabre: la extiende en cuatro puntos y corrige tres cosas que su
instrumentación no podía ver.

## 1. Alcance y paquetes de trabajo

| Orden | Paquete | Contrato | Prio | Objeto |
|---|---|---|---|---|
| **1** | **WP-RA-AUDIT** | RS-RA-AUDIT-001 | P0 | Auditoría permanente por capacidad, sobre las 42 Templates |
| 2 | WP-RA-001 | RS-RA-001 | P0 | `g7.bus-travel-review`, detección con signo |
| 3 | WP-RA-002 | RS-RA-002 | P0 | `y3.course-project-tech`, resistencia a respuesta constante |
| 4 | WP-RA-003 | RS-RA-003 | P0 | `y4.course-project-fundraiser`, ídem |
| 5 | WP-RA-TEST | RS-RA-TEST-001 | P1 | Calentamiento de ESLint fuera del caso cronometrado |
| 6 | WP-RA-DOCS | sección 8 | P2 | Documentación, decisiones y reconciliación de versiones |
| 7 | WP-RA-VERIFY | sección 9 | — | Verificación completa de cierre |

**WP-RA-AUDIT va primero, y no es negociable.** El criterio de éxito de WP-RA-002 y
WP-RA-003 es una medición que hoy no existe en el repositorio. La secuencia obligatoria
es:

```text
1. construir la auditoría ampliada
2. REPRODUCIR los hallazgos con ella, sobre el catálogo VIGENTE
   (K 95,83 en y3.course-project-tech · K 92,80 en y4.course-project-fundraiser)
3. recién entonces corregir contenido
4. volver a medir con la MISMA herramienta
```

Un paquete de corrección que se implemente antes de que la auditoría pueda reproducir
el hallazgo se rechaza: sin la medición previa no hay prueba de que la corrección haya
hecho algo.

## 2. Reglas transversales

1. **Score.** `fair-score-dev-2@2.0.0-post-tg1-candidate`, 85 / 10 / 5, y la escalera
   100 / 75 / 40 / 10 **no cambian**. Ningún contrato de esta ronda se cumple tocando el
   scorer.
2. **Motor.** `ENGINE_VERSION` `10.0.0`, `ACTION_LOG_VERSION` `7` y
   `SNAPSHOT_SCHEMA_VERSION` `8` **no suben**. Si un contrato resultara imposible sin
   cambiar un schema serializado en runtime, aplica STOP y se declara explícitamente:
   **prohibido el bump silencioso**.
3. **Lo cerrado sigue cerrado.** No se reabren `RS-MAT-008`, el techo `K ≤ 78` a
   `N = 25`, la excepción estrecha de witness de `y5.stage-screen`, `OQ-66`, `OQ-67`, ni
   ninguno de los otros doce contratos que el re-audit verificó PASS.
4. **Sin techos universales.** Está **prohibido** introducir un `K` o un `S` global. Cada
   umbral de esta ronda rige sobre su Template y sale de su constructo. La auditoría
   **reporta**; los contratos **deciden qué falla**.
5. **Invariantes.** Intrinsic Math Gate IM-1…IM-5; `Math action != Team evidence != Aura
   action`; Estilo sólo carrera; piso universal desde 7.º; todo `LOCKED` de las fichas de
   diseño.
6. **Evaluación exacta.** Toda comparación que decide un nivel usa enteros o racionales
   ([ADR-013](../03-architecture/adr/ADR-013-exact-rational-arithmetic.md)).
7. **Catálogos.** Un catálogo publicado no se edita: toda regeneración publica la
   siguiente versión `-dev-N` y sube la versión de contenido correspondiente, con la
   convención de `src/content/*/versions.ts`, D-S08-088 y D-S08-109. El generador cuyo
   espacio cambia sube su `version`.
8. **Witnesses y oráculos.** Se conservan y se pasan: witness por nivel
   (`tierWitnessIssues`), witness de Math óptima con Equipo máximo y de Aura máxima donde
   la Template los tiene, gate de Estilo, oráculo independiente que no llama al
   evaluador. **Adicional de esta ronda:** un oráculo no cuenta como independiente si
   deriva su verdad de la misma función que el evaluador (sección 3, criterio 7).
9. **Replay y servidor.** Una run registrada con versiones anteriores se reproduce con
   esas versiones; las rutas nuevas quedan cubiertas por replay, reanudación y
   recomputación de servidor.
10. **STOP.** Si un criterio resulta imposible sin violar otro criterio, una regla de
    esta sección o una decisión `LOCKED`, se detiene el paquete, se registra la evidencia
    —qué se probó y qué números dio— y se consulta. **Ningún techo se relaja en
    silencio.**
11. **Prohibido.** Nuevas Templates; nuevos motores de interacción; `official: true`;
    cambios de Prestige, rareza, epílogo o composición; subir contenido a
    `math_reviewed`; bajar umbrales de cobertura; subir `testTimeout` global.

## 3. RS-RA-AUDIT-001 — auditoría permanente por capacidad

- **Hallazgo:** MAT-RA-006 · **Decisión:** `REQUIRED_CORRECTION` · **Prioridad:** P0

**Problema.** `tests/helpers/blind-strategy.ts` despacha por **nombre de motor** y
termina en `motor ${view.kind} no enumerable`. 22 de 42 Templates salen sin métrica, y
para las de cantidades ese juicio es falso: su espacio de vectores constantes tiene
entre 125 y 1573 elementos.

**Comportamiento requerido.**

1. **Clasificación por capacidad, no por nombre de motor.** Cada Template se clasifica
   midiendo su espacio de respuesta real, en una de cuatro categorías:

   | Categoría | Significado |
   |---|---|
   | `A` | Existe un vector de respuesta semánticamente estable y su cardinal es tratable |
   | `B` | El espacio es finito pero excede el presupuesto de tratabilidad |
   | `C` | No existe respuesta constante estable: los identificadores, ítems o máximos cambian entre variantes |
   | `D` | Espacio de construcción orientado a política, sin vector constante comparable |

2. **Categoría A — enumeración exhaustiva de respuestas constantes.** Se recorre **todo**
   el espacio de vectores constantes sobre **todas** las variantes aprobadas, y se
   reporta: `R` cuando sea significativo, `K`, `S`, la mejor respuesta constante y el
   histograma de niveles. Como mínimo debe cubrir las Templates de `quantity-builder` y
   `budget-builder` cuyo vector de ítems y máximos es constante en el catálogo, donde la
   tratabilidad ya está demostrada: `g7.stand-supplies` (702), `y3.course-project-tech`
   (1573), `y4.course-project-fundraiser` (630), `y4.school-event-flow` (125).
3. **Umbral de tratabilidad medido, no arbitrario.** El límite entre A y B se declara en
   costo —número de evaluaciones, o milisegundos medidos en CI— y se justifica con la
   medición, no con un número inventado. Una Template que cae en B lo dice con su
   cardinal.
4. **Categorías B, C y D — familias de política ingenua determinista.** Donde no hay
   respuesta constante única, se ejecutan políticas semánticamente relevantes al motor, y
   se reporta la mejor. Mínimo por motor:

   | Motor | Políticas mínimas |
   |---|---|
   | cantidades / presupuesto | todo al mínimo · todo al máximo · mitad del máximo · primer ítem al máximo · proporciones iguales |
   | asignación | todo a la primera persona · cíclica · equilibrada · preservar el orden |
   | agenda | lo más temprano posible · lo más tarde posible · preservar el orden · repartido uniforme |
   | espacial | empaque desde el origen · misma orientación · primer hueco · fila a fila · huella mínima |
   | recorrido | orden presentado · orden inverso · vecino más cercano |
   | grilla / clasificación | todo sí · todo no · primer patrón válido |

   Estas políticas son **detectores**, no techos. Ninguna genera por sí sola un criterio
   de falla.
5. **Salida obligatoria para las 42 Templates.** Cada fila declara su estado:

   ```text
   AUDITED_EXHAUSTIVELY
   AUDITED_BY_POLICIES
   NOT_APPLICABLE_WITH_REASON
   BLOCKED_BY_SPACE_WITH_REASON
   ```

   **Está prohibido** emitir `no enumerable` sin categoría ni razón. Ninguna Template
   puede quedar sin fila.
6. **Prueba de que el punto ciego se cerró.** La auditoría ampliada tiene que
   **detectar MAT-RA-002 y MAT-RA-003 sobre el catálogo vigente**, con los números de la
   adjudicación —`K 95,83 · S 83 %` y `K 92,80 · S 92 %`—, **antes** de que se corrija
   contenido. Esa reproducción es un entregable del paquete, no un paso opcional.
7. **Regla anti-oráculo-compartido.** Cuando un test compare evaluador contra oráculo, el
   oráculo no puede derivar su verdad de la misma función que el evaluador. Donde hoy la
   comparte —`screenChoices` sobre `tierOf`, `surveyPlans` y `standingsPlans` sobre
   `surveyClaims` / `independentTruths`— se documenta explícitamente que el test valida
   la **agregación** y no la **verdad**, para que nadie lea más garantía de la que da.

**Comportamiento prohibido.** Introducir un techo global de `K` o de `S`; cambiar
evaluadores, generadores o catálogos desde este paquete; bajar umbrales de cobertura;
volver la auditoría no determinista.

**Criterios de aceptación.** Los siete puntos, con la matriz de cobertura de las 42
Templates en la salida del test y la reproducción de los dos hallazgos.

**Tests requeridos.** Ampliar `tests/integration/blind-strategy-audit.test.ts` y
`tests/helpers/blind-strategy.ts`: matriz de cobertura completa; enumeración exhaustiva
de las cuatro Templates de categoría A nombradas; políticas por motor; aserción de que
ninguna fila queda sin categoría.

**Superficie de versión.** **Sólo tooling de test.** Sin contenido, sin catálogos, sin
generadores, sin motor.

**Docs a actualizar.** [Auditoría de variantes](variant-validation-and-audit.md), con las
categorías y el umbral de tratabilidad medido.

## 4. RS-RA-001 — `g7.bus-travel-review`

- **Hallazgo:** MAT-RA-001 · **Decisión:** `REQUIRED_CORRECTION` · **Prioridad:** P0
- **Relación con la ronda 1:** cierra el incumplimiento de `RS-NEW-003`, cuyo alcance
  transversal ya lo incluía

**Comportamiento requerido.**

1. **Detección con signo.** La rama que nombra una concepción errónea se activa sólo
   cuando la respuesta satisface **exactamente** esa concepción. Para este Repaso, la
   concepción es «contestó la demora sola»: la condición es
   `respuesta === extraMinutes`, o cualquier forma con signo equivalente. **Prohibido**
   decidir una rama de concepción errónea con un valor absoluto.
2. **Una rama, una concepción.** Ninguna rama de feedback puede activarse en una
   respuesta que no sea la concepción errónea que su texto describe.
3. **Sin dirección invertida.** Una respuesta **por encima** de la exacta no puede
   recibir un texto de **por debajo**, ni al revés. Formalmente: para toda variante
   aprobada y toda respuesta del rango presentado, la dirección que el texto afirma
   coincide con el signo de `respuesta − exacta`.
4. **Nivel coherente.** El valor `exacta + viajeNormal` deja de ser `functional` y pasa a
   ser el nivel que le corresponde por su distancia, con la escalera existente. La
   escalera **no se rediseña**: sólo deja de aplicarse por una condición mal escrita.
5. **El error con nombre propio conserva su explicación.** Quien contesta la demora sola
   sigue recibiendo `functional` y sigue leyendo que faltaba sumar el viaje normal.
6. **El inventario prueba la condición de rama, no la intención.** El
   [inventario de feedback](mathematics-remediation-feedback-inventory.md) se
   **re-verifica** para toda Template: cada texto fijo que afirma una comparación, una
   dirección o una causa se valida contra **la condición de rama que lo dispara**,
   enumerando las respuestas que la satisfacen. La entrada de `g7.bus-travel-review` pasa
   de clase **A** a su clase real y queda corregida con su justificación medida.
7. **El Repaso sigue fuera de FairScore.** `placement: 'recovery'`, puntaje 0. Sin
   cambios de Estilo ni de flags.
8. **Sin recalibración de score.**

**Comportamiento prohibido.** Cambiar la escalera de niveles del Repaso, sus datos, sus
variantes, su rango presentado o su exclusión de FairScore; convertirlo en puntuable;
cambiar el perfil cognitivo o el pacing.

**Contenido afectado.** `evaluate` en
`src/content/grade-7/challenges/bus-travel-review.ts`. Se espera que **no** cambie el
generador ni la población de variantes.

**Criterios de aceptación.** Los ocho puntos, probados por enumeración.

**Tests requeridos.** En el test de contenido de 7.º: enumerar **todo** el rango
presentado `[0, 120]` de **las 26 variantes aprobadas** y verificar, para cada respuesta,
que la dirección afirmada coincide con el signo de `respuesta − exacta`; caso construido
para `exacta + viajeNormal` en cada variante; que la rama de la concepción errónea
dispara en `extraMinutes` y **sólo** ahí; que los niveles existentes no se movieron fuera
de lo que el punto 4 autoriza.

**Chequeos de catálogo.** Sin cambio de población esperado. `pnpm game:variants check` en
7.º y en todos los catálogos que re-aprueban 7.º, sin diferencias de entradas.

**Superficie de versión esperada.** Contenido de 7.º según convención; catálogos sin
cambio de población. Si la convención del repositorio exige republicar los catálogos que
re-aprueban 7.º al subir su contenido, se republican una sola vez, al final, con
WP-RA-DOCS. Motor: sin cambio.

**Docs a actualizar.** Inventario de feedback; registro de decisiones.

## 5. RS-RA-002 — `y3.course-project-tech`

- **Hallazgo:** MAT-RA-002 · **Decisión:** `REQUIRED_CORRECTION` · **Prioridad:** P0

**Constructo a preservar (`LOCKED`).** Tres recursos compartidos que se leen de la
pantalla —minutos de notebook, MB de pendrive, minutos de laboratorio con su tasa de
subida—, los mínimos de la feria y los objetivos prometidos; Equipo como lectura
**separada** de los mismos números por dueño; el Repaso `y3.rate-capacity-review`; banda
STANDARD, pacing MEDIUM, arco PROJECT; motor `quantity-builder`.

**Comportamiento requerido.**

1. **Ninguna respuesta constante domina.** Sobre el catálogo publicado, enumerando
   **todo** el espacio de vectores constantes:

   ```text
   K ≤ 65        S ≤ 35 %
   ```

   Medido con la auditoría de la sección 3, que enumera exhaustivamente. El techo sale del
   estudio de factibilidad de la adjudicación —donde un diseño no degenerado alcanza
   57,50— y del precedente de `RS-NEW-001` para la misma familia y clase de constructo.
2. **Se elimina la clase de exploit, no el vector.** El conjunto de objetivos que el
   generador puede emitir **no puede tener un supremo componente a componente que sea
   una respuesta admisible en el catálogo**. Hoy ese supremo es `(5, 4, 6)` sobre
   máximos `(10, 10, 12)`, y cumple todos los objetivos posibles. Criterio operativo:
   ningún vector constante alcanza `optimal` en más del 35 % de las variantes, y eso se
   comprueba por enumeración, no por inspección del vector conocido.
3. **Las dos palancas, juntas.** El estudio de factibilidad probó que ninguna alcanza
   sola —objetivos amplios con topes flojos dan 88,33; topes apretados con objetivos de
   hoy dan 83,33—. La remediación tiene que **ampliar el espacio de objetivos** y
   **hacer que los topes de recurso aprieten** respecto del costo del plan objetivo. La
   forma concreta la decide quien implementa, dentro de lo que este contrato permite.
4. **Los topes aprietan, pero no fuerzan la respuesta.** Queda **prohibido** el diseño
   degenerado en que el plan objetivo es el único plan válido: en toda variante aprobada
   tiene que haber al menos dos planes válidos con niveles distintos, y el witness de
   tres niveles se conserva.
5. **La cuenta sigue siendo legible.** Los objetivos, mínimos y topes siguen en enteros
   chicos, verosímiles para una feria escolar. Prohibido alcanzar el techo subiendo la
   dispersión hasta producir números que un curso no reconocería: eso es la bandera
   humana H-8.
6. **Diversidad de respuesta óptima.** El conjunto de planes óptimos del catálogo no
   puede colapsar en un puñado de vectores: al menos **cinco** vectores distintos
   aparecen como óptimos entre las variantes aprobadas.
7. **Un plan óptimo sigue existiendo en toda variante.**
8. **Equipo y Math siguen separados.** Se conservan los gates de Equipo por dueño, el
   witness de Math óptima con Equipo máximo y la independencia declarada en `scoring`.
9. **Sin cambios de escalera, banda, pacing, arco ni motor.**

**Comportamiento prohibido.** Introducir aleatoriedad en runtime; cambiar la escalera;
volver la Template no puntuable; cambiar el motor de interacción; hacer el plan objetivo
el único válido; alcanzar el techo sólo moviendo el vector dominante sin cambiar la
clase; cambiar el Repaso asociado.

**Contenido afectado.** `src/content/grade-3/challenges/course-project-tech.ts`:
`MINIMUMS`, `TARGET_STEPS`, `NOTEBOOKS`, `MEGABYTES`, `LABS`, `RATES`, el generador, los
gates y, si hace falta para el punto 2, el schema y `ITEMS`. Si los máximos por ítem
tuvieran que pasar a ser dependientes de la variante, eso **cambia el schema de
presentación** y hay que declararlo: no es un cambio de motor, pero sí de contenido, y
se registra.

**Criterios de aceptación.** Los nueve puntos y los techos, verificados por la auditoría
de la sección 3.

**Tests requeridos.** En el test de 3.º: enumeración exhaustiva del espacio constante
sobre el catálogo publicado con `K ≤ 65` y `S ≤ 35 %`; ausencia de un supremo de
objetivos que sea respuesta admisible; al menos dos planes válidos con niveles distintos
por variante; cinco vectores óptimos distintos; witness de tres niveles; gates de Equipo
existentes en verde; oráculo independiente contra evaluador.

**Mediciones.** `K`, `S`, mejor vector constante, histograma de niveles y número de
vectores óptimos distintos, **antes y después**.

**Superficie de versión esperada.** Versión del generador de
`y3.course-project-tech`; contenido de 3.º y posteriores; catálogos de 3.º, 4.º y 5.º
republicados. Motor: **sin cambio**.

**Docs a actualizar.** [Ficha de 3.º](../01-game-design/grade-3-template-design.md);
auditoría de variantes.

## 6. RS-RA-003 — `y4.course-project-fundraiser`

- **Hallazgo:** MAT-RA-003 · **Decisión:** `REQUIRED_CORRECTION` · **Prioridad:** P0
- **Relación con `RS-MAT-011`:** contrato **nuevo y separado**. `RS-MAT-011` era de
  claridad textual, sigue PASS y **no se deforma**. Sólo queda corregida su línea
  «Mediciones. Ninguna de estrategia ciega», que la medición falsó

**Constructo a preservar (`LOCKED`).** Las tres condiciones en orden —no perder plata
(cubrir los costos), llegar al objetivo, llegar con el colchón—; «punto de equilibrio»
glosado en palabras; el supuesto de que todo lo preparado se vende; el arco PROJECT;
banda STANDARD y pacing MEDIUM; el comportamiento de Estilo; el Repaso
`y4.margin-review`; motor `quantity-builder`.

**Comportamiento requerido.**

1. **Ninguna respuesta constante domina.**

   ```text
   K ≤ 65        S ≤ 35 %
   ```

   Enumerando **todo** el espacio de vectores constantes sobre el catálogo publicado. El
   estudio de factibilidad alcanzó 40,00–49,80, así que el techo tiene amplio margen.
2. **La economía relativa varía entre variantes.** Esto es el corazón del contrato. Hoy
   el orden de los ítems por **margen de contribución por minuto de cocina** es idéntico
   en **25 de 25** variantes (`bebidas > panchos > tortas`), así que el razonamiento
   correcto da siempre la misma respuesta. Criterio operativo: en el catálogo publicado
   **al menos tres** ordenaciones distintas de los tres ítems por margen por minuto
   aparecen, y **ninguna** en más del 50 % de las variantes.
3. **El colchón aprieta.** La diferencia entre la ganancia alcanzable y
   `objetivo + reserva` deja de ser holgada en la mayoría de las variantes. El estudio
   mostró que, con el orden fijo, reducir el colchón por sí solo deja `K` en 65,20: es
   necesario, no suficiente. Se exige junto al punto 2.
4. **Las tres condiciones siguen alcanzables por separado**, como ya exige el gate
   vigente: existe un plan que cubre costos sin llegar al objetivo, uno que llega al
   objetivo sin el colchón y uno que llega al colchón.
5. **Economías verosímiles.** Precios, costos y minutos de cocina siguen siendo números
   que un curso real podría tener. Prohibido alcanzar el techo con economías absurdas:
   bandera humana H-9.
6. **Diversidad de plan óptimo.** Al menos **cinco** vectores distintos aparecen como
   óptimos entre las variantes aprobadas.
7. **Un plan óptimo sigue existiendo en toda variante.**
8. **Estilo y el Repaso no cambian.** El gate de Estilo se conserva y
   `y4.margin-review` no se toca.
9. **Sin cambios de escalera, banda, pacing, arco ni motor.**

**Comportamiento prohibido.** Aleatoriedad en runtime; cambiar la escalera o las tres
condiciones; volver la Template no puntuable; cambiar el motor; alcanzar el techo sólo
moviendo el vector dominante; tocar el Repaso de margen salvo por `RS-RA-001`; cambiar
el texto que `RS-MAT-011` fijó, salvo que un número nuevo lo exija, y entonces se
re-verifica `RS-MAT-011`.

**Contenido afectado.** `src/content/grade-4/challenges/course-project-fundraiser.ts`:
`COSTS`, `PRICES`, `MINUTES`, `FIXED`, `TARGETS`, `KITCHEN`, `RESERVE`, las formas
semánticas, el generador y los gates. Si los máximos por ítem tuvieran que variar por
variante, se declara como en RS-RA-002.

**Criterios de aceptación.** Los nueve puntos y los techos, verificados por la auditoría
de la sección 3.

**Tests requeridos.** En el test de 4.º: enumeración exhaustiva del espacio constante con
`K ≤ 65` y `S ≤ 35 %`; distribución de ordenaciones por margen por minuto con al menos
tres presentes y ninguna sobre el 50 %; colchón por variante; las tres condiciones
alcanzables por separado; cinco vectores óptimos distintos; witness y gate de Estilo en
verde; `RS-MAT-011` re-verificado si cambió algún número del texto.

**Mediciones.** `K`, `S`, mejor vector constante, histograma, ordenaciones por margen por
minuto y colchón, **antes y después**.

**Superficie de versión esperada.** Versión del generador de
`y4.course-project-fundraiser`; contenido de 4.º y posteriores; catálogos de 4.º y 5.º
republicados. Motor: **sin cambio**.

**Docs a actualizar.** [Ficha de 4.º](../01-game-design/grade-4-template-design.md);
auditoría de variantes.

## 7. RS-RA-TEST-001 — reproducibilidad de `architecture-lint`

- **Hallazgo:** MAT-RA-008 · **Decisión:** `REQUIRED_CORRECTION` · **Prioridad:** P1
- **Naturaleza:** paquete **técnico**, separado de la remediación matemática

**Problema medido.** El primer `eslint.lintText()` del archivo paga la resolución de
configuración de ESLint por única vez: 948–1651 ms aislado, mientras cada caso posterior
cuesta 6–7 ms. Ese costo único está **dentro de un caso cronometrado**, y bajo cobertura
e instrumentación en paralelo llega a 5575 ms y cruza el `testTimeout` por defecto de
5000 ms.

**Comportamiento requerido.**

1. El calentamiento único de ESLint sale del caso cronometrado y pasa a una fase de
   preparación con su propio presupuesto —`beforeAll` o equivalente—, de modo que ningún
   caso individual cargue con la resolución de configuración.
2. `pnpm verify` completo queda **reproduciblemente verde**. Evidencia mínima: tres
   corridas consecutivas de `pnpm verify` sin fallas.
3. **No se sube** el `testTimeout` global ni el de ese archivo como sustituto del
   arreglo. Si además se quiere un presupuesto explícito para esa fase, va **en la fase
   de preparación**, justificado con la medición.
4. **No se bajan** umbrales de cobertura, ni se excluyen archivos de la cobertura.
5. La política de lint que el test afirma **no cambia**: sigue rechazando la
   nondeterminación implícita en el núcleo del juego, con los mismos casos.

**Comportamiento prohibido.** `.skip`, `.only`, marcar el test como flaky-tolerante,
reintentos automáticos, bajar cobertura, subir el timeout global.

**Contenido afectado.** `tests/unit/architecture-lint.test.ts`; `vitest.config.ts` sólo
si hiciera falta y sin subir el timeout global.

**Superficie de versión.** Ninguna. Sólo tests.

## 8. WP-RA-DOCS — documentación, decisiones y versiones

1. **Erratum de la re-auditoría.** Su sección A dice «los catorce se sostienen» y su
   matriz concluye 13 / 14. La matriz es la correcta. Se agrega la nota de erratum en el
   documento de re-auditoría, remitiendo a la adjudicación. **No se borra su historia.**
2. **Erratum del techo de la pantalla del acto.** Corregir «25 es el tamaño que minimiza
   el techo» en
   [la adjudicación final del techo](rs-mat-008-blind-ceiling-final-adjudication.md):
   `K_min(N) = 75 + 25·⌈N/10⌉/N`, que vale 77,5 para todo `N` múltiplo de 10 y 77,885
   para `N = 26`. El resultado del contrato **no cambia**: 78 es el mínimo a `N = 25`.
3. **Erratum de `RS-MAT-011`.** Su línea «Mediciones. Ninguna de estrategia ciega» queda
   marcada como falsada por medición, con remisión a MAT-RA-003 y a `RS-RA-003`.
4. **Inventario de feedback.** Corregir la clase de la entrada de
   `g7.bus-travel-review` y declarar la regla nueva: la clasificación se prueba contra la
   **condición de rama**, no contra la intención.
5. **Política de retención de catálogos.** Aclarar en
   [ADR-021](../03-architecture/adr/ADR-021-approved-catalog-in-play-and-teacher-demo.md)
   §4 que la garantía de resolución rige para los catálogos que una run **oficial** puede
   declarar, y que 1.º a 5.º usan renombrar-republicar mientras están en `draft` con
   `official: false` (D-S08-088, D-S08-109). Registrar el requisito **R-S09-CAT** para
   STAGE-09.
6. **Fichas de año.** 3.º y 4.º, con los espacios y distribuciones nuevos.
7. **Gobernanza.** Registro de decisiones, preguntas abiertas, etapa actual, roadmap y
   trazabilidad, con la terminología de rondas de la sección 10.
8. **Banderas humanas.** H-6 a H-10 de la adjudicación, en el paquete de revisión humana.
9. **Republicación única.** Los catálogos se republican **una sola vez**, al final: lo
   obligatorio es el estado final, no los intermedios.

## 9. WP-RA-VERIFY — verificación de cierre

Con Node 24.19.0 (`pnpm toolchain:check`), desde la raíz:

1. **Reproducción previa obligatoria.** Con la auditoría ampliada y **antes** de tocar
   contenido: `K 95,83 · S 83 %` en `y3.course-project-tech` y `K 92,80 · S 92 %` en
   `y4.course-project-fundraiser`. Guardar la tabla.
2. `pnpm game:validate-content`
3. `pnpm game:variants check`, y además `--content=grade-1` a `--content=grade-5`: los
   **seis** catálogos, con rebuild byte a byte e integridad.
4. `pnpm game:blind-audit`: matriz de cobertura de las **42** Templates, sin ninguna fila
   sin categoría, y los techos de RS-RA-002 y RS-RA-003 cumplidos.
5. La enumeración completa de `RS-RA-001`: rango `[0, 120]` × 26 variantes.
6. **Regresión de los catorce contratos de la ronda 1**, incluidos los techos de la
   sección 3 de la especificación original.
7. `pnpm game:simulate:deep`
8. `pnpm game:score`: techo de 10 000 alcanzable y recomputación determinista.
9. `pnpm test:e2e:only`
10. `pnpm verify` completo, **tres corridas consecutivas en verde** (RS-RA-TEST-001).
11. `node scripts/validate-agent-workspace.mjs` y
    `node scripts/sync-master-spec.mjs --check`
12. `git diff --check` y `pnpm format:check`

Un gate no corrido se reporta como no corrido.

## 10. Terminología de rondas

Para que ningún documento quede ambiguo:

```text
Mathematics Remediation Round 1          — DONE   (14 contratos)
Independent Mathematics Re-Audit Round 1 — FAILED (13/14 + 3 hallazgos nuevos)
Post-Re-Audit Findings Adjudication      — DONE   (este contrato)
Targeted Mathematics Remediation Round 2 — NEXT
Independent Mathematics Re-Audit Round 2 — PENDING
AI Mathematics Department Provisional Sign-Off — BLOCKED
Human Mathematics Department Review      — DEFERRED
```

**Prohibido** escribir «la remediación matemática está DONE» sin decir «ronda 1», y
**prohibido** marcar la re-auditoría de la ronda 1 como PASSED.

## 11. Definición de terminado de la ronda 2

```text
[ ] WP-RA-AUDIT primero, con los dos hallazgos reproducidos ANTES de corregir
[ ] matriz de cobertura de las 42 Templates, ninguna fila sin categoría
[ ] RS-RA-001: dirección correcta en [0,120] × 26 variantes
[ ] RS-RA-002: K <= 65 y S <= 35 % por enumeración exhaustiva
[ ] RS-RA-003: K <= 65, S <= 35 %, >= 3 ordenaciones por margen por minuto
[ ] RS-RA-TEST-001: pnpm verify verde tres veces seguidas
[ ] los 14 contratos de la ronda 1 en regresión verde
[ ] score perfecto 10 000, escalera y FairScore sin tocar
[ ] motor, action log y snapshot sin subir
[ ] catálogos republicados una sola vez, integridad y rebuild byte a byte
[ ] replay, reanudación y recomputación de servidor en verde
[ ] documentación, errata y gobernanza actualizadas
[ ] banderas humanas H-6 a H-10 registradas
[ ] todo STOP documentado con sus números
```
