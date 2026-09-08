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
