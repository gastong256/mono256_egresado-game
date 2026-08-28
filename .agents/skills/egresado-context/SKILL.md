---
name: egresado-context
description: Enrutar una tarea de Egresado al conjunto minimo de documentacion autoritativa de producto, gameplay, contenido, arquitectura, datos, seguridad, calidad u operacion. Usar antes de planificar trabajo cuyo comportamiento o fronteras dependan de decisiones del proyecto.
---

# Contexto de Egresado

1. Confirma la raiz del repositorio, `git status` y los `AGENTS.md` aplicables.
2. Si la tarea es trabajo funcional del Blueprint, lee [la etapa actual](../../../docs/06-delivery/current-stage.md) y el contrato de esa etapa en [el roadmap](../../../docs/06-delivery/implementation-sequence.md) antes que nada mas. Su **Scope OUT** es vinculante.
3. Clasifica la tarea con [el context map](../../../docs/08-engineering/context-map.md). Lee la fila mas estrecha y suma solo las fronteras que el cambio cruza.
4. Lee [la autoridad documental](../../../docs/README.md#autoridad-documental) y los ADRs aplicables. Usa archivos individuales; el master consolidado no reemplaza las fuentes.
5. Revisa [preguntas abiertas](../../../docs/07-reference/open-questions.md) si la tarea toca scoring, dificultad, seed strategy, identidad, replay, retencion, feria u otra decision no cerrada.
6. Consulta [el registro de decisiones](../../../docs/07-reference/decision-register.md) para saber si lo que vas a escribir es una decision cerrada, una recomendacion configurable o algo que requiere aprobacion del Departamento de Matematica. Una constante `RECOMENDADA` o `TEACHER GATE` no se escribe como numero magico: se escribe como politica versionada.
7. Si la tarea toca una capacidad futura, separa presente de objetivo con [la arquitectura objetivo del motor](../../../docs/03-architecture/target-engine-architecture.md); [game engine](../../../docs/03-architecture/game-engine.md) describe lo implementado.
8. Inspecciona despues la implementacion, tests, lockfile y version instalada relevantes.

Si la tarea cruza modulos, datos, seguridad, runtime o compatibilidad, aplica tambien [la politica de decisiones](../../../docs/08-engineering/dependency-and-decision-policy.md) y los criterios de revision arquitectonica; no la trates como un cambio local por comodidad.

Antes de planificar, deja una nota corta con:

- fuentes consultadas;
- invariantes que restringen la tarea;
- decisiones aceptadas aplicables;
- supuestos o preguntas que siguen abiertas.

Si la precedencia no resuelve una contradiccion, no elijas una conducta. Limita el trabajo a lo decidido y registra/actualiza la pregunta abierta cuando la tarea autorice cambios documentales.
