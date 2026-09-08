# Auditoría de escalabilidad posterior a 1.º

- **Estado:** `REQUIRED · PLANNED · NOT EXECUTED`
- **Cuándo:** después de implementar contenido real de 1.º y antes de autorizar implementación amplia de 2.º–5.º
- **Resultado actual:** ninguno; el contrato está congelado, no la solución

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
→ forzar resultado que dispara obligación

y1.rehearsal-schedule
→ recovery-capable: y1.schedule-review
→ forzar resultado que dispara obligación
```

El estado debe representar dos obligaciones distintas:

```text
GEOMETRÍA / ESCALA / ENCASTRE
+
AGENDA / VENTANAS TEMPORALES
```

y mantener un máximo de una recuperación en la etapa. El diseño de 1.º debe
permitir explícitamente esa composición; no alcanza probar cada ruta por separado.

## Preguntas obligatorias

1. ¿Qué recovery se selecciona y bajo qué regla determinista —orden, prioridad, severidad, rol u otra razón explícita?
2. ¿Qué cierra semánticamente el único beat: sólo su concepto fuente, la obligación agregada de la etapa u otra cosa?
3. Si un concepto no recibe repaso directo, ¿queda como consecuencia narrativa, previa, callback posterior, sin remediación u otra representación explícita?
4. ¿El recovery elegido es matemáticamente pertinente al historial real de error?
5. ¿La solución necesitó un caso especial de motor o un hack de contenido?
6. ¿La misma regla escala a otros años con dos Templates recovery-capable?
7. ¿Un solo recovery se siente aceptable en gameplay real?
8. ¿Cuál es su costo de pacing?
9. ¿El egreso permanece garantizado?
10. ¿El recovery sigue fuera del numerador y denominador de `FairScore`, sin estrategia de farmeo?
11. ¿Replay y verificación de servidor reconstruyen la misma selección, cierre y progresión terminal?
12. ¿La decisión puede explicarse a docentes y jugadores?

## No objetivos

Phase 0 no elige entre limitar a una Template recovery-capable, consolidar
conceptos, priorizar, enviar el resto a historia/previa, permitir dos beats ni otra
arquitectura. Son hipótesis para contrastar con evidencia, no soluciones aprobadas.

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
