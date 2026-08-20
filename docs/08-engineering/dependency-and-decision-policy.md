# Politica de dependencias y decisiones

## Dependencias

- Agrega una dependencia solo para satisfacer un requisito actual y verificable.
- Prefiere capacidades de la plataforma o framework antes que paquetes redundantes.
- Prefiere paquetes mantenidos, tipados, ampliamente adoptados y compatibles con las versiones instaladas.
- Verifica API y compatibilidad contra el lockfile, tipos y documentacion de la version instalada; no contra memoria del modelo.
- Evita librerias solapadas que resuelvan la misma responsabilidad.
- No agregues dependencias especulativas “para despues”. Eliminalas cuando queden sin uso.
- El lockfile es autoritativo para versiones y package manager. Instalaciones y CI deben respetarlo.
- No redisenes la arquitectura para acomodar una libreria de conveniencia.
- Dependencias sensibles —auth, criptografia, parsing de contenido no confiable, base de datos, telemetria o tooling con ejecucion— requieren revision adicional de permisos, mantenimiento, advisories, transitivas y superficie cliente/servidor.
- Un MCP o herramienta de agente tambien es una dependencia operativa: debe tener un caso de uso, alcance, version y politica de secretos claros.

Antes de agregar una dependencia, registrar en el plan o diff review: requisito que resuelve, alternativa nativa considerada, compatibilidad comprobada, superficie donde se ejecuta y gate que demuestra su uso.

## Regla de decision

| Tipo | Donde se decide | Evidencia minima |
|---|---|---|
| Eleccion local y reversible de implementacion | Codigo + review normal | Tests y diff; documentacion solo si cambia una interfaz mantenida |
| Eleccion estructural duradera | ADR + registro de decisiones | Alternativas, consecuencias, NFR/trust boundaries y migracion/compatibilidad |
| Regla de producto o juego | Documento autoritativo correspondiente | Requisito/GDD/reglas, historia o backlog y matriz de trazabilidad cuando aplique |
| Pregunta de producto sin evidencia | Registro de preguntas abiertas | Gate o evidencia necesaria para cerrarla; no implementar una respuesta por defecto |
| Cambio de contenido sobre mecanica existente | Definicion de contenido + pipeline editorial/matematico | Schema, evaluador, invariantes, seeds y playtest requerido |

## Trigger de ADR

Un ADR es obligatorio si la decision cruza modulos, es costosa de revertir, cambia una NFR importante, proveedor/plataforma, seguridad/privacidad o compatibilidad de runs. No hace falta un ADR para cada paquete o helper; si una dependencia cambia una de esas propiedades, deja de ser una eleccion local.

## Cambios de version

- Una actualizacion de seguridad compatible no requiere ADR por si sola, pero si lockfile, tests y revision del changelog/advisory relevante.
- Una actualizacion que cambia APIs, rendering, persistencia, RNG, scoring, runtime, despliegue o soporte de navegadores requiere analizar documentacion de migracion y puede requerir ADR.
- Nunca reinterpretar una run historica con un ruleset/content/engine incompatible. La estrategia definitiva de artefactos historicos permanece en [open-questions.md](../07-reference/open-questions.md).
