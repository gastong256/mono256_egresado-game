/**
 * Las versiones del content set de 7.º grado.
 *
 * Viven aparte del ensamblado para que el módulo de catálogos pueda leer qué
 * versión está vigente sin cerrar un ciclo de imports con él.
 */

/*
 * El contenido sube a 0.8.0 con el perfil de score: cada plantilla declara ahora
 * qué hecho suyo lee cada componente competitiva —y cuál no lee ninguna—. No
 * cambia qué produce un seed, pero sí cuánto vale una run, así que es identidad
 * de contenido y la huella lo cubre.
 *
 * El contexto anterior, de cuando el contenido subió a 0.7.0 con el modelo de
 * dificultad cognitiva: cada
 * plantilla declara ahora qué la vuelve exigente —pasos, restricciones,
 * selección, optimización, incertidumbre y si la respuesta hay que construirla—
 * y de ahí sale la banda con la que el compositor la agenda. La matemática no se
 * tocó, pero esa metadata decide qué beat entra en un año, así que es identidad
 * de contenido y la huella la cubre.
 *
 * El ruleset de la demo se queda en 0.3.0: sus políticas y su configuración de
 * etapa son las mismas, y una partida sin compositor juega exactamente igual.
 *
 * El contexto anterior, de cuando el contenido subió a 0.4.0:
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
export const GRADE_7_CONTENT_VERSION = '0.8.0-grade-7'

/**
 * El ruleset de una partida **compuesta** de 7.º.
 *
 * Es otro ruleset, no otra versión del mismo, y la diferencia es de fondo: uno
 * juega el año entero como demostración y el otro juega el año que un jugador
 * jugaría dentro de una carrera de seis. Comparten contenido y motor; no
 * comparten qué es una run, y por eso no comparten identidad.
 */
export const GRADE_7_COMPOSED_RULESET_VERSION = '0.1.0-grade-7-composed'

/**
 * Versión del catálogo de variantes aprobadas que la partida usa hoy.
 *
 * Identifica un conjunto estable de variantes validadas. **No es el catálogo de
 * la feria**: es el de desarrollo, y el nombre lo dice. Congelar el catálogo
 * oficial de una competencia es una decisión de evento que todavía no se tomó.
 *
 * Una versión publicada no se edita. `grade-7-dev-2` existió porque la familia
 * colectivo ganó una segunda plantilla, y `grade-7-dev-3` existe porque el
 * contenido subió a `0.7.0-grade-7` con el modelo de dificultad cognitiva: el
 * catálogo declara contra qué versión de contenido se construyó, así que esa
 * línea cambió y editarla en el lugar habría reescrito un artefacto publicado.
 *
 * Las direcciones y las huellas de `dev-3` son las de `dev-2`, y las de `dev-4`
 * son las de `dev-3`: ningún generador se movió en ninguno de los dos casos.
 * Publicar al lado igual es lo correcto —la regla no admite excepciones
 * «chicas»— y hay un test que comprueba que la única diferencia entre versiones
 * consecutivas es contra qué contenido se construyeron.
 */
export const GRADE_7_VARIANT_CATALOG_VERSION = 'grade-7-dev-4'
