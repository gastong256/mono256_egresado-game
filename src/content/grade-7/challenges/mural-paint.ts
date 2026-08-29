/**
 * 7.º grado — el mural de la feria.
 *
 * Situación: hay que comprar la pintura para el mural del curso.
 *
 * La matemática es área y cobertura. La pregunta no es "¿cuánto es 6 × 2,4?":
 * es qué envase comprar, y para eso hace falta saber cuántos metros hay que
 * cubrir y cuánto rinde un litro.
 *
 * Función objetivo: cubrir la pared entera gastando lo menos posible. Un litro
 * no alcanza; cuatro alcanzan pero sobra pintura y plata.
 */

import {
  defineChallenge,
  divide,
  efficiencyFromUsage,
  err,
  fromDecimalString,
  fromInteger,
  greaterThanOrEqual,
  metrics,
  multiply,
  ok,
  subtract,
  authoredVariantIds,
  toChallengeId,
  type ChallengeDefinition,
  type ChallengeEvaluation,
  type EngineRejection,
  type InteractionAnswer,
  type Rational,
  type Result,
} from '@/game'
import { muralPaintVariants, type MuralParams } from './mural-paint.variants'
import { MURAL_FAMILY } from '../families'
import { cifra, medida } from '@/content/numeros'

import { pesos } from '../../pesos'

interface PaintTin {
  readonly id: string
  readonly litres: Rational
  readonly priceMinor: number
}

interface MuralModel {
  readonly width: Rational
  readonly height: Rational
  readonly coveragePerLitre: Rational
  readonly area: Rational
  readonly requiredLitres: Rational
  readonly tins: readonly PaintTin[]
}

/**
 * Dos paredes autoradas. Las dos necesitan más de un litro y menos de cuatro,
 * así que en ambas el envase de 2 L es el que resuelve mejor.
 */
/** Identidad estable de la plantilla. */
const MURAL_PAINT_ID = toChallengeId('g7.mural-paint')

/** Envases reales de una pinturería, con precio por litro decreciente. */
const TINS = [
  { id: 'lata-1l', litres: '1', priceMinor: 1_200_000 },
  { id: 'lata-2l', litres: '2', priceMinor: 2_100_000 },
  { id: 'lata-4l', litres: '4', priceMinor: 3_800_000 },
] as const

export const muralPaint: ChallengeDefinition = defineChallenge<
  MuralModel,
  MuralParams
>({
  id: MURAL_PAINT_ID,
  family: MURAL_FAMILY,
  placement: 'checkpoint',
  variants: authoredVariantIds(muralPaintVariants.authored),
  variantSource: muralPaintVariants,
  interaction: 'decision-card',
  categories: ['space-and-shape', 'quantity'],
  stages: ['grade-7'],
  baseDifficulty: 2,
  // Área, litros por metro y envases enteros: tres pasos encadenados donde
  // perder el intermedio pierde el problema. La restricción es cubrir la pared;
  // la optimización, no comprar de más.
  cognitive: {
    steps: 3,
    constraints: 1,
    selection: 1,
    optimization: 1,
    uncertainty: 0,
    construction: 0,
  },
  // La eficiencia que el evaluador reporta *es* el óptimo de compra, no un
  // segundo hecho: leerla como otra componente cobraría dos veces la misma
  // cuenta.
  scoring: {
    math: 'discrete-quality',
    team: 'none',
    aura: 'none',
    rationale:
      'Área, litros y envases enteros son una sola cadena; la eficiencia reportada es ese mismo óptimo y no una señal independiente.',
  },
  tools: ['calculator'],

  generate({ params }) {
    const width = fromDecimalString(params.width)
    const height = fromDecimalString(params.height)
    const coveragePerLitre = fromInteger(params.coverage)
    const area = multiply(width, height)

    return {
      width,
      height,
      coveragePerLitre,
      area,
      requiredLitres: divide(area, coveragePerLitre),
      tins: TINS.map((tin) => ({
        id: tin.id,
        litres: fromDecimalString(tin.litres),
        priceMinor: tin.priceMinor,
      })),
    }
  },

  verify(model) {
    const issues: string[] = []
    const sufficient = model.tins.filter((tin) =>
      greaterThanOrEqual(tin.litres, model.requiredLitres),
    )

    if (sufficient.length === 0) {
      issues.push('ningún envase alcanza para la pared')
    }
    if (sufficient.length === model.tins.length) {
      issues.push('todos los envases alcanzan, así que la decisión no importa')
    }
    if (model.coveragePerLitre.n <= 0n) {
      issues.push('el rendimiento por litro tiene que ser positivo')
    }
    if (
      new Set(model.tins.map((tin) => tin.priceMinor)).size !==
      model.tins.length
    ) {
      issues.push('dos envases cuestan lo mismo')
    }

    return issues
  },

  narrate() {
    return {
      title: 'El mural del curso',
      setup:
        'Para la feria el curso va a pintar un mural en la pared del fondo. Falta comprar la pintura y la plata del curso no es infinita.',
      goal: 'Elegí el envase que alcance para toda la pared.',
    }
  },

  present(model) {
    return {
      kind: 'decision-card',
      // La unidad va aparte de la cifra: en la caja de dato el número tiene que
      // poder leerse solo, y `6 × 2,4` con «metros» debajo se lee de un golpe
      // donde `6 m × 2,4 m` obliga a filtrar los símbolos.
      data: [
        {
          label: 'Pared',
          value: `${medida(model.width, 1)} × ${medida(model.height, 1)}`,
          unit: 'metros',
        },
        {
          label: 'Rinde',
          value: cifra(model.coveragePerLitre, 0),
          unit: 'm² por litro',
        },
      ],
      options: model.tins.map((tin) => ({
        id: tin.id,
        label: `${cifra(tin.litres, 0)} litro${tin.litres.n === 1n ? '' : 's'}`,
        detail: pesos(tin.priceMinor),
      })),
    }
  },

  evaluate(
    model,
    answer: InteractionAnswer,
  ): Result<ChallengeEvaluation, EngineRejection> {
    if (answer.kind !== 'decision-card') {
      return err({
        kind: 'invalid-answer',
        detail: `se esperaba decision-card y llegó ${answer.kind}`,
      })
    }

    const chosen = model.tins.find((tin) => tin.id === answer.optionId)
    if (chosen === undefined) {
      return err({
        kind: 'invalid-answer',
        detail: `envase desconocido ${answer.optionId}`,
      })
    }

    const sufficient = model.tins.filter((tin) =>
      greaterThanOrEqual(tin.litres, model.requiredLitres),
    )
    const cheapest = Math.min(...sufficient.map((tin) => tin.priceMinor))

    const facts = [
      { label: 'Superficie', value: `${cifra(model.area, 2)} m²` },
      {
        label: 'Pintura necesaria',
        value: `${cifra(model.requiredLitres, 2)} L`,
      },
      {
        label: 'Compraste',
        value: `${cifra(chosen.litres, 0)} L`,
      },
    ]

    if (!greaterThanOrEqual(chosen.litres, model.requiredLitres)) {
      const missing = subtract(model.requiredLitres, chosen.litres)
      const uncovered = multiply(missing, model.coveragePerLitre)

      return ok({
        quality: 'invalid',
        feedback: {
          outcomeKey: 'mural.insufficient',
          stamp: 'No alcanzó',
          facts: [
            ...facts,
            {
              label: 'Quedó sin pintar',
              value: `${cifra(uncovered, 2)} m²`,
            },
          ],
          violatedConstraint: 'cubrir la pared',
          consequence:
            'El mural queda a medias el día de la feria y hay que taparlo con un afiche.',
        },
        metrics: metrics({
          efficiency: 0,
          precision: 0.3,
          risk: 0.4,
        }),
        // El mural es el único evento académico de 7.º: la profesora lo toma
        // como parte del trabajo del trimestre, así que pone nota. Las tres notas
        // están autoradas para que el promedio del año caiga donde el diseño de
        // referencia lo muestra.
        careerEffects: {
          grade: 7.4,
          estilo: { axis: 'improvisador', amount: 10 },
        },
        flagEffects: [{ flag: 'g7.muralFaltoPintura', value: true }],
      })
    }

    const leftover = subtract(chosen.litres, model.requiredLitres)
    const efficiency = efficiencyFromUsage(model.requiredLitres, chosen.litres)
    const leftoverFact = {
      label: 'Sobró',
      value: `${cifra(leftover, 2)} L`,
    }

    if (chosen.priceMinor === cheapest) {
      return ok({
        quality: 'optimal',
        feedback: {
          outcomeKey: 'mural.optimal',
          stamp: 'Alcanzó',
          facts: [...facts, leftoverFact],
          optimalComparison:
            'Era el envase más barato entre los que alcanzaban para toda la pared.',
          consequence:
            'El mural queda listo y la profesora lo toma como parte del trabajo del trimestre.',
        },
        metrics: metrics({ efficiency, precision: 1, risk: 0 }),
        careerEffects: {
          grade: 8.4,
          estilo: { axis: 'estratega', amount: 10 },
        },
        flagEffects: [{ flag: 'g7.muralOptimo', value: true }],
      })
    }

    const overpaid = chosen.priceMinor - cheapest
    return ok({
      quality: 'functional',
      feedback: {
        outcomeKey: 'mural.oversized',
        stamp: 'Alcanzó',
        facts: [
          ...facts,
          leftoverFact,
          { label: 'De más', value: pesos(overpaid) },
        ],
        optimalComparison: `Con el envase de ${pesos(cheapest)} alcanzaba igual.`,
        consequence:
          'El mural queda listo, pero la plata que sobró era para el resto de la feria.',
      },
      metrics: metrics({ efficiency, precision: 1, risk: 0 }),
      careerEffects: {
        grade: 8.1,
        estilo: { axis: 'improvisador', amount: 10 },
      },
      flagEffects: [{ flag: 'g7.muralPintado', value: true }],
    })
  },
})

/** Expuesto para los tests de contenido. */
export const muralPaintReference = {
  variants: muralPaintVariants.authored,
  tins: TINS,
}
