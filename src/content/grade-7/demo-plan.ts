/**
 * El demo docente de 7.º grado.
 *
 * Lo que alguien pone en una pantalla para mostrar de qué se trata Egresado: el
 * año entero, sus siete situaciones, sus seis interacciones y —lo que este demo
 * existe para mostrar— **una misma familia haciendo dos preguntas distintas**.
 *
 * No es una partida. Una partida de 7.º juega uno o dos beats ordinarios, y ese
 * techo es la razón por la que una carrera de seis años se puede volver a
 * jugar. El demo juega siete y por eso está declarado como otra cosa: no es una
 * run larga ni una run con el presupuesto aflojado, es un artefacto distinto
 * con reglas propias. `validateDemoPlan` exige que supere el presupuesto de una
 * run justamente para que nadie pueda confundirlos, y hay un test que comprueba
 * que este plan **no** es un stage plan válido.
 *
 * Todas las direcciones son variantes **curadas** que además están en el
 * catálogo aprobado vigente: el demo muestra contenido que pasó el pipeline, no
 * contenido de vitrina. Un test lo verifica contra el catálogo.
 */

import { toChallengeId, toVariantId, type DemoPlan } from '@/game'
import {
  BUS_FAMILY,
  GROUP_PROJECT_FAMILY,
  MAY_25_FAMILY,
  MURAL_FAMILY,
  NOTEBOOK_FAMILY,
  SCHOOL_FAIR_FAMILY,
} from './families'

export const GRADE_7_DEMO_PLAN_ID = 'grade-7-teacher-demo-1'

export const grade7TeacherDemoPlan: DemoPlan = {
  id: GRADE_7_DEMO_PLAN_ID,
  stageId: 'grade-7',
  entries: [
    {
      variant: {
        familyId: BUS_FAMILY,
        templateId: toChallengeId('g7.bus-timing'),
        variantId: toVariantId('demora-25'),
      },
      showcases:
        'La situación del año: el colectivo viene con demora y hay que elegir a qué salida subirse. El trabajo es descartar opciones.',
    },
    {
      variant: {
        familyId: BUS_FAMILY,
        templateId: toChallengeId('g7.bus-latest-departure'),
        variantId: toVariantId('margen-10'),
      },
      showcases:
        'La misma situación, la pregunta al revés: no hay opciones y hay que producir el número. Es el contraste que muestra para qué sirve agrupar por familia.',
    },
    {
      variant: {
        familyId: MAY_25_FAMILY,
        templateId: toChallengeId('g7.may-25-act'),
        variantId: toVariantId('coreografia-a'),
      },
      showcases:
        'El acto: clasificar por una regla delante de todo el colegio. Es el único momento que mueve Aura y el único que se juzga con F1.',
    },
    {
      variant: {
        familyId: MURAL_FAMILY,
        templateId: toChallengeId('g7.mural-paint'),
        variantId: toVariantId('pared-6x24'),
      },
      showcases:
        'La evaluación del trimestre: área y envases enteros. Un checkpoint gasta un beat como cualquier otro y además pone nota.',
    },
    {
      variant: {
        familyId: NOTEBOOK_FAMILY,
        templateId: toChallengeId('g7.notebook-offer'),
        variantId: toVariantId('precio-alto'),
      },
      showcases:
        'Porcentaje contra descuento fijo con la plata contada: comparar dos ofertas que no se comparan solas.',
    },
    {
      variant: {
        familyId: GROUP_PROJECT_FAMILY,
        templateId: toChallengeId('g7.group-tasks'),
        variantId: toVariantId('equipo-a'),
      },
      showcases:
        'Repartir el trabajo entre cuatro personas con tiempos y fuerzas distintas. Sus parámetros son contenido escrito, no generado, y se muestra tal cual.',
    },
    {
      variant: {
        familyId: SCHOOL_FAIR_FAMILY,
        templateId: toChallengeId('g7.stand-supplies'),
        variantId: toVariantId('porciones-24'),
      },
      showcases:
        'El cierre del año: packs, mínimo requerido y presupuesto. La optimización con restricciones que el año venía preparando.',
    },
  ],
}
