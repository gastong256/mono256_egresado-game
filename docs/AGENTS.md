# Instrucciones para `docs/`

Estas reglas complementan las instrucciones de la raiz para cualquier cambio dentro de `docs/`.

- Conserva la jerarquia y la autoridad definidas en [README.md](README.md). Enlaza la fuente canonica en vez de duplicar reglas en nuevos resumenes.
- Modifica primero el documento individual. `EGRESADO-MASTER-SPEC.md` es una vista derivada de los Markdown de producto (`00-` a `07-`), el checklist y el README. Desde la raiz, sincronizala con `node scripts/sync-master-spec.mjs --write`; no la edites aisladamente.
- Mantene [MANIFEST.txt](MANIFEST.txt), el mapa de [README.md](README.md) y [DOCUMENTATION-CHECKLIST.md](DOCUMENTATION-CHECKLIST.md) cuando agregues, muevas o retires documentacion.
- Distingui decisiones aceptadas, propuestas y preguntas abiertas. No presentes valores de referencia o defaults sugeridos como contratos finales.
- Una decision arquitectonica nueva usa `03-architecture/adr/ADR-NNN-*.md`, declara estado/fecha/contexto/decision/consecuencias y actualiza [07-reference/decision-register.md](07-reference/decision-register.md).
- Un cambio de comportamiento visible actualiza la especificacion funcional; uno de gameplay, el GDD/reglas; uno pedagogico, el marco matematico. Actualiza [02-functional/traceability-matrix.md](02-functional/traceability-matrix.md) cuando cambie una feature o requisito.
- Una contradiccion que la precedencia no resuelva se agrega a [07-reference/open-questions.md](07-reference/open-questions.md), con el gate concreto que debe cerrarla. Las hipotesis de experimentacion conservan su politica no bloqueante y pueden necesitar prototipo/playtest para resolverse. No elijas una respuesta editorialmente sin evidencia o decision autorizada.
- Desde la raiz, ejecuta `node scripts/validate-agent-workspace.mjs` y `node scripts/sync-master-spec.mjs --check` antes de terminar.
