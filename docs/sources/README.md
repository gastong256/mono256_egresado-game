# Fuentes externas congeladas

Este directorio guarda paquetes documentales recibidos desde afuera del repositorio, **tal como llegaron**. No son documentación canónica: son el insumo verificable del que salió la documentación canónica.

Regla: un archivo bajo `sources/` no se edita. Si su contenido tiene que cambiar, cambia el documento canónico que lo integró y la diferencia se registra en el documento de integración correspondiente.

## `egresado-project-blueprint-v0.2.0/`

- **Paquete:** EGRESADO Project Blueprint & Technical Handoff v0.2.0.
- **Idioma del paquete:** inglés.
- **Fecha de integración:** 28 de agosto de 2026.
- **Integración canónica:** [integración y trazabilidad del blueprint](../07-reference/blueprint-v0.2-integration.md).
- **Decisión de gobernanza:** [ADR-018](../03-architecture/adr/ADR-018-blueprint-v0-2-decision-authority.md).

Blueprint de producto, juego e ingeniería posterior al rediseño visual de 7.º y a las discusiones sobre competencia de feria. Trae 79 archivos: 77 documentos modulares y ejemplos, más `README.md` y `EGRESADO-MASTER-BLUEPRINT.md`.

### Qué es canónico y qué no

Dentro del paquete, los archivos modulares son la fuente mantenible y `EGRESADO-MASTER-BLUEPRINT.md` es una vista consolidada generada a partir de ellos —la misma relación que hay en este repositorio entre `docs/` y `EGRESADO-MASTER-SPEC.md`.

Fuera del paquete, **ninguno de los dos es canónico**. La documentación de `00-product` a `09-design-system` absorbió el contenido vigente, lo tradujo a la terminología del proyecto y lo reconcilió con el código real. El paquete queda como evidencia de procedencia: permite auditar qué decía la fuente y qué se decidió al integrarla.

### Integridad

`MANIFEST.json` declara tamaño y `sha256` de los 79 archivos. Verificación desde la raíz del repositorio:

```bash
node -e "const m=require('./docs/sources/egresado-project-blueprint-v0.2.0/MANIFEST.json'),{createHash}=require('node:crypto'),fs=require('node:fs'),p='docs/sources/egresado-project-blueprint-v0.2.0/';const bad=m.files.filter(f=>createHash('sha256').update(fs.readFileSync(p+f.path)).digest('hex')!==f.sha256);console.log(bad.length?bad:'ok '+m.files.length)"
```

Al 28 de agosto de 2026 los 79 archivos verifican. El manifiesto describe el paquete original y deja de validar si alguien lo edita; por eso no se edita.
