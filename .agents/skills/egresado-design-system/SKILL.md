---
name: egresado-design-system
description: Escribir o modificar interfaz de Egresado usando tokens, primitivas de UI y primitivas de juego existentes antes de inventar un patron visual nuevo. Usar para cualquier tarea de frontend con estilos; no usar para decidir reglas de producto ni para rediseniar la identidad.
---

# Sistema de diseno de Egresado

El sistema decide color, tipografia, espaciado, radio, elevacion, foco, estados interactivos y presentacion de datos numericos. Una pantalla no vuelve a decidir nada de eso.

Lee [la documentacion del sistema](../../../docs/09-design-system/README.md) y abri `/dev/design-system` con el servidor de desarrollo antes de escribir una primitiva nueva.

## Antes de escribir un estilo

1. Busca el patron en `/dev/design-system` y en `src/components/ui/`. Si existe, componelo.
2. Si casi existe, extende el componente. No lo copies.
3. Si no existe, decidi con [las reglas de crecimiento](../../../docs/09-design-system/contribution.md): layout unico se queda local; patron repetido se promueve a componente; significado repetido se promueve a token semantico; interaccion de dominio nueva entra por `interaction-area.tsx`.

## Reglas que no se negocian

- Consumi tokens semanticos: `bg-primary`, `text-foreground-muted`, `border-line`. Nunca `bg-green-600` ni `text-gray-600` en una pantalla.
- Nada de colores escritos a mano. El unico hexadecimal permitido esta en `src/lib/ui/brand.ts`.
- Usa roles tipograficos (`text-body`, `text-heading`, `text-data`). Las escalas por defecto de Tailwind estan apagadas y no generan nada.
- Usa los radios con nombre: `rounded-control`, `rounded-surface`, `rounded-card`, `rounded-pill`.
- Un valor arbitrario de Tailwind necesita una razon escrita al lado.
- No reimplementes el foco. Esta resuelto una vez en `src/styles/base.css`.
- Ningun estado se distingue solo por color: siempre color mas nombre escrito mas forma o icono.
- **Elegir no es acertar**: el estado seleccionado es neutro y nunca verde. Antes de confirmar, el color no puede revelar el resultado.
- HTML nativo primero. Un `div` con `role` por comodidad de estilo es una regresion.
- Un componente que pueda quedar sin nombre accesible tiene que hacer ese nombre obligatorio en el tipo.
- Si agregas un rol tipografico o una escala propia, declarala en `cn()` (`src/lib/ui/cn.ts`) y cubrila en `tests/unit/cn.test.ts`.
- Si agregas una combinacion de colores nueva, sumala a la lista de `scripts/design/check-contrast.mjs`.

## Verificacion

```bash
pnpm design:check   # guardarrail de tokens y contraste medido
pnpm verify         # gate transversal, lo incluye
```

Agrega tests de comportamiento y semantica, nunca de cadenas de clases. Para pantallas nuevas, sumalas al escaneo de accesibilidad de Playwright.
