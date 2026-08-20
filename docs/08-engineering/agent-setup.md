# Arquitectura del workspace agentico

Fecha de investigacion y configuracion: **20 de agosto de 2026**.

## Resultado

El setup separa contexto permanente, routing y workflows repetibles:

```text
.gitattributes                     finales LF estables para docs, skills y scripts
AGENTS.md                         reglas durables para todo el repo
docs/AGENTS.md                    reglas exclusivas de mantenimiento documental
docs/08-engineering/
  context-map.md                  router hacia fuentes autoritativas
  ai-development-workflow.md      ciclo de trabajo y criterio de ADR
  dependency-and-decision-policy.md
  mcp-strategy.md
  agent-setup.md                  esta explicacion y evidencia
.agents/skills/
  egresado-context/
  egresado-implementation/
  egresado-architecture-review/
  egresado-quality-gate/
  egresado-challenge-authoring/
scripts/
  markdown-links.mjs              parser compartido de links Markdown para ambos gates
  sync-master-spec.mjs
  validate-agent-workspace.mjs
```

No se creo aplicacion, schema productivo, UI, game state, challenge logic, ranking ni infraestructura externa.

## Que carga Codex y cuando

| Capa | Carga | Funcion |
|---|---|---|
| `AGENTS.md` de raiz | Automaticamente al iniciar en el repo | Autoridad, protocolo previo, invariantes, politica de decisiones y gates |
| `docs/AGENTS.md` | Automaticamente si la sesion inicia con CWD bajo `docs/`; desde la raiz, el protocolo previo exige leerlo antes de modificar ese subtree | Jerarquia, ADRs, trazabilidad, master derivado y checklist |
| Nombre/descripcion de skills | En discovery, con presupuesto acotado de contexto | Permite seleccionar un workflow por intencion |
| Cuerpo de `SKILL.md` | Solo cuando la skill se invoca o coincide con la tarea | Routing, implementacion, review, calidad o autoria concreta |
| Documentos fuente | Bajo demanda mediante el context map | Reglas completas sin duplicarlas en prompts permanentes |
| Docs Next.js instaladas | Bajo demanda para tareas Next.js | API y convenciones de la version real del lockfile |

Esta division evita un `AGENTS.md` gigante y evita que resumenes generados compitan con las fuentes autoritativas.

## Skills creadas

- `egresado-context`: clasifica una tarea y carga el conjunto minimo de documentacion antes de planificar.
- `egresado-implementation`: aplica el ciclo contexto → plan → cambio → tests → docs → review para una implementacion acotada.
- `egresado-architecture-review`: revisa fronteras, datos, dependencias, NFR y ADRs; diferencia detalle local de decision arquitectonica.
- `egresado-quality-gate`: elige y ejecuta gates por tipo de cambio, diagnostica fallos y reporta evidencia exacta.
- `egresado-challenge-authoring`: usa el workflow ya estable de contenido-as-data, matematica, invariantes y estados editoriales; no habilita inventar nuevas mecanicas.

Las skills viven en `.agents/skills`, la ubicacion repository-scoped documentada actualmente por Codex. No necesitan referencias copiadas: enlazan documentos mantenidos del proyecto.

Cada `SKILL.md` fue validado con `quick_validate.py` provisto por la skill oficial `skill-creator`, ademas del checker portable del repositorio. El checker local admite deliberadamente solo el frontmatter compartido de dos escalares YAML simples (`name` y `description`); la validacion oficial sigue siendo el gate para sintaxis o metadata futura mas amplia.

`.gitattributes` fija LF para Markdown, scripts y datos textuales. Esto mantiene reproducibles el frontmatter de skills y el master generado aun cuando el checkout use otra configuracion local de line endings.

## Decisiones de setup

### `docs/AGENTS.md` si esta justificado

La documentacion tiene reglas locales que no deben ocupar contexto en una tarea de codigo: sincronizacion del master derivado, registro de ADRs, trazabilidad, estados de decision y checklist. Por eso existe una capa anidada solo para `docs/`.

### Sin `.codex/config.toml` por ahora

No hay un setting seguro necesario que mejore el repo hoy:

- no se fija modelo ni reasoning del usuario;
- no se cambia sandbox ni approvals;
- multi-agent es estable y ya esta habilitado por defecto;
- las skills tienen discovery propio;
- no existe todavia un MCP de runtime util.

Agregar un archivo vacio o flags redundantes aumentaria superficie de mantenimiento. La configuracion se creara en la fase de aplicacion solo si contiene un MCP u otro comportamiento project-scoped real y validable.

### Sin roles custom de subagente

Los subagentes actuales son estables y utiles para exploracion, tests y reviews independientes. No se fijan roles/modelos en config porque las cinco skills ya definen los criterios especializados, y un modelo de equipo impuesto duplicaria instrucciones y preferencias personales. Una tarea puede delegar revisiones acotadas usando el contexto de esas skills.

### Sin MCP instalado

El unico candidato justificado es Next.js DevTools MCP, pero necesita Next.js 16+, un dev server y una dependencia/command fijados. Se difiere segun [mcp-strategy.md](mcp-strategy.md).

### Challenge authoring incluido

La skill se crea ahora porque el repositorio ya define plantilla, patrones de interaccion, progresion matematica, invariantes procedurales, estados editoriales, validacion y un schema ilustrativo. La skill enruta a esas fuentes; no congela el schema ilustrativo como contrato ejecutable.

## Investigacion oficial

Se uso el manual oficial actualizado de Codex y se contrasto con el CLI instalado (`codex-cli 0.148.0-alpha.21`). Solo se adoptaron superficies marcadas estables o documentadas:

- [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md): discovery desde raiz a CWD, precedencia de instrucciones mas cercanas y limite de contexto; justifica raiz compacta + capa `docs/`.
- [Build skills](https://learn.chatgpt.com/docs/build-skills): `.agents/skills`, metadata `name`/`description`, activacion explicita/implicita y progressive disclosure.
- [Config basics](https://learn.chatgpt.com/docs/config-file/config-basic): `.codex/config.toml` project-scoped solo para proyectos confiables y precedencia sobre config de usuario.
- [Permissions](https://learn.chatgpt.com/docs/permission-modes): sandbox y approvals son limites distintos; este setup no los reduce ni fija permisos en el repositorio.
- [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents): multi-agent estable por defecto y recomendado para trabajo paralelo independiente, especialmente lectura/review.
- [MCP](https://learn.chatgpt.com/docs/extend/mcp): configuracion por proyecto en `.codex/config.toml`, servidores stdio/HTTP y trust requerido.
- [Best practices](https://learn.chatgpt.com/guides/best-practices): contexto acotado, instrucciones durables, tests/review y automatizacion de workflows estables.
- [Next.js AI coding agents](https://nextjs.org/docs/app/guides/ai-agents): la version 16.3.1 documentada incluye docs versionadas en `node_modules/next/dist/docs/` y un bloque administrado de `AGENTS.md` que preserva contenido externo.
- [Next.js MCP](https://nextjs.org/docs/app/guides/mcp): Next.js 16+ expone estado del dev server mediante `next-devtools-mcp`.

Tambien se verifico localmente que `multi_agent` figura estable/activo, que el CLI puede renderizar el prompt efectivo y que no existe scaffold/package manager en este repo. La version futura instalada de Next.js, no esta captura de investigacion, gobernara el codigo.

## Mantenimiento

- Mantener la raiz corta; mover detalle condicional a context map, workflow o una skill.
- Mejorar una skill por fallos observados, no por escenarios especulativos.
- Al agregar/mover docs, actualizar README, manifest y checklist; sincronizar el master si la fuente pertenece a `00-07` o es README/checklist.
- Al crear tooling real, reemplazar gates provisionales por scripts canonicos en el package manager y actualizar `egresado-quality-gate`.
- Al instalar Next.js, conservar el bloque administrado, verificar docs bundladas y revisar la estrategia MCP.
- Al cerrar una pregunta abierta, actualizar la fuente autoritativa, trazabilidad y ADR si corresponde; no dejar solo una nota de implementacion.

## Diferido intencionalmente a la fase de aplicacion

- scaffold y lockfile;
- bloque `AGENTS.md` administrado por la version instalada de Next.js;
- comandos lint/typecheck/test/build/E2E reales;
- Next.js DevTools MCP y cualquier browser MCP;
- configuracion `.codex/config.toml` y trust local asociado;
- schemas ejecutables y pipeline de validacion de contenido;
- roles custom de subagente, salvo que un workflow repetido demuestre su valor.
