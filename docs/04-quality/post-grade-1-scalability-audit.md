# Auditoría de escalabilidad posterior a 1.º

- **Estado:** `REQUIRED · PLANNED · NOT EXECUTED`
- **Cuándo:** después de implementar contenido real de 1.º y antes de autorizar implementación amplia de 2.º–5.º
- **Resultado actual:** ninguno; semántica de producto cerrada, implementación/pedagogía por validar

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

El reporte de ejecución futuro debe conservar fixture/seed/versiones, observaciones,
resultado `PASS` o `FAIL`, decisión posterior y evidencia de egreso, score y replay.
