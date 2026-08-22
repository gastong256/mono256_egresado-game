# Arquitectura del workspace agentivo

Fecha de baseline: **20 de agosto de 2026**.

## Resultado

El workspace combina reglas durables, contexto progresivo, workflows repetibles y evidencia del runtime real:

```text
AGENTS.md                         reglas de repositorio + bloque administrado por Next.js
docs/AGENTS.md                    reglas exclusivas de mantenimiento documental
docs/08-engineering/
  context-map.md                  router hacia fuentes autoritativas
  ai-development-workflow.md      ciclo de trabajo y quality gates
  dependency-and-decision-policy.md
  development-environment.md      toolchain y operación local ejecutable
  mcp-strategy.md                 Next DevTools MCP, trust y troubleshooting
  agent-setup.md                  esta explicación
.agents/skills/
  egresado-context/
  egresado-implementation/
  egresado-architecture-review/
  egresado-quality-gate/
  egresado-challenge-authoring/
  egresado-design-system/
.codex/config.toml                MCP project-scoped, fijado por lockfile
.github/
  workflows/quality.yml           CI de toolchain, docs, calidad, build y E2E
  dependabot.yml                  updates semanales de npm, Actions y Docker
scripts/
  check-secrets.mjs               scanner de patrones de credenciales de alta señal
  check-toolchain.mjs             alinea Node/pnpm entre metadata y Docker
  local-docker-network.mjs        red loopback compartida por Supabase/Compose
  local-supabase-status.mjs       status local sin exponer credenciales
  reset-local-database.mjs        reset local sobre la red fijada
  run-pnpm.mjs                    subprocess pnpm portable sin depender de .cmd
  start-compose.mjs               desarrollo Docker sobre la red local
  start-local-supabase.mjs        arranque mínimo con credenciales redactadas
  write-local-env.mjs             genera .env.local con valores redactados
  markdown-links.mjs
  sync-master-spec.mjs
  validate-agent-workspace.mjs
  verify.mjs                      gate ejecutable de la aplicación
```

La base de aplicación ya existe. Incluye shell Next.js, tests, Docker y Supabase local opcional, pero no contiene gameplay, Auth, schema de juego, ranking ni infraestructura externa desplegada.

## Qué carga Codex y cuándo

| Capa | Carga | Función |
|---|---|---|
| `AGENTS.md` de raíz | al iniciar en el repo | autoridad, protocolo previo, invariantes y gates |
| `docs/AGENTS.md` | al trabajar bajo `docs/` o cuando el protocolo exige leerlo | jerarquía, ADRs, trazabilidad, master y checklist |
| nombre/descripción de skills | durante discovery | selección de workflow por intención |
| cuerpo de `SKILL.md` | cuando la skill se invoca o coincide | routing, implementación, review, calidad o autoría |
| fuentes de `docs/` | bajo demanda mediante el context map | reglas completas sin inflar el prompt permanente |
| docs en `node_modules/next/dist/docs/` | antes de una tarea Next.js | API y convenciones exactas de Next.js `16.3.1` |
| `.codex/config.toml` | al iniciar una sesión confiable | registra `next-devtools` mediante el pnpm fijado |
| runtime MCP | con `pnpm dev` activo | rutas, metadata y errores reales del dev server |

Esta separación evita que resúmenes generados compitan con fuentes autoritativas. MCP agrega observación; no reemplaza documentación, tipos, tests ni ADRs.

## Instrucciones y bloque de Next.js

Las reglas propias de Egresado viven fuera de los marcadores administrados al final de `AGENTS.md`. Next.js `16.3.1` agrega o repara ese bloque al ejecutar `next dev`; conservarlo evita un diff recurrente y obliga a consultar las docs instaladas antes de escribir código Next.js.

`docs/AGENTS.md` está justificado porque sincronización del master, registro de ADRs, trazabilidad y estados de decisión sólo aplican al subtree documental.

## Skills del repositorio

- `egresado-context`: clasifica una tarea y carga el conjunto mínimo de documentación.
- `egresado-implementation`: aplica contexto → plan → cambio → tests → docs → review a una feature acotada.
- `egresado-architecture-review`: revisa fronteras, datos, dependencias, NFR y necesidad de ADR.
- `egresado-quality-gate`: selecciona y ejecuta gates reales, diagnostica fallos y reporta evidencia.
- `egresado-challenge-authoring`: enruta contenido-as-data, matemática, invariantes procedurales y estados editoriales sin habilitar mecánicas nuevas.
- `egresado-design-system`: dirige cualquier trabajo de interfaz hacia los tokens y las primitivas existentes antes de inventar un patrón visual.

Las skills viven en `.agents/skills/` y enlazan fuentes mantenidas del proyecto. Su frontmatter se valida tanto con el checker portable del repositorio como con `quick_validate.py` de la skill oficial `skill-creator` cuando se crean o modifican.

## Next DevTools MCP

`.codex/config.toml` registra `next-devtools-mcp` `0.4.0` mediante:

```toml
[mcp_servers.next-devtools]
command = "pnpm"
args = ["exec", "next-devtools-mcp"]
startup_timeout_sec = 20
tool_timeout_sec = 60
enabled = true
required = false

[mcp_servers.next-devtools.env]
NEXT_TELEMETRY_DISABLED = "1"
```

La dependencia está fijada en `package.json`/`pnpm-lock.yaml`; no usa `@latest`. `required = false` permite trabajar en documentación o código puro si el dev server no está disponible. El entorno versionado también desactiva la telemetría del MCP para conservar la minimización de datos del proyecto.

Cada desarrollador debe confiar el checkout y abrir una sesión nueva después de instalar o cambiar la configuración. El procedimiento verificable y el caveat observado del argumento `args` están en [mcp-strategy.md](mcp-strategy.md).

No hay tokens, URLs de servicios externos ni paths absolutos versionados en `.codex/config.toml`. El trust es una decisión local de cada máquina.

## Calidad y mantenimiento

El gate canónico de aplicación es:

```bash
pnpm verify
```

Valida alineación de Node/pnpm/Docker, infraestructura agentiva, master documental, formato, fronteras, tipos, cobertura, build y E2E. El check focalizado es `pnpm toolchain:check`; los workflows de DB, Docker y release se documentan en [development-environment.md](development-environment.md).

GitHub Actions ejecuta además `pnpm toolchain:check`, `node scripts/validate-agent-workspace.mjs` y `node scripts/sync-master-spec.mjs --check` antes de los gates de aplicación. Así CI valida la documentación/infraestructura agentiva y no sólo el bundle.

Mantenimiento esperado:

- mantener `AGENTS.md` compacto y mover detalle condicional a docs o skills;
- actualizar una skill por fallos observados, no por escenarios especulativos;
- conservar sincronizados Node/pnpm en metadata, CI, Docker y documentación;
- revisar docs bundladas y MCP después de cada upgrade de Next.js;
- regenerar el master sólo desde sus fuentes individuales;
- no fijar modelos, permisos o preferencias personales en configuración compartida;
- no agregar MCPs ni roles custom sin un loop repetido, ownership y verificación concreta.

## Decisiones explícitamente diferidas

- Auth y adopción de `@supabase/ssr`;
- schema ejecutable de juego/contenido y datos reales;
- service worker y caching PWA avanzado;
- providers de observabilidad/analytics;
- browser MCP adicional o integraciones SaaS;
- roles custom de subagente;
- deploy público, bloqueado además por `pnpm release:check` hasta Next.js `16.3.2+`.

Estas ausencias son límites de alcance, no placeholders que una tarea técnica pueda completar sin decisiones de producto, seguridad o arquitectura.

## Fuentes oficiales de la configuración agentiva

- [Codex: AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Codex: Skills](https://learn.chatgpt.com/docs/build-skills)
- [Codex: configuración](https://learn.chatgpt.com/docs/config-file/config-basic)
- [Codex: Model Context Protocol](https://learn.chatgpt.com/docs/extend/mcp)
- [Next.js: AI coding agents](https://nextjs.org/docs/app/guides/ai-agents)
- [Next.js: MCP server](https://nextjs.org/docs/app/guides/mcp)

Las rutas oficiales pueden evolucionar; para comportamiento de Codex prevalece el manual actual, y para APIs Next.js prevalecen las docs incluidas por la versión instalada.
