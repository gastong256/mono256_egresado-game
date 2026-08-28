/**
 * Colores de marca en hexadecimal.
 *
 * Hay dos lugares donde un color no puede ser una variable CSS: el `theme_color`
 * del manifiesto y el `themeColor` del viewport. El browser los lee antes de que
 * exista una hoja de estilos, así que necesitan un literal.
 *
 * Estos son la copia de los tokens de `src/styles/tokens.css`, y hay un test que
 * falla si dejan de coincidir. Es la única copia permitida: cualquier otro color
 * del producto se consume por su nombre semántico.
 */

export const BRAND_HEX = {
  /** `--color-paper`: la hoja cuadriculada, que es el fondo de todo. */
  canvas: '#f6f5f0',
  /** `--color-bottle-600`: el verde escolar de estado y marca de corrección. */
  green: '#1b6b3a',
  /** `--color-ink-900`: la tinta. */
  ink: '#16181a',
} as const
