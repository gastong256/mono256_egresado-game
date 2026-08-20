# Estrategia MCP

## Estado de esta fase

No se instala ni configura ningun servidor MCP en esta fase. El repositorio todavia no tiene aplicacion Next.js, `package.json`, lockfile ni dev server; por lo tanto un MCP de runtime no puede aportar evidencia y agregaria una dependencia prematura.

Tampoco se crea `.codex/config.toml` vacio. Codex ya descubre `AGENTS.md` y `.agents/skills` sin configuracion adicional, y multi-agent es una capacidad estable habilitada por defecto en la version inspeccionada.

## Integracion justificada para la fase de scaffold

Cuando Next.js este instalado:

1. Fijar Next.js y el package manager en el lockfile.
2. Ejecutar `next dev` y conservar el bloque administrado por Next.js que agregue a `AGENTS.md`; las reglas de Egresado deben quedar fuera de sus marcadores.
3. Usar `node_modules/next/dist/docs/` como primera fuente cuando la version instalada incluya esa ruta; si no, usar la documentacion oficial correspondiente a esa version.
4. Evaluar `next-devtools-mcp` para inspeccionar el dev server: rutas, logs, errores de compilacion y metadata de paginas. Instalar/configurar solo cuando exista un workflow de desarrollo que lo use.
5. Preferir una version controlada por el package manager/lockfile. La documentacion oficial muestra `npx ...@latest`, pero una configuracion compartida no debe introducir drift fuera del lockfile sin una decision explicita.
6. Agregar entonces el servidor a `.codex/config.toml` con el comando real del package manager elegido. No incluir tokens ni paths absolutos de una maquina.
7. Verificar con `codex mcp list`, iniciar el dev server y probar una consulta de metadata/errores. Documentar el comando canonico en este archivo.

La configuracion Codex equivalente tendra esta forma conceptual; no debe copiarse hasta conocer el comando fijado:

```toml
[mcp_servers.next-devtools]
command = "<package-manager>"
args = ["<locked-exec>", "next-devtools-mcp"]
```

Next.js tambien documenta `.mcp.json` para clientes genericos. Para Codex, la fuente compartida soportada es `.codex/config.toml`; agregar ambos formatos solo si el equipo usa clientes que realmente los requieren.

## Trust del proyecto

Codex ignora capas `.codex/` de proyectos no confiables, incluida configuracion MCP. Cuando se agregue configuracion local, cada desarrollador debe confiar este checkout desde el prompt/UI de Codex o registrar personalmente en `~/.codex/config.toml`:

```toml
[projects."<ruta-absoluta-del-checkout>"]
trust_level = "trusted"
```

Esa ruta es local a cada maquina: no se versiona y este repositorio no modifica el trust global.

## Limites

- MCP complementa la documentacion instalada; no reemplaza tipos, tests ni ADRs.
- No agregar servidores de documentacion genericos si las docs versionadas ya resuelven el caso.
- No habilitar browser/Playwright MCP hasta que exista una aplicacion y un caso de verificacion E2E concreto.
- Secrets se pasan por variables de entorno con privilegio minimo; nunca se escriben en config versionada.
- Cada servidor debe tener tools acotadas, ownership y procedimiento de deshabilitacion. Eliminarlo si deja de resolver un loop repetido.

## Fuentes oficiales

- [Codex: Model Context Protocol](https://learn.chatgpt.com/docs/extend/mcp)
- [Codex: configuracion y precedencia](https://learn.chatgpt.com/docs/config-file/config-basic)
- [Next.js: AI coding agents](https://nextjs.org/docs/app/guides/ai-agents)
- [Next.js: MCP server](https://nextjs.org/docs/app/guides/mcp)
