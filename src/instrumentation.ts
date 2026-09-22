/**
 * Arranque del servidor.
 *
 * `register()` corre una vez por instancia, antes del primer pedido, y hace las
 * dos cosas que tienen que pasar antes de que alguien pueda jugar:
 *
 * 1. **Comprobar la configuración de producción.** Un despliegue al que le falta
 *    el responsable de los datos, o que arrastra un secreto de ejemplo, tiene
 *    que morir acá y no a las once de la mañana del sábado. La alternativa —
 *    descubrirlo con el primer registro— cambia un error de arranque, que se
 *    lee en el log del deploy, por un error de producto, que se lee en la cara
 *    de un chico.
 *
 * 2. **Dejar escrita la identidad del release.** Una línea JSON con el id, la
 *    versión y la huella. Durante un incidente, «¿qué está desplegado?» es la
 *    primera pregunta, y tener la respuesta en el log evita contestarla desde
 *    la memoria de alguien.
 *
 * En un despliegue `local` no se exige nada: una máquina de desarrollo sin
 * competencia configurada tiene que poder levantar el juego, y la suite de
 * navegador corre un build de producción contra `127.0.0.1` a propósito.
 * Romperle el arranque a cualquiera de los dos no protege ninguna feria.
 */

export async function register(): Promise<void> {
  // Sólo el runtime de Node: el de Edge no tiene la configuración de servidor y
  // no sirve ninguna de estas rutas.
  if (process.env['NEXT_RUNTIME'] !== 'nodejs') return

  const { getServerEnvironment } = await import('@/config/env.server')
  const {
    assertProductionConfiguration,
    deploymentEnvironment,
    enforcesProductionConfiguration,
  } = await import('@/config/production')
  const { currentRelease, releaseFingerprint } = await import('@/release')

  const environment = getServerEnvironment()
  const release = currentRelease()

  if (enforcesProductionConfiguration(environment)) {
    assertProductionConfiguration(environment)
  }

  // `console.info` y no `process.stdout.write`: este archivo se compila también
  // para el runtime Edge, donde `process.stdout` no existe, y el build lo avisa
  // aunque la guarda de arriba impida que se ejecute. `console` está en los dos
  // runtimes y escribe la misma línea.
  console.info(
    JSON.stringify({
      scope: 'release',
      event: 'boot',
      outcome: 'ok',
      releaseId: release.releaseId,
      releaseVersion: release.releaseVersion,
      releaseChannel: release.releaseChannel,
      releaseFingerprint: releaseFingerprint(release),
      engineVersion: release.engine.engineVersion,
      rulesetVersion: release.edition.rulesetVersion,
      contentVersion: release.edition.contentVersion,
      variantCatalogVersion: release.edition.variantCatalogVersion,
      scoreVersion: release.score.policyVersion,
      migrationHead: release.database.migrationHead,
      nodeEnv: environment.NODE_ENV,
      environment: deploymentEnvironment(environment),
      // Si el despliegue atiende una competencia. El slug es un identificador
      // de edición, no un dato de nadie, pero tampoco hace falta publicarlo en
      // un log: alcanza con saber que hay una.
      competition: environment.EGRESADO_COMPETITION_SLUG !== undefined,
    }),
  )
}
