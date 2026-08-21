# Estrategia MCP

## Estado actual

El repositorio configura un único servidor MCP project-scoped: `next-devtools-mcp` `0.4.0`. Su objetivo es cerrar el loop entre una tarea Next.js y el runtime local mediante rutas, metadata, errores de compilación y estado del dev server.

La configuración versionada vive en `.codex/config.toml`:

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

El comando usa la dependencia fijada en `package.json`/`pnpm-lock.yaml`; no descarga `@latest`. `required = false` evita que una tarea sin runtime quede bloqueada, pero no habilita declarar evidencia MCP que no se obtuvo. El entorno desactiva la telemetría de Next DevTools para no enviar identificadores anónimos, hash del checkout ni métricas agregadas de herramientas desde un repositorio orientado a datos minimizados.

`package.json` fuerza temporalmente `@modelcontextprotocol/sdk` `1.26.0` porque `next-devtools-mcp` `0.4.0` fija una versión afectada por un advisory alto. La excepción es un parche de supply chain, no una API elegida por la aplicación. Retirarla sólo cuando una versión upstream corregida pase `pnpm security:audit` y una llamada MCP real contra el dev server.

## Onboarding y trust

Codex ignora la capa `.codex/` de un proyecto no confiable. Cada desarrollador debe:

1. instalar con Node.js `24.19.0` y pnpm `11.22.0`:

   ```bash
   pnpm install --frozen-lockfile
   ```

2. confiar este checkout desde el prompt/UI de Codex o registrar personalmente su ruta absoluta en la configuración de usuario;
3. cerrar y abrir una **sesión nueva de Codex** para que descubra la configuración project-scoped;
4. arrancar Next.js en otra terminal:

   ```bash
   pnpm dev
   ```

5. comprobar el registro:

   ```bash
   codex mcp list
   ```

El trust es local a la máquina. El repositorio no debe editar `~/.codex/config.toml`, versionar una ruta absoluta ni reducir permisos/approvals del usuario.

Cuando `.codex/config.toml`, el lockfile o el trust cambian durante una sesión ya abierta, recargar no siempre alcanza: iniciar una sesión nueva es el procedimiento canónico.

## Workflow de uso

Para una tarea Next.js:

1. leer `AGENTS.md` y la guía relevante de `node_modules/next/dist/docs/`;
2. iniciar `pnpm dev` y esperar el readiness del servidor;
3. usar el índice MCP para localizar el proyecto activo;
4. consultar rutas/metadata y errores de compilación antes y después del cambio;
5. abrir la ruta afectada si la herramienta de browser disponible aporta evidencia;
6. ejecutar tests, typecheck, lint y build aplicables;
7. reportar por separado evidencia runtime MCP y gates de repositorio.

El MCP no reemplaza `pnpm verify`, Playwright, tipos, documentación instalada ni revisión del diff.

## Verificación observada de la baseline

Con Next.js `16.3.1`, `next-devtools-mcp` `0.4.0` y `pnpm dev` activo se verificó localmente:

- discovery del proyecto y su URL;
- rutas `/`, `/api/health` y `/manifest.webmanifest`;
- metadata de layout/page;
- ausencia de errores de configuración y de sesión;
- ausencia de errores de compilación.

También se comprobó que `codex mcp list` registra `next-devtools` como enabled. Una sesión de Codex ya abierta antes de crear `.codex/config.toml` no incorpora automáticamente el servidor; por eso el onboarding exige sesión nueva.

## Caveat de `args` en `0.4.0`

La versión verificada anuncia en el wrapper `nextjs_call` un campo `args` con schema de string, pero el runtime observado espera un objeto estructurado. Si una llamada falla al enviar JSON serializado, pasar un objeto, por ejemplo `{}`, en lugar de la cadena `"{}"`.

Este workaround es específico de `0.4.0` y no debe convertirse en contrato del proyecto. Después de actualizar `next-devtools-mcp`, volver a inspeccionar el schema expuesto y probar una llamada real; retirar la nota cuando upstream alinee schema y runtime.

## Troubleshooting

### El servidor no aparece

- confirmar que el checkout está trusted;
- confirmar `pnpm exec next-devtools-mcp --help` o el arranque mediante Codex sin usar `@latest`;
- ejecutar `codex mcp list`;
- abrir una sesión nueva después de cualquier cambio de trust/config;
- verificar que `node_modules` corresponde al lockfile.

### Aparece, pero no encuentra la aplicación

- ejecutar `pnpm dev` desde la raíz;
- abrir `http://localhost:3000/api/health`;
- no iniciar el MCP desde otro checkout;
- revisar que no haya otro dev server ocupando el puerto/proyecto esperado.

### La tool call rechaza `args`

Aplicar el caveat de objeto estructurado anterior y registrar versión/comando exactos. No editar dependencias instaladas como fix permanente.

### El MCP falla o queda lento

Continuar con docs instaladas y comandos de repositorio; `required = false` permite ese modo degradado. Reportar que la evidencia MCP se omitió. Si el problema es reproducible, evaluar upgrade/remoción en un cambio separado.

## Límites y criterios para nuevas integraciones

- MCP complementa la documentación versionada; no la reemplaza.
- No agregar servidores genéricos si los archivos del repositorio o docs instaladas resuelven el caso.
- No incluir tokens ni secretos en configuración versionada.
- Cada servidor necesita una tarea repetida concreta, herramientas acotadas, ownership, versión controlada, prueba de conexión y procedimiento de deshabilitación.
- No agregar integraciones SaaS, browser MCP adicional o acceso de escritura externo por conveniencia.
- Eliminar o deshabilitar el servidor si deja de reducir un loop real de desarrollo.

## Fuentes oficiales

- [Codex: Model Context Protocol](https://learn.chatgpt.com/docs/extend/mcp)
- [Codex: configuración y precedencia](https://learn.chatgpt.com/docs/config-file/config-basic)
- [Next.js: AI coding agents](https://nextjs.org/docs/app/guides/ai-agents)
- [Next.js: MCP server](https://nextjs.org/docs/app/guides/mcp)

Para Next.js prevalecen las mismas guías incluidas en `node_modules/next/dist/docs/` por la versión fijada.
