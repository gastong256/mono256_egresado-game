# Tipografía

## La familia

**Geist**, variable, servida localmente por el paquete `geist` a través de `next/font/local`. Los archivos viven en `node_modules`: no hay pedido a un CDN en runtime ni descarga durante el build, y el build sigue siendo reproducible sin red.

Una sola familia. Geist tiene buena cobertura de castellano —acentos, `ñ`, `¿`— y números legibles a tamaño chico, que es lo que este juego necesita.

## Roles, no tamaños

Las escalas por defecto de Tailwind están apagadas: `text-sm`, `text-lg` y `text-2xl` no existen en este proyecto. En su lugar hay roles, y cada uno trae ya decidido el tamaño, la altura de línea, el tracking y el peso.

| Rol | Para qué |
|---|---|
| `text-display` | el cierre de un año, el nombre del producto en portada |
| `text-title` | el título de una situación o de un momento narrativo |
| `text-heading` | encabezado de una sección dentro de una pantalla |
| `text-subheading` | la consigna de un desafío, la etiqueta de un campo, el rótulo de una opción |
| `text-body` | prosa: el planteo de una situación, el texto de un storylet |
| `text-body-sm` | detalle secundario, listas densas |
| `text-caption` | metadatos, notas al pie, puntaje |
| `text-label` | rótulo de un dato, en mayúsculas y con tracking |
| `text-data` | un dato cuantitativo |
| `text-data-lg` | un dato destacado |
| `text-data-xl` | el dato protagonista de una pantalla |

Elegir un rol es una decisión de significado. Si ninguno encaja, lo más probable es que el contenido esté mal jerarquizado, no que falte un tamaño.

## Los números

Los datos cuantitativos son el contenido más importante de Egresado, y su trabajo es ganarle a la prosa que los rodea. Lo consiguen por **tamaño, peso y tinta**, nunca por color: siguen destacándose en escala de grises y para alguien con daltonismo.

`tabular-nums` se aplica a todo lo marcado con `data-numeric`. Alinea las cifras entre métricas: comparar `28` con `42` en dos cajas contiguas no debería depender de dónde cayó cada dígito, y un contador que pasa de `9` a `10` no debería empujar lo que tiene al lado.

Los datos **no** van en monoespaciada. Se probó la alternativa y no mejora la comprensión: convierte un precio en código fuente.

## Jerarquía de una situación

Un desafío tiene que dejar este orden obvio de un vistazo:

```text
contexto        text-caption, gris
título          text-title
planteo         text-body
consigna        text-subheading
datos           text-label + text-data
interacción     rótulos en text-subheading
acción          botón grande
```

La prosa narrativa y los hechos numéricos nunca tienen el mismo peso visual.

## Límites

- No hay tamaños arbitrarios (`text-[17px]`). Si aparece uno, falta un rol o sobra una idea.
- El texto se prueba a 360, 390 y 430 px, más tablet y desktop.
- El zoom del navegador y el aumento de tamaño de texto del sistema no pueden romper el juego: todo está en unidades relativas.
