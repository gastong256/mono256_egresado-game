# Footer institucional

Tres originales suministrados, inspeccionados visualmente. Piacentini es JPG,
no PNG; todos son opacos, sin alpha. Se preservan sus fondos, proporciones y
marca. No hubo regeneración, vectorización, crop ni upscale.

| Fuente en resources/footer | Dimensiones | Bytes fuente | Runtime en public/assets/footer | Dimensiones | Bytes |
|---|---|---:|---|---|---:|
| logo-piacentini.jpg | 360×360 | 8.557 | logo-piacentini.webp | 320×320 | 7.062 |
| logo-feria.png | 1122×1402 | 1.852.116 | logo-feria.webp | 384×480 | 41.042 |
| logo-dev.png | 1254×1254 | 914.644 | logo-dev.webp | 160×160 | 1.440 |

**Total: 2.775.317 → 49.544 B; reducción 98,2 %.** Sharp instalado transitivamente
por Next, resize sin ampliación + WebP quality 90/effort 6. Sin dependencia nueva.
Inventario legible por máquina: [assets.json](assets.json).

Next Image con dimensiones intrínsecas, lazy loading y `unoptimized`: los WebP ya
están ajustados y se sirven estáticos sin costo de transformación de proveedor.
Tamaños de pantalla: 112×112, 128×160 y 56×56 CSS px; `object-contain` sin deformar.
Fuentes completas conservadas como masters; se evita destruir originales.

Desktop: tres columnas. Mobile: cada marca con su nombre al lado. El afiche de la
feria se conserva entero, con su nombre adicional en HTML para que la etiqueta no
dependa de leer texto raster a tamaño reducido. Sin usar los colores de las marcas
como tokens nuevos de interfaz.

Footer `contentinfo`, tres imágenes con alt; institución y evento explícitos.
Crédito exacto `developed by gastong256.dev`; link `https://gastong256.dev` en nueva
pestaña con `noopener noreferrer` y aviso accesible. Sin nombre/apellido/bio ni
trackers. Privacidad enlaza `#privacy`: el aviso configurado existente, sin otra
versión legal. El pie llega como slot Server Component y no aparece en gameplay.
