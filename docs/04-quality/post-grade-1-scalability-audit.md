# Auditoría de escalabilidad posterior a 1.º

- **Estado:** `REQUIRED · EXECUTED` — ejecutado el 2026-09-14 sobre `74d8bd5`, con 1.º real
- **Cuándo:** antes de autorizar implementación amplia de 2.º–5.º; cumplido
- **Resultado:** `PASS WITH REQUIRED HARDENING — RESOLVED`. Tres defectos técnicos
  acotados se corrigieron dentro del gate y ninguna decisión de producto cambió;
  el detalle está en [resultado de la ejecución](#resultado-de-la-ejecución-2026-09-14)

## Preparado por Phase 1 — no es un veredicto

El caso se puede construir sin código nuevo:

- contenido: `y1.classroom-layout → y1.scale-fit-review` y
  `y1.rehearsal-schedule → y1.schedule-review` en el catálogo `grade-1-dev-1`,
  con debriefs autorados en `grade1RecoveryContent`;
- composición: `createGrade1Dependencies(true)` juega las cinco Templates en
  cronología (aula 30 antes que agenda 40), y el plan parcial también puede
  combinar `classroom-layout` (anchor) con `rehearsal-schedule` (secundaria);
- harness: `stressCaseQualities()` y `playGrade1()` en `tests/helpers/grade-1-play.ts`
  fuerzan ambas INVALID y el resultado del Repaso;
- observables: `PublicChallengeView.review` (practicada/debriefeada),
  `recordCoverage` sobre el registro, `validateSubmittedRun` para el servidor y el
  escenario E2E `both-invalid` en `tests/e2e/grade-1.spec.ts`.

Los tests de ingeniería comprueban el mecanismo —una sola interacción, debrief
de la otra, cierre de ambas, sin recursión, egreso, replay y score neutral—. El
gate sigue exigiendo su propio reporte con relevancia pedagógica, pacing y
decisión posterior; los tests verdes no lo sustituyen.

Esta auditoría prueba con contenido real si el modelo de recuperación de STAGE-07
escala cuando una etapa contiene más de una Template recovery-capable. No reabre
de antemano el invariante aceptado en
[ADR-024](../03-architecture/adr/ADR-024-progression-recovery-and-graduation.md).

## Precondición bloqueada

```text
MAX_RECOVERIES_PER_STAGE = 1
```

El máximo estructural no es la variable bajo prueba. Se audita si un único beat
de recuperación sigue siendo semántica y pedagógicamente adecuado ante dos errores
conceptualmente distintos.

## Escenario obligatorio congelado

Construir un fixture, test o RunPlan de 1.º que contenga:

```text
y1.classroom-layout
→ recovery-capable: y1.scale-fit-review
→ forzar resultado INVALID que dispara obligación

y1.rehearsal-schedule
→ recovery-capable: y1.schedule-review
→ forzar resultado INVALID que dispara obligación
```

El estado debe representar dos obligaciones distintas:

```text
GEOMETRÍA / ESCALA / ENCASTRE
+
AGENDA / VENTANAS TEMPORALES
```

y mantener un máximo de una recuperación en la etapa. El diseño de 1.º debe
permitir explícitamente esa composición; no alcanza probar cada ruta por separado.

## Verificaciones obligatorias

La semántica aceptada en [fail-forward](../01-game-design/graduation-and-fail-forward.md)
es: recoger obligaciones → seleccionar una determinísticamente → debrief breve de
las restantes → completar un Repaso → cerrar todas. Supersede las hipótesis sin
solución preseleccionada del checkpoint #2; no concede permiso para omitir el gate.

1. Identificar el Repaso seleccionado y la política/metadata que lo eligió.
2. Distinguir concepto practicado de obligaciones sólo debriefeadas; no atribuir
   práctica interactiva a todas por el cierre conjunto de IDs.
3. Mostrar debrief pertinente y comprensible de cada obligación no seleccionada.
4. Conservar relevancia matemática y fuente aprobada del Repaso seleccionado.
5. Rechazar catálogo aprobado vacío; sin fallback no aprobado.
6. Cerrar todas las obligaciones aun si el Repaso es INVALID, sin recursión.
7. Verificar que FUNCTIONAL y fuentes con `none` no disparen review.
8. No usar hacks de motor por año/template; generalizar a otros años.
9. Medir pacing y adecuación pedagógica con interacción real, sin penalizar lentitud.
10. Mantener egreso y excluir Repaso de FairScore/Prestige; sin farmeo.
11. Replay, snapshot/resume y servidor reconstruyen selección, debrief y cierre.
12. Explicar el resultado a docentes/jugadores sin llamar deuda a la memoria.

## No objetivos

No habilitar dos Repasos, restringir artificialmente la composición para evitar
el caso ni reabrir producto por preferencia de implementación. `reviewPriority`
es recomendación editorial; su representación y los deltas de debrief siguen
[ADR-025](../03-architecture/adr/ADR-025-full-career-contract-evolution.md).
Sólo evidencia de contradicción real justificaría una revisión formal.

## Criterio de pase

La auditoría sólo pasa si el comportamiento implementado es:

- determinista, reproducible y verificable por servidor;
- pedagógicamente defendible y relevante al error;
- compatible con un recovery máximo, egreso garantizado y score neutral;
- libre de recursión y callejones sin salida;
- aceptable en pacing;
- generalizable sin hacks por año.

Si falla, se detiene la implementación amplia de 2.º–5.º y se resuelve el modelo
con la evidencia de 1.º. Tests unitarios/E2E verdes no sustituyen este gate.

## Flujo de STAGE-08

```text
Phase 0 — diseño de carrera
  ↓
Phase 1 — implementación real de 1.º
  ↓
esta auditoría obligatoria
  ↓
PASS → implementación de 2.º–5.º
FAIL → resolver fundaciones/semántica antes de escalar
```

## Resultado de la ejecución (2026-09-14)

**Veredicto: `PASS WITH REQUIRED HARDENING — RESOLVED`.** Ejecutado sobre `74d8bd5`,
con engine `7.0.0`, action log `5`, snapshot `7`, catálogo `grade-1-dev-1` y
`fair-score-dev-2` sin recalibrar. Fixtures: `stressCaseQualities()` y `playGrade1()`
con seeds `formal-multi-obligation`, `canonical-inversion`, `audit-fail-closed`,
`audit-server` y `post-g1-browser-audit`.

### Lo que se comprobó

- **Multiobligación formal.** `classroom-layout` INVALID y `rehearsal-schedule`
  INVALID en `year-1` dejan dos obligaciones con direcciones y rutas distintas, en
  orden canónico por índice de evento. El beat de recuperación presenta
  `y1.scale-fit-review`, practica la primera y debriefea la otra; ambas quedan
  resueltas en un único registro. Se repitió con las cuatro calidades del Repaso,
  incluida INVALID: el año cierra igual, no aparece un segundo Repaso, la run egresa
  y el índice de evento de la etapa no se mueve.
- **Determinismo de la selección.** Invertir el orden del arreglo no cambia la
  elegida, y `Math.random` y `Date.now` quedan prohibidos durante la selección sin
  que nadie los invoque. Invertir los índices de origen sí cambia el concepto
  practicado, que es la regla temporal declarada.
- **Escalabilidad del modelo.** 1, 2, 3, 6, 9 y 32 obligaciones de conceptos
  distintos cierran en un solo Repaso, con notas y registro lineales y la cobertura
  rederivada del registro serializado.
- **Approved-only fail-closed.** Pool aprobado vacío, ruteo a una review inexistente
  y debrief faltante fallan explícitamente al crear la run y en el borde del beat,
  dos veces con el mismo error y sin mutar el estado.
- **Servidor.** Descriptor forjado en cualquiera de sus cinco versiones, códec viejo,
  acción duplicada, faltante o reordenada, respuestas semánticas fuera de schema, un
  Repaso sin obligación y un `planFingerprint` alterado quedan rechazados. Score,
  calidad, Equipo, Estilo, carrera y egreso declarados por el cliente se ignoran.
- **Composición global.** Catálogos sintéticos con una única carrera legal, con
  muchas, y con cada restricción dura hecha imposible de a una; las preferencias
  blandas insatisfechas no impiden un plan válido. Rechazar una carrera imposible
  cuesta 14 ms con presupuesto de 50 000, 200 000 o 1 000 000 de nodos: la poda no
  depende del presupuesto.
- **Accesibilidad.** Recorrido real por `Tab` en las seis pantallas de 1.º, con foco
  visible de 2 px, objetivos de 44 px, `reduced motion`, offline y axe sin
  violaciones, a 360, 390 y 412 px y con zoom 2 sobre 1280.

### Hardening aplicado

1. **Reflow a 360 px con el plano construido.** Varios objetos en una celda se
   escriben juntos; esa cadena ensanchaba la celda, la tabla pasaba de 301 a 358 px
   y el documento a 372. La celda ahora corta el texto. El escenario
   `layout-invalid` falla sin el arreglo y pasa con él.
2. **Cobertura del propio E2E.** El reflow se medía antes de construir la respuesta,
   así que el defecto vivía en un ancho ya declarado verificado. Ahora también se
   mide con la respuesta armada.
3. **Deriva documental de reflow.** El sistema de diseño prometía 320 px cuando
   `html` declara `min-width: 360px` desde antes de 1.º. El doc dice lo que el
   producto hace y deja anotado que el criterio de WCAG mide 320 px.

### Lo que no se cambió

`MAX_RECOVERIES_PER_STAGE`, la semántica de cerrar varias obligaciones, los pesos de
FairScore, las bandas, el Estilo, el pacing, la política de composición y la copia
del Repaso siguen exactamente como estaban.

### Observaciones para 2.º–5.º

- **Costo de composición.** Componer una carrera de nueve beats cuesta unos 2,7 s con
  36 Templates sintéticas, contra milisegundos en la práctica parcial actual. El
  contrato —plan válido o fallo explícito, determinista y acotado— se cumple, pero el
  número debe volver a medirse con el catálogo real antes de componer la carrera
  oficial.
- **`g7.may-25-act` en el 100 % de las mitades de 7.º.** Es consecuencia del slice:
  sólo tres Templates son hostables y es la única con rol `special`.
- **Perfiles y Estilo.** La concentración en `leader` de las simulaciones es artefacto
  del agente aleatorio: con políticas dirigidas se alcanzan `aplicado` y `estratega`
  en 120 de 120 runs. Jugar óptimo tiende a `estratega` porque, entre las respuestas
  óptimas, los estilos existen pero no son equiprobables.
- **Estilo y orden.** `nudgeEstilo` normaliza a 100 en cada paso, así que el Estilo
  final depende del orden de los beats. No afecta FairScore, que no lo puntúa, pero
  la composición global reordena beats entre runs.

### Cierre de F-03 (2026-09-15)

El gate dejó una sola decisión de producto abierta: el piso de reflow. Producto
adoptó **320 px** como piso objetivo para la experiencia general de juego, con
excepción local para representaciones que requieren dos dimensiones por
significado. Implementado con tres cambios acotados:

- `html` declara `min-width: 320px`. La causa del piso anterior era exactamente
  esa línea —introducida como "la UX de referencia exige legibilidad a 360"— sin
  ningún token ni layout acoplado a 360.
- La tira de carrera refluye a dos filas cuando sus celdas no entran en una: era
  lo único que empujaba la página a 320 px.
- La región del plano ancla su propio desborde, así que la grilla scrollea dentro
  de su región —alcanzable por teclado— y el documento no.

A 320 px no se pierde información ni funcionalidad. Las seis pantallas de 1.º se
operan enteras por teclado, con foco visible, objetivos de 44 px y axe sin
violaciones, medidas en vacío, con la respuesta construida y en el resultado; el
slice de 7.º también se verifica a 320. El plano conserva su modelo semántico de
coordenadas y se completa con los controles de X, Y y orientación, sin que el
scroll local sea nunca la única vía. **F-03 queda cerrado y el gate no deja
decisiones de producto abiertas.**

Este reporte conserva fixture, seeds, versiones, observaciones, resultado y evidencia
de egreso, score y replay, como el propio documento exige.
