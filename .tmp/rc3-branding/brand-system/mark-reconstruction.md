# Reconstrucción del isotipo

## Source y concepto

| Campo | Valor |
|---|---|
| Concepto | Aprobado por el Product Owner: **Σ + birrete + listón + rombo verde** (matemática · trayectoria · culminación · egreso). LOCKED; no se exploraron alternativas. |
| Referencia | `resources/rc3-assets/brand/isotipo.png` · PNG RGB 8 bit · 1254 × 1254 · 827.559 B |
| SHA-256 del source | `0a4874117c78a48e40a20f25de7acd5fbbc52c0f2adf493af147bd7252395c73` |
| Caja de tinta medida | x 295–961 · y 207–984 (666 × 777 px, 0,857 de proporción); rombo verde x 844–961 · y 565–683 |
| Resultado | `src/lib/ui/brand-mark.ts` → `public/assets/brand/egresado-mark.svg` (331 B) |
| Método | Reconstrucción geométrica sobre medidas del raster (perfiles de fila cada 10 px); **sin autotrace** |

## Qué se midió en el raster y qué se decidió

| Elemento | Raster (px) | Canónico (unidades de la caja 200 × 240) | Decisión |
|---|---|---|---|
| Techo del birrete | rombo 662 × 278, pendiente de aristas ≈ 2,4 : 1 | rombo 200 × 80, pendiente **5 : 2** (`M100 0 200 40 100 80 0 40Z`) | Pendiente redondeada a una razón entera; simetría exacta (el raster tenía 2,37 y 2,45 según el lado). |
| Canal techo–banda | 32–33 px vertical | **10** vertical, constante | El listón cuelga del mismo canal. |
| Banda (chevrón) | grosor vertical 72–75; extremo izq. x = −257, der. x = +221 del eje; cortes verticales | grosor **24**, paralela al techo, cortes verticales en x = 25 y x = 165 | Asimetría conservada a propósito: el lado derecho se acorta para dejar 13 de aire al listón, como en el raster (40 px). |
| Σ, trazo superior | 151 px de ancho horizontal; su esquina derecha rozaba la banda (≈5 px) | ancho **42**; esquina a **7,2** de la banda; canal de 24 a la izquierda | Corrección óptica: el raster dejaba las dos formas «besándose». |
| Σ, diagonales | dx/dy 0,76–0,91 (asimétricas); grosor perpendicular ≈115 | dx/dy **5 : 6** las dos; grosor perpendicular ≈ 32 (1,34× la barra, como en una Σ de palo seco pesada) | Vértice a mitad exacta entre trazo superior y barra (y = 162). |
| Σ, barra inferior | 79 px; derecha en x = 880 | grosor **24**; derecha en x = **178** | Coincide con el borde izquierdo del listón: una vertical compartida en lugar de una casi-coincidencia (raster: 22 px de diferencia). |
| Borde izquierdo | banda 370 · Σ 372 | **25** para las dos | Alineación exacta. |
| Listón | 28 px de ancho; nace ≈7 px bajo el techo | **8** de ancho (x 178–186), nace a 10 del techo, entra 8 en el rombo | Sin muesca entre cordón y rombo. |
| Rombo | 117 × 118; su punta derecha coincide con la esquina del techo | diagonal **36**; punta derecha en x = 200 = esquina del techo; punta superior en y = 108 = trazo superior de la Σ | Dos alineaciones que el raster insinuaba, hechas exactas. |

Tres direcciones de trazo (horizontal, 5 : 2, 5 : 6) y dos grosores (24 y ≈32). Cinco primitivas: cuatro `path` de tinta y uno para el rombo. Sin `<style>`, sin script, sin `href`, sin `foreignObject`, sin filtros ni máscaras.

## Paleta

| Rol | Token | Hex en los archivos sueltos |
|---|---|---|
| Tinta | `--color-ink-900` (`BRAND_HEX.ink`) | `#16181a` |
| Rombo | `--color-bottle-600` (`BRAND_HEX.green`) | `#1b6b3a` |
| Reversa y fondo de íconos | `--color-paper` (`BRAND_HEX.canvas`) | `#f6f5f0` |

Ningún color nuevo. Inline, el componente usa `currentColor` y `fill-green`; los tres SVG de `public/` escriben los hex porque un archivo suelto no tiene tokens, y `tests/unit/brand-assets.test.ts` comprueba que sean exactamente los de `BRAND_HEX`.

## ViewBox

`0 0 200 240`: la caja del símbolo, sin margen. Quien lo compone decide su aire (el lockup, los íconos). No es cuadrado a propósito: un viewBox de 256 con márgenes internos habría hecho que el `gap` del lockup y el margen de los íconos dependieran de un margen invisible.

## Variante óptica para 16–48 px

A 16 px el canal de 10 (0,7 px) y el cordón de 8 (0,5 px) desaparecen y el techo se pega a la banda. La construcción pequeña (`BRAND_MARK_SMALL_INK`) conserva el símbolo y cambia lo que no sobrevive:

- la banda se funde con el trazo superior de la Σ, que gana su **barra completa** (`M25 80H140V110H77…`);
- el techo se achata a **10 : 3** (60 de alto) para cederle altura a la Σ, que es lo que se lee;
- canal de **20**, cordón de **16**, rombo de **52**;
- misma caja, mismos hex.

La usan `favicon.ico` (16/32/48) e `icon.svg`. Desde 64 px se usa la canónica. Ver `evidence/sizes-16-512.png` (cada tamaño renderizado a píxel exacto y ampliado ×8 con vecino más cercano).

## Pruebas del símbolo

| Prueba | Resultado | Evidencia |
|---|---|---|
| Silueta 100 % tinta | Σ, birrete, listón y rombo reconocibles sin color | `evidence/mono-reverse-default.png` (izquierda) |
| Reversa (papel sobre pizarra) | PASS; el rombo también en papel: el verde botella sobre `slate-900` mide 1,9 : 1 y no se usa | `evidence/mono-reverse-default.png` (centro) |
| Fidelidad al source | Superposición a 600 px: misma identidad, geometría corregida | `evidence/source-vs-svg.png` (source · superposición · SVG) |
| 16 / 32 / 48 (pequeña) y 64 / 192 / 512 (canónica) | PASS | `evidence/sizes-16-512.png` |
