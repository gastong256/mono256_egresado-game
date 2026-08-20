---
name: egresado-implementation
description: Implementar o modificar una feature acotada de Egresado siguiendo contexto, plan, codigo, tests, documentacion y review. Usar para trabajo de aplicacion ya autorizado; no usar para decidir nuevas reglas de producto ni para scaffolding no solicitado.
---

# Implementacion de Egresado

Segui [el workflow de desarrollo](../../../docs/08-engineering/ai-development-workflow.md).

1. Delimita el resultado solicitado y el gate de producto. Usa [el context map](../../../docs/08-engineering/context-map.md) antes de disenar.
2. Inspecciona codigo, tests, consumidores, schemas, lockfile y scripts existentes. Preserva cambios ajenos.
3. Para Next.js, lee la guia relevante en `node_modules/next/dist/docs/` cuando esa ruta exista; si no, usa la documentacion oficial de la version instalada. Para otra libreria, verifica la API instalada.
4. Expone cualquier decision faltante. No fijes scoring, seed strategy, identidad/retencion, contrato persistente o frontera arquitectonica dentro del feature.
5. Planifica e implementa el cambio coherente mas pequeno respetando engine/UI/content/server/persistence.
6. Agrega tests proporcionales: unit/property para core y contenido; integration para API/DB; E2E/accesibilidad para flujos visibles.
7. Ejecuta scripts canonicos del lockfile y gates de la [Definition of Done](../../../docs/06-delivery/definition-of-done.md). Diagnostica fallos antes de concluir.
8. Actualiza requisitos, trazabilidad, docs o ADR solo cuando el comportamiento/decision cambie.
9. Revisa el diff por determinismo, trust boundaries, privacidad de menores, replay/versionado, red dentro del loop y dependencias nuevas.

Entrega archivos cambiados, conducta obtenida, decisiones documentales, comandos/resultados y cualquier gate omitido. No declares una verificacion que no ejecutaste.
