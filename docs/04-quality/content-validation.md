# Validación de contenido

## Pipeline propuesto

```mermaid
flowchart LR
    D[Draft] --> S[Schema validation]
    S --> M[Math verification]
    M --> G[Generative tests]
    G --> E[Editorial review]
    E --> P[Playtest]
    P --> R[Production ready]
```

## Validación estática

- schema JSON/TS correcto;
- IDs únicos;
- interaction type existente;
- categorías válidas;
- unidad declarada;
- feedback definido;
- tags de año/dificultad.

## Validación matemática

Para cada instancia o rango:
- resolver mediante solver/evaluator interno;
- enumerar soluciones cuando sea viable;
- confirmar función objetivo;
- comprobar tolerancias;
- verificar redondeo;
- comprobar que distractores no son equivalentes.

## Validación procedural

Ejecutar N seeds por template. Valor inicial recomendado: 1.000 para templates simples; mayor si el espacio paramétrico es amplio.

Recolectar:
- min/max parámetros;
- cantidad de soluciones;
- dificultad estimada;
- tamaño de textos generados;
- distribución de opción óptima.

Evitar que la opción correcta caiga sistemáticamente en la misma posición.

## Validación editorial

- contexto entendible sin explicación externa;
- texto breve;
- objetivo concreto;
- unidades visibles;
- ningún dato esencial escondido accidentalmente;
- datos irrelevantes sólo cuando son intencionales;
- tono apropiado.

## Validación en UI

- cabe en 360 px;
- no overflow con números máximos;
- formato de moneda/unidades consistente;
- gráficos legibles;
- estados de error visibles.

## Playtest

> **Antes de la feria, esta etapa es prueba proxy.** La primera exposición a estudiantes del rango objetivo es la feria misma; la validación formal previa es la del Departamento de Matemática. Ver [ciclo de entrega real](../00-product/real-delivery-lifecycle.md) y [gates docentes](../06-delivery/teacher-gates.md). Las preguntas siguen sirviendo con un adulto que juegue sin asistencia verbal; lo que no se puede es llamar validado a lo que se observó así.

Preguntas al observador:
- ¿el jugador supo qué debía hacer?
- ¿qué cálculo/modelo usó?
- ¿entendió el feedback?
- ¿discutió la decisión?
- ¿pareció un ejercicio escolar tradicional?

Un challenge con matemática correcta pero gameplay pobre no está listo.

## Del desafío al catálogo

Este pipeline editorial valida **un desafío**. Desde STAGE-03, el pipeline de [ADR-020](../03-architecture/adr/ADR-020-variant-generation-and-approved-catalog.md) agrega sobre la población concreta invariantes transversales, chequeos matemáticos por plantilla, fingerprint canónico, deduplicación, integridad del catálogo y auditoría estadística. Eso ya se aplica al catálogo aprobado de desarrollo vigente `grade-7-dev-5`, que además alimenta gameplay; conserva las 159 entradas de `dev-4` y suma 26 variantes de recuperación bajo `contentVersion 0.9.0-grade-7`.

Una plantilla ordinaria no queda incompleta por declarar `none`: el ruteo de recuperación se decide por plantilla y debe tener una razón pedagógica. Cuando declare recovery, se valida como contenido aprobado y debe aislar matemática relevante al error de origen. El [contrato de auditoría posterior a 1.º](post-grade-1-scalability-audit.md) ejerce explícitamente `classroom-layout` y `rehearsal-schedule` fallidas dentro de una etapa y verifica que el único repaso estructural siga siendo coherente; no anticipa la solución de authoring.

La comparabilidad por bandas y la auditoría determinista del armado de runs están implementadas desde STAGE-05; STAGE-06 agregó el score competitivo candidato y su auditoría reducida. Todavía faltan la calibración docente/empírica y el congelamiento del catálogo oficial de feria; no se deducen de que una población sea matemáticamente válida, de que su carga estructural sea pareja ni de que una fórmula cumpla sus invariantes. Ver [validación y auditoría de variantes](variant-validation-and-audit.md), [auditoría de equidad competitiva](competition-fairness-audit.md), [ADR-022](../03-architecture/adr/ADR-022-difficulty-model-and-run-composer.md) y [ADR-023](../03-architecture/adr/ADR-023-competitive-score-policy.md).

## Full-Career Cross-Content Audit

**Estado: NEXT · PLANNED · NOT EXECUTED.** Es el siguiente trabajo canónico
de STAGE-08 / Phase 0 tras el checkpoint documental #2. Los cinco Template Design
Passes están `DESIGN-CANDIDATE-APPROVED`; esta aprobación individual todavía no
demuestra coherencia del conjunto.

La auditoría cruza **7.º existente + las 25 Templates futuras** de la
[matriz v0.3](../01-game-design/full-career-content-matrix.md), usando las cinco
fichas y las fuentes narrativas/competitivas. Debe revisar:

1. Cobertura matemática y piso universal; duplicación semántica entre años.
2. Diversidad de interacciones y de razonamiento; no confundir una familia de UI
   repetida con repetir el mismo problema.
3. Independencia de Equipo/Aura y distribución de Estilo.
4. Las nueve fuentes recovery-capable, sus rutas y los `none` explícitos, con
   el máximo estructural de uno y el caso posterior a 1.º preservados.
5. Clusters Intercurso, School Event y Egreso, su máximo puntuable y compatibilidad
   con colocación, dificultad y diversidad cognitiva soft.
6. Frecuencia del Project Arc: target 1–2, máximo 2 candidato y preferencia no
   consecutiva, sin volver obligatoria su presencia como desafío.
7. Neutralidad de oportunidades raras y lógica de Prestige, incluida separación
   de evidencia y cero puntos por aparición.
8. Callbacks independientes, payoff diferido y continuidad del elenco.
9. Pacing de diseño y rejugabilidad perceptible de las primeras tres runs.
10. Riesgos de autoría, especialmente `course-project-final` y
    `next-step-options`, y convergencia de carrera en 5.º.

Su reporte debe identificar hallazgos y decisiones con fuentes, conservar la
madurez candidata cuando corresponda y actualizar el estado con evidencia. No
debe presentar simulación o revisión documental como validación empírica de los
8–10 minutos ni como implementación de las políticas nuevas.

Después siguen el pase detallado de **Rare Events / Milestones / Prestige**,
**Career Epilogue v1** y la **reconciliación final de Phase 0**. Sólo entonces se
puede cerrar Phase 0 e implementar 1.º. Esta auditoría de diseño no es un nuevo
gate de recuperación ni ejecuta/reemplaza la
[auditoría de escalabilidad posterior a 1.º](post-grade-1-scalability-audit.md).
