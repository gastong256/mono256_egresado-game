# Cómo contribuir al sistema

## Antes de escribir un componente

1. Mirar `/dev/design-system`. Si el patrón ya está, se compone.
2. Mirar `src/components/ui/` y `src/components/game/`.
3. Mirar las [capturas de referencia](reference/) y la [historia de la decisión](decision-history.md) si la duda es de intención visual.

La pregunta no es «¿cómo lo dibujo?», es «¿esto ya está resuelto?». Casi siempre lo está.

## Dónde va

| Si… | Va en |
|---|---|
| no sabe nada del dominio | `src/components/ui/` |
| lee `RunState`, `CareerState` o `PendingFeedback` | `src/components/game/` |
| renderiza una interacción del motor | `src/components/game/interactions/` |
| sólo existe para documentar el sistema | `src/components/dev/` |

La flecha va en un solo sentido: una pantalla consume primitivas, una primitiva consume tokens semánticos, un token semántico consume un pigmento. Nunca al revés.

## Reglas que el guardarraíl hace cumplir

`pnpm design:check` rechaza:

- un pigmento crudo en una pantalla (`bg-bottle-600` en vez de `bg-green`);
- un color escrito a mano (no pasa por el gate de contraste);
- un tamaño de la escala apagada de Tailwind;
- cualquier `rounded-*` — el radio del sistema es 0;
- cualquier `shadow-*` que no sea el resplandor de Aura.

Las dos últimas son binarias. No hay un radio chico aceptable.

## Reglas que ningún script puede hacer cumplir

Estas dependen de quien escribe:

- **Elegir no es acertar.** Ningún estado de selección puede parecerse a un resultado.
- **`null` no es 0.** Una dimensión sin establecer no se dibuja.
- **Sólo lo que se movió.** Nunca un `+0`.
- **Nada sólo por color.** Siempre un segundo canal.
- **Un solo primario por pantalla.**
- **Caja mixta en títulos.**

Hay tests para las tres últimas. Para las otras, el [checklist de distancia](decision-history.md) es la herramienta.

## Agregar un rol tipográfico

1. Definirlo en `tokens.css` con tamaño, interlínea, tracking y peso.
2. **Declararlo en `cn()`.** Sin esto `tailwind-merge` puede clasificarlo como color y hacer que borre el color del texto, sin que falle ningún test ni ningún tipo.
3. Agregar el caso a `tests/unit/cn.test.ts`.
4. Mostrarlo en la vitrina.

## Agregar un color

Ver [colores](colors.md). El paso que no se saltea es agregar cada combinación nueva a la lista de pares del gate de contraste: un color que no está en la lista es un color que nadie midió.

## Cómo se testea un componente

Comportamiento y semántica, **nunca la cadena de clases**. Si un test se rompe porque cambió un `px-4`, el test estaba mirando el lugar equivocado.

Lo que sí vale la pena afirmar: que un botón siga siendo un `<button>`, que un error siga asociado a su campo, que una dimensión sin establecer no se dibuje, que seleccionar no revele el resultado.

## Dependencias

Antes de agregar una, revisar qué hay. El sistema evita a propósito:

- un framework de componentes genérico;
- CSS-in-JS en runtime;
- una librería de charting para un triángulo de tres puntos;
- una librería de animación para tres keyframes;
- Storybook — la vitrina más los tests cubren la necesidad actual.

Ver la [política de dependencias](../08-engineering/dependency-and-decision-policy.md).
