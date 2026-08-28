import localFont from 'next/font/local'

/**
 * Las dos familias del sistema.
 *
 * **Schibsted Grotesk** para títulos y datos; **Libre Franklin** para prosa. Son
 * las que fija el handoff v0.2 y no se sustituyen: la caja mixta de Schibsted en
 * los títulos es la mitad de lo que separa a Egresado de un juego de carrera
 * deportiva.
 *
 * Los archivos viven en el repositorio en lugar de bajarse en cada build. Las
 * dos son SIL Open Font License 1.1 —la licencia está al lado de cada archivo—,
 * así que redistribuirlas es explícitamente parte del permiso. A cambio se
 * consigue lo que `next/font/google` no puede dar: bytes fijados en el
 * lockfile del repositorio, un build que no depende de que Google responda, y
 * cero pedidos a un CDN en runtime.
 *
 * Son fuentes variables con el rango 400–900 completo en un solo archivo, así
 * que los cinco pesos que usa el sistema (400, 500, 600, 700, 800) no cuestan
 * cinco descargas. El subset es `latin`, que cubre todo el castellano rioplatense
 * —acentos, `ñ`, `¿`, `¡`— más los signos que el juego escribe de verdad: `×`,
 * `²`, `·`, el menos tipográfico `−` y la flecha `↑` de las tendencias de Estilo.
 */

export const schibstedGrotesk = localFont({
  src: './schibsted-grotesk-latin-variable.woff2',
  weight: '400 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-schibsted-grotesk',
  fallback: ['system-ui', 'sans-serif'],
  // Sin ajuste automático: la métrica del fallback no coincide y el «arreglo»
  // desplaza el título durante el swap en lugar de estabilizarlo.
  adjustFontFallback: false,
})

export const libreFranklin = localFont({
  src: './libre-franklin-latin-variable.woff2',
  weight: '400 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-libre-franklin',
  fallback: ['system-ui', 'sans-serif'],
  adjustFontFallback: false,
})

/** Las dos variables juntas, para el `<html>`. */
export const fontVariables = `${schibstedGrotesk.variable} ${libreFranklin.variable}`
