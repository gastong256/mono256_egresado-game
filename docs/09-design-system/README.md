# Egresado Design System v0.1

El sistema visual y de interacción de Egresado. Define una vez lo que ninguna pantalla debería volver a decidir por su cuenta: color, tipografía, espaciado, radio, elevación, foco, estados interactivos y cómo se muestra un dato numérico.

Es una versión `0.1`: la base está, la API todavía se puede mover. No supongas estabilidad de librería madura.

## Por qué existe

Antes de esta versión cada pantalla elegía sus grises, su radio y su tamaño de texto. Con una pantalla eso es velocidad; con seis años de secundaria por implementar es deriva garantizada. El sistema convierte esas decisiones en tokens y componentes, para que agregar 1.º año sea componer y no volver a diseñar.

## La cadena

```text
tokens primitivos      src/styles/tokens.css
        ↓
tokens semánticos      src/styles/theme.css
        ↓
primitivas de UI       src/components/ui/
        ↓
primitivas de juego    src/components/game/
        ↓
patrones de interacción  src/components/game/interactions/
        ↓
pantallas              src/app/, src/components/game/game-container.tsx
```

La flecha va en un solo sentido. Una pantalla consume primitivas; una primitiva consume tokens semánticos; los tokens semánticos consumen la paleta. Un componente de producto no toca la paleta cruda.

## Dónde mirar

La fuente de verdad son el CSS de tokens, las APIs de los componentes en TypeScript y la vitrina. Esta documentación explica el porqué, las reglas y los límites; no repite valores.

| Quiero… | Ir a |
|---|---|
| ver todo funcionando | `/dev/design-system` con el servidor de desarrollo levantado |
| entender la paleta y sus reglas | [colores](colors.md) |
| elegir un rol tipográfico | [tipografía](typography.md) |
| espaciado, radio, elevación, movimiento, layout | [fundamentos](foundations.md) |
| usar una primitiva de UI | [componentes de UI](ui-components.md) |
| usar una primitiva de juego | [componentes de juego](game-components.md) |
| reglas de accesibilidad | [accesibilidad](accessibility.md) |
| agregar algo nuevo | [cómo contribuir](contribution.md) |
| qué cambió en la migración | [migración de 7.º grado](migration-7-grade.md) |

## Gates

```bash
pnpm design:check   # guardarraíl de tokens + contraste WCAG medido
pnpm verify         # lo incluye, junto con lint, tipos, tests y Playwright
```

`design:check` no es cosmético. Convierte cada color OKLCH a sRGB y verifica las 35 combinaciones que el producto pinta de verdad contra los mínimos de WCAG 2.2. Un verde de marca puede parecer suficientemente oscuro y quedarse en 4,27:1 con texto blanco; el gate lo dice antes de que llegue a una pantalla.

## Evolución prevista

| Versión | Alcance |
|---|---|
| v0.1 | fundamentos + migración completa de 7.º grado |
| v0.2 | ajustes de playtest, identidad y movimiento más definidos |
| v0.3 | visualización de datos avanzada y patrones de los años superiores |
| v1.0 | sistema estabilizado para el juego completo |

## Lo que v0.1 dejó afuera a propósito

- **Tema oscuro.** Hay un solo tema. Los tokens semánticos están armados para que un segundo tema sea un bloque de redefiniciones y no una reescritura de componentes, pero no existe todavía.
- **Storybook.** La vitrina en `/dev/design-system` más los tests cubren la necesidad actual sin sumar mantenimiento. Vale reconsiderarlo cuando la cantidad de componentes crezca bastante o cuando haga falta revisión de diseño independiente.
- **Radix.** Ninguna interacción actual lo necesita: no hay diálogo, popover ni combobox propio. Se evalúa cuando aparezca un widget que el HTML nativo no resuelva bien.
- **Drag and drop.** El tablero de asignación se resuelve con `select` nativos, que es la ruta accesible obligatoria. Arrastrar se puede sumar encima del mismo estado.
- **Logo.** El wordmark tipográfico alcanza; no se congela identidad gráfica sin necesidad.
