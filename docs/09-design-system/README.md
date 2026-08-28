# Egresado Design System v0.2

El sistema visual y de interacción de Egresado. Define una vez lo que ninguna pantalla debería volver a decidir por su cuenta: color, tipografía, cuadrícula, geometría, foco, estados interactivos, movimiento y cómo se muestra un dato numérico.

Es una versión `0.2`: la identidad está cerrada, la API todavía se puede mover.

## La idea en una línea

**Hoja cuadriculada como canvas. Tinta como información. Oscuro sólo al decidir. Y una única isla negra para Aura.**

## Por qué existe la v0.2

La v0.1 resolvió la gobernanza —tokens, paleta de Tailwind apagada, contraste como gate— y esa parte sigue vigente. Lo que no resolvió fue la identidad: cuatro decisiones juntas hacían que Egresado se leyera como un juego de carrera deportiva. La historia completa está en [decision-history](decision-history.md), y la decisión en [ADR-017](../03-architecture/adr/ADR-017-paper-visual-identity.md).

## La cadena

```text
pigmentos              src/styles/tokens.css
        ↓
tokens semánticos      src/styles/theme.css
        ↓
primitivas de UI       src/components/ui/
        ↓
primitivas de juego    src/components/game/
        ↓
patrones de interacción  src/components/game/interactions/
        ↓
pantallas              src/app/, src/components/game/run-view.tsx
```

La flecha va en un solo sentido. Un componente de producto no toca un pigmento.

## Dónde mirar

La fuente de verdad son el CSS de tokens, las APIs en TypeScript y la vitrina. Esta documentación explica el porqué, las reglas y los límites; no repite valores.

| Quiero… | Ir a |
|---|---|
| ver todo funcionando | `/dev/design-system` con el servidor levantado |
| entender por qué se ve así | [historia de la decisión visual](decision-history.md) |
| la paleta y sus reglas | [colores](colors.md) |
| elegir un rol tipográfico | [tipografía](typography.md) |
| cuadrícula, geometría, layout, movimiento | [fundamentos](foundations.md) |
| usar una primitiva de UI | [componentes de UI](ui-components.md) |
| usar una primitiva de juego | [componentes de juego](game-components.md) |
| reglas de accesibilidad | [accesibilidad](accessibility.md) |
| agregar algo nuevo | [cómo contribuir](contribution.md) |
| qué cambió en la migración | [migración de 7.º grado](migration-7-grade.md) |

## Las seis reglas

Si sólo se leen seis líneas de todo esto, que sean éstas:

1. **Seleccionar no es acertar.** El color de resultado aparece recién después de Confirmar.
2. **`null` no es 0.** Una dimensión sin establecer no se dibuja.
3. **Sólo lo que se movió.** Nunca un `Promedio +0`.
4. **Nada se distingue sólo por color.** Siempre hay un segundo canal.
5. **Un solo primario por pantalla**, siempre en el mismo lugar.
6. **Radio 0 y sin sombras.** La profundidad la da el borde.

## Gates

```bash
pnpm design:check   # guardarraíl de tokens + contraste WCAG medido
pnpm test:e2e       # axe-core sobre cada pantalla, desktop y mobile
pnpm verify         # todo lo anterior, más lint, tipos, tests y build
```

`design:check` no es cosmético: resuelve cada rol hasta su pigmento y verifica cada combinación que el producto pinta contra los mínimos de WCAG 2.2. Un color que no está en su lista es un color que nadie midió.

## Evolución prevista

| Versión | Alcance |
|---|---|
| v0.1 | fundamentos oscuros — **reemplazada** |
| v0.2 | identidad papel, modelo de jugador, slice de 7.º |
| v0.3 | respuesta a playtest: pictogramas, pack raster o confirmación UI-only, SFX, Budget y Assignment de verdad |
| v0.4 | años posteriores: acento mínimo por año, interacciones multi-paso, historia de carrera |
| v1.0 | sistema completo, hito de egreso, arquetipo final, audio |

## Lo que v0.2 deja afuera a propósito

- **Tema oscuro completo.** Los tokens semánticos están armados para que un segundo tema sea un bloque de redefiniciones, pero no existe.
- **Pack raster.** Briefeado y no generado. Todas las pantallas corren con cero imágenes; `SceneMedia` existe para cuando eso cambie.
- **Pictogramas.** Ocho planeados, ninguno dibujado. El prototipo no necesitó ninguno, y dibujar iconos antes de que una pantalla los pida es cómo se podrean las librerías.
- **Audio.** Ocho briefs, nada producido.
- **Avatar y arte de personaje.** Estacionados: piden un pipeline de assets que la filosofía UI-first todavía no quiere.
- **Storybook, Radix, drag and drop.** Sin cambios respecto de v0.1; las razones siguen siendo las mismas.
