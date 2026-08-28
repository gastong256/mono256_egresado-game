/**
 * Las versiones del content set de 7.º grado.
 *
 * Viven aparte del ensamblado para que el módulo de catálogos pueda leer qué
 * versión está vigente sin cerrar un ciclo de imports con él.
 */

/*
 * El ruleset se queda en 0.3.0 y el contenido sube a 0.4.0, y esta vez las dos
 * versiones se separan a propósito.
 *
 * El contenido cambió: cada plantilla declara ahora su familia de escenario, su
 * rol de colocación y sus variantes con identidad propia, y la variante dejó de
 * elegirse dentro del generador para elegirse por dirección. La matemática de
 * los seis desafíos no se tocó, pero un seed puede caer en otra variante
 * autorada que antes, y eso es exactamente lo que la versión de contenido
 * existe para declarar.
 *
 * El ruleset **no** cambió: las políticas de score, dificultad y perfil y la
 * configuración de la etapa son las mismas. Subirlo también habría dicho que
 * cambió algo que no cambió.
 */
export const GRADE_7_RULESET_VERSION = '0.3.0-grade-7'
export const GRADE_7_CONTENT_VERSION = '0.6.0-grade-7'

/**
 * Versión del catálogo de variantes aprobadas que la partida usa hoy.
 *
 * Identifica un conjunto estable de variantes validadas. **No es el catálogo de
 * la feria**: es el de desarrollo, y el nombre lo dice. Congelar el catálogo
 * oficial de una competencia es una decisión de evento que todavía no se tomó.
 *
 * Una versión publicada no se edita. `grade-7-dev-2` existe porque la familia
 * colectivo ganó una segunda plantilla: cambiar `grade-7-dev-1` en el lugar
 * habría reescrito la historia de un conjunto que alguien pudo haber jugado.
 */
export const GRADE_7_VARIANT_CATALOG_VERSION = 'grade-7-dev-2'
