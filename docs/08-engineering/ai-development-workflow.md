# Flujo de desarrollo asistido por IA

Este flujo aplica a cambios de código, contenido, arquitectura y documentación. Su objetivo es que una sesión demuestre de dónde obtuvo contexto, qué modificó y cómo verificó el resultado.

## Ciclo de trabajo

1. **Inspeccionar el repositorio.** Confirmar raíz Git, branch, `git status`, archivos relevantes y cambios preexistentes. Preservar trabajo ajeno.
2. **Cargar instrucciones aplicables.** Leer `AGENTS.md` y cualquier archivo más específico entre la raíz y el directorio de trabajo.
3. **Delimitar la tarea.** Separar el resultado solicitado de mejoras adyacentes. No implementar producto o gameplay sin una tarea explícitamente acotada.
4. **Enrutar contexto.** Usar [context-map.md](context-map.md) y elegir la lectura mínima correspondiente.
5. **Leer fuentes autoritativas.** Aplicar la precedencia de `docs/README.md`, ADRs aceptados y preguntas abiertas. No resolver silenciosamente un empate sin autoridad.
6. **Inspeccionar la implementación.** Buscar código, tests, schemas, call sites, scripts, lockfile y configuración real antes de diseñar.
7. **Verificar versiones instaladas.** Para Next.js, leer primero `node_modules/next/dist/docs/`; para otras librerías, preferir tipos, package metadata y docs de la versión fijada.
8. **Investigar upstream sólo si hace falta.** Usar fuentes oficiales primarias para APIs, compatibilidad, seguridad o conducta actual. Registrar qué evidencia cambia una decisión.
9. **Hacer visibles los supuestos.** Distinguir hechos, decisiones aceptadas, propuestas y preguntas abiertas.
10. **Evaluar arquitectura.** Aplicar [dependency-and-decision-policy.md](dependency-and-decision-policy.md); crear/actualizar ADR cuando el cambio cruza fronteras o altera NFR, seguridad, proveedor, determinismo o replay.
11. **Planificar.** Definir el cambio coherente más pequeño, archivos afectados, tests, documentación y riesgos. Delegar sólo subtareas independientes con ownership explícito.
12. **Implementar.** Respetar fronteras, evitar refactors no pedidos y no introducir dependencias o flags especulativos.
13. **Agregar o actualizar tests.** Elegir unit, component, property, integration, E2E, golden seed, simulación o validación de contenido según el riesgo.
14. **Ejecutar gates focalizados.** Usar pnpm y scripts de `package.json`; no sustituirlos por comandos inventados ni ocultar fallos.
15. **Mantener documentación y decisiones.** Actualizar fuente autoritativa/trazabilidad cuando cambia comportamiento y sincronizar el master después de editar una fuente incluida.
16. **Inspeccionar el diff.** Revisar whitespace, cambios involuntarios, generados, secretos, paths locales y dependencias nuevas.
17. **Hacer review final.** Comparar con la solicitud, invariantes, errores, seguridad, privacidad, accesibilidad y compatibilidad.
18. **Reportar evidencia.** Enumerar cambios, decisiones, comandos/resultados y gates omitidos o deliberadamente fallidos.

## Autoridad del código y el tooling

- `package.json` define los comandos; `pnpm-lock.yaml` fija resolución y pnpm es el único package manager.
- `.node-version`, `.nvmrc`, `packageManager`, CI y Docker deben seguir coordinados.
- `pnpm toolchain:check` verifica esa coordinación y que el proceso use las versiones fijadas.
- `eslint.config.mjs` materializa las fronteras de arquitectura; no deshabilitar reglas localmente para saltarlas.
- `tsconfig.game.json` preserva el game core sin DOM/Node.
- `.env.example` define nombres, nunca secretos ni defaults privilegiados.
- los tipos Supabase son generados; las migraciones gobiernan el schema.
- `node_modules/next/dist/docs/` gobierna convenciones Next.js de la versión instalada.
- MCP aporta evidencia runtime cuando el dev server está activo; no sustituye tests o docs versionadas.

## Gates canónicos

### Cambio de aplicación general

Durante iteración, ejecutar el test focalizado y luego:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
```

Antes de declarar completa una tarea de código:

```bash
pnpm verify
```

`pnpm verify` incluye toolchain, workspace agentivo, master documental, formato, lint/fronteras, ambos typechecks, cobertura, build y E2E. Requiere Node.js `24.19.0`, pnpm `11.22.0` y el Chromium de Playwright instalado.

### Cambio documental o agentivo

```bash
node scripts/validate-agent-workspace.mjs
node scripts/sync-master-spec.mjs --check
pnpm format:check
git diff --check
```

Si cambia una fuente incluida en el master (`docs/README.md`, checklist o `00-` a `07-`), sincronizar primero con:

```bash
node scripts/sync-master-spec.mjs --write
```

Los documentos bajo `08-engineering/` no se incorporan al master, pero sí deben figurar en el mapa/manifest/checklist cuando se agregan o retiran.

### Migración o adapter Supabase

Con el stack local activo:

```bash
pnpm db:reset
pnpm db:lint
pnpm db:types
pnpm format:check
pnpm verify
```

Revisar además RLS, privilegios, exposición al Data API, minimización, rollback y compatibilidad. `pnpm db:reset` es destructivo sólo para la base local y no autoriza apuntar a un proyecto remoto.

### Docker o runtime

```bash
pnpm docker:build
pnpm docker:up
pnpm docker:down
pnpm verify
```

Verificar health, usuario no-root, ausencia de secretos en la imagen, conectividad interna sólo si Supabase está habilitado y que el workflow nativo conserve paridad.

### Dependencias y release

```bash
pnpm install --frozen-lockfile
pnpm toolchain:check
pnpm peers check
pnpm security:audit
pnpm verify
pnpm release:check
```

Hoy `pnpm release:check` debe fallar porque Next.js `16.3.1` precede el parche `16.3.2`. Un pipeline verde de calidad no anula ese bloqueo ni autoriza un deploy público.

## Qué requiere ADR

Crear o modificar un ADR cuando una decisión:

- afecta varias fronteras o módulos;
- es costosa de revertir;
- cambia una propiedad no funcional significativa;
- cambia plataforma, proveedor o topología principal;
- altera seguridad, privacidad o trust boundaries;
- altera determinismo, formato de acciones, RNG, versionado o compatibilidad de runs.

Una actualización compatible de dependencia o un detalle interno localizado normalmente no requiere ADR. Si el detalle se vuelve contrato duradero o condiciona múltiples consumidores, deja de ser solamente implementación.

## Decisiones que no pertenecen oportunísticamente al feature code

No fijar dentro de una feature sin fuente autoritativa:

- fórmula final de score, desempates, seed strategy o reglas de intentos;
- nuevos datos de menores, identidad, Auth, retención o publicación;
- cambio de frontera UI/engine/server/persistencia;
- algoritmo PRNG o política de compatibilidad/replay histórico;
- contrato público incompatible o schema persistente difícil de revertir;
- proveedor, servicio externo o dependencia que reoriente la arquitectura;
- una nueva mecánica presentada como simple contenido;
- service worker/caching que pueda servir reglas o assets incompatibles.

Clasificar estos casos con [dependency-and-decision-policy.md](dependency-and-decision-policy.md) y usar [open-questions.md](../07-reference/open-questions.md) cuando todavía no exista una decisión.

## Seguridad operacional de la sesión

- Usar `pnpm db:status` y `pnpm db:start`, cuyos wrappers redactan credenciales; no pegar la salida directa de `pnpm exec supabase status` en canales compartidos.
- No leer o imprimir `.env.local` como diagnóstico. Validar presencia/forma mediante los scripts existentes.
- No agregar secrets, trust local o rutas absolutas a `.codex/config.toml`.
- No exponer `SUPABASE_SECRET_KEY` en módulos client o variables `NEXT_PUBLIC_*`.
- No ejecutar deploys, migraciones remotas o cambios externos sin autorización explícita.
- Tratar cambios preexistentes del worktree como trabajo ajeno hasta demostrar lo contrario.

## Cierre de una tarea

El reporte final debe distinguir:

- qué quedó implementado;
- qué evidencia pasó;
- qué check falló y si el fallo era esperado;
- qué no se ejecutó y por qué;
- qué decisión sigue diferida;
- estado de Git, sin atribuir cambios ajenos.

No declarar “todo verde” si `release:check` continúa bloqueado, aunque el cambio no tenga intención de release.
