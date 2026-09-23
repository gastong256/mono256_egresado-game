# Color

## Cuatro colores, cuatro trabajos

La paleta v0.2 no es una rampa generada: es un set corto de pigmentos elegidos y medidos de a uno. Los valores exactos viven en `src/styles/tokens.css`; acá está lo que significan.

| | Rol | Dónde |
|---|---|---|
| **Papel** | el mundo del juego | fondo de toda pantalla, cuadriculado |
| **Tinta** | información | títulos, prosa, números, bordes de dato |
| **Verde escolar** | estado, marca de corrección, progreso | tilde, celda hecha, chip que subió |
| **Rojo corrección** | tensión y restricción | eyebrow, subrayado de restricción, tachado |
| **Lima acción** | el CTA | **sólo** botones primarios |
| **Verde Aura** | reputación | **sólo** dentro del bloque negro |

Proporción objetivo por área en una pantalla de desafío típica: **~80 % papel y tinta · ~12 % verde · ~5 % rojo · ~3 % lima**. El bloque negro de Aura aparece en 1 de cada 4 pantallas como máximo.

## La regla que hay que entender antes que ninguna

**Verde ≠ correcto. Rojo ≠ incorrecto.**

La calidad de un resultado la llevan **glifo + palabra + borde superior**: tres canales, ninguno cromático por sí solo. El color sólo refuerza. Por eso Óptimo y Resuelto pueden compartir el verde sin volverse ambiguos —los separan el glifo (tilde lleno contra tilde en contorno) y la palabra—, y por eso todo el set se lee en escala de grises.

El rojo del eyebrow de una situación no anuncia un error: anuncia el momento del año. La demora del colectivo es roja *antes* de que el jugador haga nada.

## Las tres superficies

| Superficie | Cuándo | Por qué |
|---|---|---|
| **Papel cuadriculado** | fondo de toda pantalla | es el mundo del juego |
| **Oscuro** | sólo el bloque de decisión | el foco cae donde hay que elegir |
| **Negro** | sólo Aura | marca qué mecánica es lúdica |

Ese cambio de superficie **es** la transición de estado: la decisión pasa en oscuro y el resultado vuelve al papel. El color entra a jugar después.

**Regla de fondo:** el fondo cuadriculado es el de toda pantalla; el fondo liso queda reservado para *bloques insertados* — caja de dato, ledger, sello, Aura, superficie de decisión. Así el papel se ve alrededor y el dato se lee como objeto.

## Por qué el verde de Aura sólo existe sobre negro

No es una preferencia: sobre papel **fallaría contraste**. La regla se auto-impone, y hay un test que lo verifica midiendo las dos combinaciones. Es también lo que hace que Aura se sienta otra cosa que Promedio o Equipo a cualquier escala, incluida la celda de 46 px del HUD.

## Calibración desde el colegio

El entorno del colegio —camisa blanca, gris de franela, verde botella, rojo escocés— sembró **familias de tono**, no una paleta. Sobre papel, esos dos tonos saturados funcionan como tinta, que es exactamente el rol que necesitan.

Reglas duras:

- el logo, el escudo o el uniforme del colegio **no aparecen en ninguna parte** de Egresado;
- las fotos del colegio son referencia y no se incluyen en el producto;
- no se derivan marcas a partir del escudo;
- los colores muestreados **no se usan literalmente en ningún lado**.

## Cómo se consume

Un componente de producto pide un rol semántico, nunca un pigmento:

```tsx
<p className="text-ink-secondary">   {/* sí */}
<p className="text-ink-700">         {/* no: el guardarraíl lo rechaza */}
<p className="text-[#45494A]">       {/* no: no pasa por el gate de contraste */}
```

La cadena es `pigmento → rol semántico → componente`, en un solo sentido. `pnpm design:check` verifica las dos cosas: que ninguna pantalla use un pigmento crudo o un color escrito a mano, y que cada combinación que el producto pinta llegue a su mínimo de WCAG 2.2.

## Agregar un color

Casi nunca es la respuesta. Antes de agregar uno, revisar si el problema es de *jerarquía* y no de color: en este sistema el peso lo dan el tamaño, el borde y la superficie.

Si de verdad hace falta:

1. agregar el pigmento a `tokens.css`;
2. darle un rol en `theme.css` y exponerlo en `@theme inline`;
3. agregar cada combinación nueva a la lista de pares de `scripts/design/check-contrast.mjs`;
4. correr `pnpm design:check`.

El paso 3 no es opcional. Un color que no está en la lista es un color que nadie midió.

## Acentos de la landing pública

El ajuste visual de Home autorizado el 23/09 conserva el verde escolar para la
promesa, el estado abierto y los aportes de Matemática/Equipo. Aura se presenta
con su estrella de cuatro puntas y verde neón exclusivamente sobre `aura-surface`.
La lima continúa reservada al CTA principal. Los iconos acompañan etiquetas;
ningún puesto, aporte o estado se interpreta sólo por color.

El podio incorpora metales mates como extensión acotada de presentación:
`podium-gold`, `podium-silver`, `podium-bronze` y sus roles `*-surface`.
Oro y bronce añaden pigmentos ocre/cobre; plata reutiliza tinta secundaria y
papel cuadriculado. Sólo se usan en medallas y filetes del Home. No sustituyen
colores de resultado, selección, progreso ni Aura en el juego. Cada medalla
conserva el numeral y la etiqueta de puesto, incluidos los puestos compartidos.
Los contrastes de los numerales sobre su tinte son 4,91:1, 7,16:1 y 5,49:1;
los nueve pares adicionales del Home se verifican en `pnpm design:check`.
