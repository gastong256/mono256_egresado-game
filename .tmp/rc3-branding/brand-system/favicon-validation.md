# Validación de favicon e íconos

## Convención Next 16.3.5

Archivos por convención en `src/app/`: `favicon.ico`, `icon.svg`, `apple-icon.png`. Next los sirve y escribe los `<link>` en todas las rutas; `manifest.ts` declara los PNG de app por URL estable en `public/assets/brand/`. Verificado en el HTML servido de `/`:

```text
icon              /favicon.ico?…   image/x-icon    48x48
icon              /icon.svg?…      image/svg+xml   any
apple-touch-icon  /apple-icon.png?… image/png      180x180
manifest          /manifest.webmanifest
```

`tests/e2e/foundation.spec.ts` comprueba los tres `<link>` y que cada href, más cada `src` del manifiesto, responda 200 con `image/*`.

## Fondo

Los íconos llevan **papel opaco** (`#f6f5f0`), no transparencia: una silueta de tinta transparente desaparece sobre la barra de pestañas oscura, y el `.ico` y los PNG no pueden consultar `prefers-color-scheme`. Sobre claro el mosaico de papel casi no se nota; sobre oscuro se lee como una hoja con el símbolo. Radio 0, como todo el sistema (iOS y Android aplican su propia máscara).

## Tamaños

| Tamaño | Construcción | Resultado | Evidencia |
|---|---|---|---|
| 16 px (ico) | pequeña | techo, canal y Σ distinguibles; rombo como punto verde | `evidence/favicon-dpr1.png` (barra oscura y clara) |
| 16 px CSS a DPR 2 (svg) | pequeña | nítido: la Σ ya muestra la barra y el vértice | `evidence/favicon-dpr2.png` |
| 32 px | pequeña | todo legible, rombo con forma | idem |
| 48 px | pequeña | idem | `evidence/sizes-16-512.png` |
| 64 px | canónica | banda y trazo superior separados; cordón de 2 px | idem |
| 180 / 192 / 512 | canónica | símbolo al 64 % del lado; entra en el círculo seguro de una máscara (distancia máxima de la tinta al centro: 201 px sobre 205 admitidos a 512) | idem, `evidence/favicon-dpr1.png` |

Con la canónica a 16 px el techo se pega a la banda y el cordón desaparece: por eso existe la construcción pequeña (§44 del encargo). Ver `mark-reconstruction.md`.

## Navegador real

Chromium 1234 (Playwright) sobre el build de producción local: los tres archivos cargan como imagen a 16, 32 y 48 px en DPR 1 y 2, sobre `#202124` y sobre blanco. No se probó Safari ni Firefox (no disponibles en este entorno); ambos consumen el `.ico` y el `apple-touch-icon`, que son los caminos convencionales.
