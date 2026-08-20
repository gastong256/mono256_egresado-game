---
name: egresado-architecture-review
description: Revisar cambios propuestos de Egresado que alteren modulos, dependencias, data flow, API, persistencia, deploy, seguridad, determinismo o versionado, y decidir si requieren ADR. No activar para un detalle local y reversible sin impacto estructural.
---

# Revision de arquitectura de Egresado

## Preparacion

Lee [arquitectura general](../../../docs/03-architecture/architecture-overview.md), [registro de decisiones](../../../docs/07-reference/decision-register.md), ADRs afectados y la fila aplicable del [context map](../../../docs/08-engineering/context-map.md). Agrega NFR, threat model y especificacion funcional/gameplay si cambia una conducta observable.

## Revision

1. Describe el cambio actual/propuesto y las fronteras afectadas.
2. Comprueba los invariantes: core puro/determinista; contenido como data; gameplay local-first; browser no confiable; score oficial por replay server-side; Postgres para estado oficial; minimizacion de datos.
3. Traza dependencias y datos en ambos sentidos. Busca imports prohibidos, duplicacion de reglas, acceso directo a persistencia, red en el loop o autoridad movida al cliente.
4. Evalua determinismo y compatibilidad: inputs explicitos, RNG, acciones, versiones, checkpoint, replay y resultados historicos.
5. Evalua trust boundaries, secretos, PII/pseudonimos, rate limits, moderacion, logging y failure modes.
6. Compara con ADRs aceptados y alternativas ya rechazadas. No reabras una decision sin nueva evidencia.
7. Clasifica con [la politica de decisiones](../../../docs/08-engineering/dependency-and-decision-policy.md):
   - detalle local/reversible: implementacion normal;
   - decision duradera con trigger: ADR nuevo/actualizado;
   - cambio de producto/gameplay: documentacion funcional/ludica + trazabilidad;
   - decision sin evidencia: pregunta abierta.

## Salida

Reporta primero hallazgos concretos por severidad con referencias a archivos. Despues incluye:

- clasificacion y motivo;
- ADRs/requisitos afectados;
- tests o evidencia necesarios;
- preguntas no resueltas y gate que debe cerrarlas.

No conviertas una arquitectura deseable pero no requerida en bloqueo, ni presentes propuestas como decisiones aceptadas.
