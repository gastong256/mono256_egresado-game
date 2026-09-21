import 'server-only'

import type { CompetitionDeploymentConfig } from './config'

/**
 * El aviso de privacidad, armado desde la configuración del despliegue.
 *
 * Nada de acá está inventado. El nombre de la institución, el contacto y el
 * domicilio salen de variables de entorno que el despliegue tiene que declarar,
 * y si faltan el arranque falla antes de renderizar una sola línea. Un aviso
 * con una escuela ficticia sería peor que no tener aviso: le diría a un chico a
 * quién reclamar y esa persona no existiría.
 *
 * El texto es de **información**, en el sentido del artículo 6 de la 25.326:
 * dice para qué se piden los datos, qué es público, quién los ve y cómo
 * pedir acceso, rectificación o supresión. No afirma que una tilde resuelva la
 * base legal del tratamiento —eso lo define la institución, no este código—, y
 * por eso el control del formulario es un reconocimiento de lectura y está
 * redactado como tal.
 */

export interface PrivacyNoticeSection {
  readonly heading: string
  readonly body: readonly string[]
}

export interface PrivacyNotice {
  readonly version: string
  readonly summary: readonly string[]
  readonly acknowledgement: string
  readonly sections: readonly PrivacyNoticeSection[]
}

export function buildPrivacyNotice(
  config: CompetitionDeploymentConfig,
): PrivacyNotice {
  const { privacy } = config

  return {
    version: privacy.noticeVersion,
    summary: [
      'En el ranking público se muestra únicamente tu alias.',
      'Tu nombre, tu año y tu documento los usan sólo los organizadores para validar los resultados.',
      'No guardamos tu número de documento completo: sólo los últimos cuatro dígitos.',
    ],
    acknowledgement: 'Leí para qué se piden estos datos y quién los usa.',
    sections: [
      {
        heading: 'Para qué pedimos estos datos',
        body: [
          `Para organizar la competencia de ${config.slug} y poder verificar quién ganó. El alias es para que puedas verte en el ranking; el nombre, el año o curso y los últimos cuatro dígitos del documento son para que un organizador pueda confirmar que el premio se entrega a la persona correcta.`,
          'No pedimos correo, teléfono, domicilio, fecha de nacimiento ni foto: para esta competencia no hacen falta.',
        ],
      },
      {
        heading: 'Qué es público y qué no',
        body: [
          'Público: tu alias, tu puntaje verificado y tu puesto.',
          'Privado: tu nombre y apellido, tu año o curso, tu división si la hubiera, y los últimos cuatro dígitos de tu documento. Nada de eso aparece en el ranking ni se envía al navegador de otra persona.',
        ],
      },
      {
        heading: 'Qué hacemos con tu documento',
        body: [
          'Tu número de documento no se guarda. Al enviarlo se transforma en una clave derivada con un secreto del servidor, que sirve para reconocerte si volvés a jugar desde otro dispositivo y no permite reconstruir el número.',
          'De ese número sólo se conservan los últimos cuatro dígitos, para que un organizador pueda verificarte en persona.',
        ],
      },
      {
        heading: 'Quién puede ver tus datos privados',
        body: [
          `Sólo las personas autorizadas por ${privacy.name} que tienen acceso a la herramienta de organización. Cada acceso y cada corrección quedan registrados.`,
        ],
      },
      {
        heading: 'Cuánto tiempo se conservan',
        body: [
          `Los datos privados se conservan hasta ${String(privacy.retentionDays)} días después del cierre de la competencia, el tiempo necesario para verificar resultados y entregar premios. Después se eliminan y quedan sólo el alias y el puntaje, que no identifican a nadie.`,
        ],
      },
      {
        heading: 'Cómo pedir acceso, corrección o eliminación',
        body: [
          `Escribí a ${privacy.contact} o acercate a ${privacy.address}. Podés pedir ver los datos que tenemos tuyos, corregirlos si hay un error o pedir que los borremos.`,
          `Responsable de los datos: ${privacy.name}.`,
        ],
      },
    ],
  }
}
