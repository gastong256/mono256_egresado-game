# Cómo crecer el sistema

## Antes de escribir un estilo

1. Abrí `/dev/design-system` y fijate si el patrón ya existe.
2. Si existe, componelo. Si casi existe, extendé el componente en lugar de copiarlo.
3. Si no existe, seguí el árbol de abajo.

## Qué promover y hasta dónde

### Un layout único de una pantalla

Se queda local. Componer `GameCanvas`, `Surface` y unas utilidades en una pantalla no necesita convertirse en nada.

### Un patrón visual que se repite

A partir de la segunda aparición, componente. La tercera copia ya divergió.

### Un significado que se repite

Token semántico. Si tres lugares necesitan «el color de algo que el jugador eligió», eso es `selected-*` y no `gray-100` escrito tres veces.

### Una interacción de dominio nueva

Entra por la arquitectura de interacciones: un tipo en el motor, un renderer en `interactions/`, y el `switch` exhaustivo obliga a completarlo.

## Reglas duras

- Los componentes de producto consumen **tokens semánticos**, nunca la paleta cruda.
- Nada de colores escritos a mano. El único hexadecimal permitido está en `src/lib/ui/brand.ts`, para el manifiesto y el `themeColor`, y hay un test que verifica que coincida con el token del que es copia.
- Nada de tamaños de texto ni radios fuera de los roles del sistema.
- Un valor arbitrario de Tailwind necesita una razón escrita al lado. Los pseudo-elementos de `<progress>` son un ejemplo legítimo.
- Una primitiva nueva define sus estados a conciencia: `default`, `hover`, `focus-visible`, `active`, `selected`, `disabled`, y `loading` o `error` si aplican.
- Una primitiva nueva que pueda quedar sin nombre accesible tiene que hacer ese nombre **obligatorio en el tipo**.
- El foco no se reimplementa. Está resuelto una vez en la capa base.
- Ningún estado se distingue sólo por color.

## Cómo se hace cumplir

| Regla | Mecanismo |
|---|---|
| paleta ajena | `--color-*: initial` — `bg-blue-500` no existe |
| paleta cruda en una pantalla | `pnpm design:check` |
| color a mano | `pnpm design:check` |
| escala tipográfica o radio ajenos | `--text-*: initial`, `--radius-*: initial` más `pnpm design:check` |
| contraste insuficiente | `pnpm design:check` y axe en Playwright |
| conflicto de clases | `cn()` con los grupos del proyecto declarados, más `tests/unit/cn.test.ts` |

Si agregás un rol tipográfico o una escala propia, **declaralo en `cn()`**. `tailwind-merge` trae su propio mapa de grupos y ante un nombre desconocido puede clasificarlo mal: eso hizo que `text-heading` borrara `text-primary-foreground` y los botones primarios salieran con tinta oscura sobre verde, sin que fallara ningún test ni ningún tipo.

## Dependencias

Se agrega una dependencia cuando resuelve un problema real, no porque sea común en sistemas de diseño. Las que están:

| Paquete | Por qué |
|---|---|
| `clsx` + `tailwind-merge` | una sola utilidad `cn()` para componer clases con resolución de conflictos |
| `class-variance-authority` | variantes tipadas en componentes que realmente tienen variantes |
| `lucide-react` | un solo lenguaje de íconos, con importación por ícono |
| `geist` | la familia tipográfica, servida localmente |

No se usa CSS-in-JS en runtime. No hay `ThemeProvider`: con un solo tema, las variables CSS alcanzan, y agregar contexto de React «por si viene el modo oscuro» es costo sin beneficio.
