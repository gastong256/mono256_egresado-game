---
name: egresado-design-system
description: Escribir o modificar interfaz de Egresado usando tokens, primitivas de UI y primitivas de juego existentes antes de inventar un patron visual nuevo. Usar para cualquier tarea de frontend con estilos; no usar para decidir reglas de producto ni para rediseniar la identidad.
---

# Sistema de diseno de Egresado — v0.2, identidad papel

El sistema decide color, tipografia, cuadricula, geometria, foco, estados interactivos, movimiento y presentacion de datos numericos. Una pantalla no vuelve a decidir nada de eso.

La idea en una linea: **hoja cuadriculada como canvas, tinta como informacion, oscuro solo al decidir, y una unica isla negra para Aura.**

Lee [la documentacion del sistema](../../../docs/09-design-system/README.md) y abri `/dev/design-system` con el servidor levantado antes de escribir una primitiva nueva. Si la duda es de intencion visual, mira las [capturas de referencia](../../../docs/09-design-system/reference/) y la [historia de la decision](../../../docs/09-design-system/decision-history.md).

## Antes de escribir un estilo

1. Busca el patron en `/dev/design-system`, en `src/components/ui/` y en `src/components/game/`. Si existe, componelo.
2. Si casi existe, extende el componente. No lo copies.
3. Si no existe, decidi con [las reglas de crecimiento](../../../docs/09-design-system/contribution.md).

## Reglas que no se negocian

- Consumi tokens semanticos: `bg-canvas`, `text-ink-label`, `border-rule`, `bg-green`. Nunca un pigmento (`bg-bottle-600`) en una pantalla.
- Nada de colores escritos a mano. El unico hexadecimal permitido esta en `src/lib/ui/brand.ts`.
- Usa roles tipograficos (`text-body`, `text-display`, `text-data-lg`). Las escalas por defecto de Tailwind estan apagadas y no generan nada.
- **El radio es 0 y no hay sombras.** `rounded-*` y `shadow-*` estan prohibidos; la unica excepcion es `text-shadow-aura` dentro del bloque negro.
- Los titulos van en **caja mixta**. Las mayusculas quedan para etiquetas de 9-11 px y para el texto de un boton.
- La cuadricula (`eg-canvas`) es el fondo de toda pantalla. El fondo liso queda reservado para bloques insertados: dato, ledger, sello, Aura, decision.
- La marca de correccion cae **sobre** el dato o la opcion, nunca en un marco alrededor.
- El verde brillante de Aura vive **solo** dentro del bloque negro. Sobre papel falla contraste.
- La lima es **solo** un boton primario. Nunca un estado, nunca un dato.
- No reimplementes el foco. Esta resuelto una vez en `src/styles/base.css`.
- Todo valor cuantitativo lleva `tabular-nums`, y los numeros se escriben en es-AR: coma decimal, punto de miles.

## Las reglas de producto que el sistema sostiene

- **Elegir no es acertar.** El estado seleccionado es blanco y nunca verde. Antes de confirmar, el color no puede revelar el resultado.
- **`null` no es 0.** Una dimension de carrera sin establecer no se dibuja. Nunca un `Promedio 0`.
- **Solo lo que se movio.** Un resultado muestra unicamente las dimensiones que cambiaron. Nunca un `+0`.
- **Ningun estado se distingue solo por color**: siempre color mas palabra escrita mas forma o glifo.
- **Existe exactamente un primario montado a la vez**, y siempre en el mismo lugar.
- Un `Insuficiente` nunca bloquea: tiene consecuencia y el juego sigue.

## Accesibilidad

- HTML nativo primero. Un `div` con `role` por comodidad de estilo es una regresion.
- Un componente que pueda quedar sin nombre accesible tiene que hacer ese nombre obligatorio en el tipo.
- 44 px minimo de objetivo tactil; 52 px las opciones, 56 px las celdas de grilla.
- Toda interaccion de arrastre necesita ruta alternativa. Es requisito duro.
- Una region que scrollea horizontalmente necesita `tabIndex` y nombre accesible.

## Si agregas algo

- Un rol tipografico o una escala propia: declarala en `cn()` (`src/lib/ui/cn.ts`) y cubrila en `tests/unit/cn.test.ts`. Sin eso, `tailwind-merge` puede clasificarla mal y borrar el color del texto sin que falle nada.
- Una combinacion de colores nueva: sumala a la lista de pares de `scripts/design/check-contrast.mjs`. Un color que no esta en la lista es un color que nadie midio.
- Una pantalla nueva: sumala al escaneo de accesibilidad de Playwright y pasala por el [checklist de distancia](../../../docs/09-design-system/decision-history.md).

## Verificacion

```bash
pnpm design:check   # guardarrail de tokens y contraste medido
pnpm test:e2e       # axe-core sobre cada pantalla, desktop y mobile
pnpm verify         # gate transversal, incluye los dos
```

Agrega tests de comportamiento y semantica, nunca de cadenas de clases.
