---
name: egresado-challenge-authoring
description: Crear o revisar contenido matematico de Egresado usando interaction types existentes, parametros procedurales, evaluadores, feedback y estados editoriales. Usar para challenge templates y math review; no usar para inventar una mecanica/UI nueva sin una decision aparte.
---

# Autoria de challenges de Egresado

## Fuentes obligatorias

Lee [sistema de desafios](../../../docs/01-game-design/challenge-system.md), [guia de autoria](../../../docs/01-game-design/content-authoring-guide.md), [marco matematico](../../../docs/01-game-design/math-design-framework.md), [validacion de contenido](../../../docs/04-quality/content-validation.md) y [ADR-007](../../../docs/03-architecture/adr/ADR-007-content-as-data.md). Usa [el schema de ejemplo](../../../docs/07-reference/content-schema.example.json) como ilustracion, no como schema ejecutable definitivo hasta que P0 lo implemente.

Agrega [catalogo](../../../docs/01-game-design/challenge-catalog.md) para escenarios existentes. Para declarar `production_ready`, lee tambien [UX e interaccion](../../../docs/01-game-design/ux-interaction-design.md). Si los efectos cambian stats/flags o callbacks, agrega [reglas/scoring](../../../docs/01-game-design/rules-scoring-and-progression.md) y [narrativa](../../../docs/01-game-design/narrative-system.md). La alineacion curricular formal sigue el marco matematico y la pregunta abierta correspondiente.

## Flujo

1. Inspecciona primero el schema, evaluator, interaction adapter y content version realmente implementados. Si aun no existen, entrega solo una especificacion/draft y declara los gates bloqueados.
2. Define situacion, objetivo del personaje, datos, restricciones, accion, razonamiento matematico, soluciones, consecuencia, efectos y variantes.
3. Aplica las pruebas “sin numeros” y “no examen”. Los numeros deben cambiar la decision y el feedback debe explicar la relacion cuantitativa.
4. Reutiliza un interaction type existente. Si el objetivo exige una mecanica nueva, pausa la autoria de contenido y eleva una decision de producto/arquitectura; no escondas una pantalla ad hoc en data.
5. Declara unidades, precision interna, display/rounding, tolerancia, rangos y funcion objetivo. Reconoce soluciones alternativas validas.
6. Genera parametros desde RNG seeded, resuelve internamente, verifica invariantes y solo despues renderiza narrativa/opciones. Nunca asumas que una opcion aleatoria es correcta.
7. Prueba al menos una solucion funcional, optimo si se declara, ausencia de division por cero/equivalencias enganosas, rangos de UI y distribucion no sesgada. Usa el numero de seeds definido por el pipeline; el valor inicial sugerido para templates simples es 1.000.
8. Revisa lenguaje, sesgo, temas sensibles, humor, viewport 360 px y accesibilidad de la interaccion.
9. Avanza estado solo con evidencia: `draft` → `math_reviewed` → `playtest_ready` → `production_ready`; no saltees math review/playtest requeridos.

Entrega el artefacto, concepto/competencia, evaluator/soluciones, parametros/invariantes, tests/seeds ejecutados, estado editorial y preguntas abiertas. No declares `production_ready` si falta una revision obligatoria.
