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
  /** `--color-gray-50`, el lienzo de la aplicación. */
  canvas: '#f5f8f6',
  /** `--color-green-600`, el verde de marca. */
  primary: '#148043',
  /** `--color-gray-900`, la tinta del texto. */
  ink: '#333734',
} as const
