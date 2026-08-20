# Flujo de desarrollo asistido por IA

Este flujo aplica a cambios de codigo, contenido, arquitectura y documentacion. Su objetivo es que una sesion pueda demostrar de donde obtuvo contexto, que modifico y como verifico el resultado.

## Ciclo de trabajo

1. **Inspeccionar el repositorio.** Confirmar raiz Git, branch, `git status`, archivos relevantes y cambios preexistentes. Preservar trabajo ajeno.
2. **Cargar instrucciones aplicables.** Leer el `AGENTS.md` de raiz y cualquier archivo mas especifico entre la raiz y el directorio de trabajo.
3. **Delimitar la tarea.** Separar el resultado solicitado de mejoras adyacentes. Identificar el gate de producto: MVP 0, MVP 1, MVP Feria o post-MVP.
4. **Enrutar contexto.** Usar [context-map.md](context-map.md) y elegir la lectura minima correspondiente.
5. **Leer fuentes autoritativas.** Leer requisitos, ADRs y preguntas abiertas aplicables. Aplicar la precedencia de `docs/README.md`; no resolver silenciosamente empates sin autoridad.
6. **Inspeccionar la implementacion.** Buscar codigo, tests, schemas, call sites, scripts, lockfile y convenciones existentes antes de disenar.
7. **Verificar el framework instalado.** Para Next.js, leer primero `node_modules/next/dist/docs/` cuando esa ruta exista; en versiones que no la incluyen, usar la documentacion oficial correspondiente. Para otras librerias, preferir tipos, package metadata y documentacion de la version fijada.
8. **Investigar upstream solo si hace falta.** Consultar documentacion oficial primaria cuando el repositorio o el paquete no resuelvan una API, compatibilidad o conducta actual. Registrar las fuentes que cambian una decision.
9. **Hacer visibles los supuestos.** Distinguir hechos, decisiones aceptadas, propuestas y preguntas abiertas. Agregar una pregunta al registro cuando la tarea necesita una decision no documentada.
10. **Planificar.** Definir el cambio coherente mas pequeno, archivos afectados, tests, documentacion y riesgo de compatibilidad. Usar subagentes solo para trabajos independientes y acotados; coordinar escrituras compartidas.
11. **Implementar.** Respetar fronteras, evitar refactors no requeridos y no introducir behavior flags o dependencias “para despues”.
12. **Agregar o actualizar tests.** Elegir unit, property, integration, E2E, golden seeds, simulacion, validacion de contenido o pruebas humanas segun el riesgo.
13. **Ejecutar quality gates.** Usar el package manager del lockfile y scripts canonicos del repositorio. Diagnosticar fallos; no ocultarlos ni sustituir comandos inexistentes por otros inventados.
14. **Inspeccionar el diff.** Revisar `git diff --check`, cambios no intencionales, archivos generados, secretos, paths locales y dependencias nuevas.
15. **Mantener documentacion y decisiones.** Actualizar requisito/trazabilidad cuando cambia comportamiento; crear ADR cuando corresponde; sincronizar el master derivado despues de editar sus fuentes.
16. **Hacer self-review final.** Comparar el resultado con la solicitud, invariantes, escenarios de error, seguridad, privacidad, accesibilidad y compatibilidad de replay.
17. **Reportar evidencia.** Enumerar archivos cambiados, decisiones, comandos ejecutados y resultados. Declarar de forma explicita cualquier gate no ejecutado o trabajo diferido.

## Que requiere ADR

Crear o modificar un ADR cuando una decision:

- afecta varias fronteras o modulos;
- es costosa de revertir;
- cambia una propiedad no funcional significativa;
- cambia plataforma, proveedor o topologia principal;
- altera seguridad, privacidad o trust boundaries;
- altera determinismo, formato de acciones, RNG, versionado o compatibilidad de runs.

Una actualizacion compatible de dependencia o un detalle interno localizado normalmente no requiere ADR. Si el detalle se vuelve contrato duradero o condiciona multiples consumidores, deja de ser solamente implementacion.

## Decisiones que no pertenecen oportunisticamente al feature code

No fijar dentro de una feature sin fuente autoritativa:

- formula final de score, desempates, seed strategy o reglas de intentos;
- nuevos datos de menores, identidad, retencion o publicacion;
- cambio de frontera UI/engine/server/persistencia;
- algoritmo PRNG o politica de compatibilidad/replay historico;
- contrato publico incompatible o schema persistente dificil de revertir;
- proveedor, servicio externo o dependencia que reoriente la arquitectura;
- una nueva mecanica presentada como simple contenido.

Clasifica estos casos con [dependency-and-decision-policy.md](dependency-and-decision-policy.md) y usa [open-questions.md](../07-reference/open-questions.md) cuando todavia no exista una decision.

## Gates actuales antes del scaffold

Mientras no exista `package.json` ni lockfile, no inventar comandos npm/pnpm. Para cambios documentales o agenticos ejecutar:

```bash
node scripts/validate-agent-workspace.mjs
node scripts/sync-master-spec.mjs --check
git diff --check
git status --short --branch
```

Cuando exista la aplicacion, los scripts del repositorio deben materializar el pipeline definido en [deployment-and-environments.md](../03-architecture/deployment-and-environments.md) y la [Definition of Done](../06-delivery/definition-of-done.md).
