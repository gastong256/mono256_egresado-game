/**
 * DEVELOPMENT FIXTURE — not final Egresado content.
 *
 * The "notebook" scenario: a percentage discount, a fixed discount and an
 * instalment plan compete, and the available cash is a hard constraint. The
 * mathematics is percentages against absolute amounts; the trap is that the
 * larger-sounding percentage is not always the cheaper offer.
 *
 * All money is handled in integer minor units, so no currency value is ever a
 * decimal and no rounding error can decide the outcome.
 */

import { toChallengeId, toVariantId } from '../../../core/branded'
import { DEV_NOTEBOOK_FAMILY } from '../families'
import { err, ok, type Result } from '../../../core/result'
import type { EngineRejection } from '../../../core/errors'
import {
  defineChallenge,
  type ChallengeDefinition,
  type ChallengeEvaluation,
} from '../../../challenges/contracts'
import { efficiencyFromUsage, metrics } from '../../../challenges/evaluation'
import type { InteractionAnswer } from '../../../challenges/interactions'
import { fromInteger } from '../../../math/rational'
import { formatMoney, money } from '../../../math/quantity'

interface Offer {
  readonly id: string
  readonly labelKey: string
  readonly description: string
  readonly totalMinor: number
}

interface NotebookModel {
  readonly listPriceMinor: number
  readonly percentOff: number
  readonly fixedOffMinor: number
  readonly instalments: number
  readonly surchargePercent: number
  readonly cashAvailableMinor: number
  readonly offers: readonly Offer[]
}

export const notebookDiscount: ChallengeDefinition =
  defineChallenge<NotebookModel>({
    id: toChallengeId('dev.notebook-discount'),
    family: DEV_NOTEBOOK_FAMILY,
    placement: 'anchor',
    variants: [toVariantId('base')],
    interaction: 'decision-card',
    categories: ['proportions-and-percentages', 'quantity'],
    stages: ['year-1', 'year-2'],
    baseDifficulty: 3,
    tools: ['calculator'],

    generate({ rng, difficulty }) {
      // Prices are drawn in whole thousands of minor units to keep the
      // arithmetic legible while staying exact.
      const listPriceMinor = rng.nextInt(280, 720) * 1000
      const percentOff = rng.pick(difficulty >= 3 ? [12, 15, 18, 22] : [10, 20])
      const instalments = rng.pick([3, 6])
      const surchargePercent = rng.nextInt(6, 18)

      // The fixed discount is generated near the percentage discount so the two
      // offers are genuinely close and the comparison is not decorative.
      const percentValue = Math.round((listPriceMinor * percentOff) / 100)
      const drift = rng.nextInt(-9, 9) * 1000
      const fixedOffMinor = Math.max(1000, percentValue + drift)

      const percentTotal = listPriceMinor - percentValue
      // Nudge the fixed offer whenever the drift lands it exactly on the
      // percentage offer: two identical totals would make the comparison a
      // coin flip rather than a calculation.
      const fixedTotalRaw = listPriceMinor - fixedOffMinor
      const fixedTotal =
        fixedTotalRaw === percentTotal ? fixedTotalRaw - 1000 : fixedTotalRaw
      const instalmentTotalRaw = Math.round(
        (listPriceMinor * (100 + surchargePercent)) / 100,
      )
      const instalmentTotal =
        instalmentTotalRaw === percentTotal || instalmentTotalRaw === fixedTotal
          ? instalmentTotalRaw + 1000
          : instalmentTotalRaw

      // Cash sits between the cheapest and the most expensive offer so at least
      // one option is affordable and at least one is not.
      const cheapest = Math.min(percentTotal, fixedTotal)
      const cashAvailableMinor =
        cheapest +
        rng.nextInt(0, Math.max(1, instalmentTotal - cheapest - 1000))

      const offers: readonly Offer[] = [
        {
          id: 'percent',
          labelKey: 'offer.percent',
          description: `${String(percentOff)} % de descuento`,
          totalMinor: percentTotal,
        },
        {
          id: 'fixed',
          labelKey: 'offer.fixed',
          description: `$ ${formatMoney(money(fixedOffMinor))} de descuento`,
          totalMinor: fixedTotal,
        },
        {
          id: 'instalments',
          labelKey: 'offer.instalments',
          description: `${String(instalments)} cuotas con ${String(surchargePercent)} % de recargo`,
          totalMinor: instalmentTotal,
        },
      ]

      return {
        listPriceMinor,
        percentOff,
        fixedOffMinor,
        instalments,
        surchargePercent,
        cashAvailableMinor,
        offers,
      }
    },

    verify(model) {
      const issues: string[] = []
      const affordable = model.offers.filter(
        (offer) => offer.totalMinor <= model.cashAvailableMinor,
      )

      if (affordable.length === 0) {
        issues.push('no offer fits the available cash')
      }
      if (affordable.length === model.offers.length) {
        issues.push('every offer fits, so the cash constraint does nothing')
      }
      if (model.offers.some((offer) => offer.totalMinor <= 0)) {
        issues.push('offer totals must stay positive')
      }

      const distinct = new Set(model.offers.map((offer) => offer.totalMinor))
      if (distinct.size !== model.offers.length) {
        issues.push(
          'two offers cost exactly the same, which misleads the player',
        )
      }

      return issues
    },

    narrate() {
      return {
        title: 'La notebook',
        setup:
          'El curso junta plata para una notebook y hay tres formas de pagarla.',
        goal: 'Elegí la opción que se pueda pagar y cueste menos en total.',
      }
    },

    present(model) {
      return {
        kind: 'decision-card',
        data: [
          {
            label: 'Precio de lista',
            value: `$ ${formatMoney(money(model.listPriceMinor))}`,
          },
          {
            label: 'Plata disponible',
            value: `$ ${formatMoney(money(model.cashAvailableMinor))}`,
          },
        ],
        options: model.offers.map((offer) => ({
          id: offer.id,
          label: offer.description,
          detail: `Total $ ${formatMoney(money(offer.totalMinor))}`,
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
          detail: `expected decision-card, received ${answer.kind}`,
        })
      }

      const chosen = model.offers.find((offer) => offer.id === answer.optionId)
      if (chosen === undefined) {
        return err({
          kind: 'invalid-answer',
          detail: `unknown option ${answer.optionId}`,
        })
      }

      const affordable = model.offers.filter(
        (offer) => offer.totalMinor <= model.cashAvailableMinor,
      )
      const bestTotal = Math.min(...affordable.map((offer) => offer.totalMinor))
      const facts = [
        {
          label: 'Elegiste',
          value: `$ ${formatMoney(money(chosen.totalMinor))}`,
        },
        {
          label: 'Plata disponible',
          value: `$ ${formatMoney(money(model.cashAvailableMinor))}`,
        },
      ]

      if (chosen.totalMinor > model.cashAvailableMinor) {
        const missing = chosen.totalMinor - model.cashAvailableMinor
        return ok({
          quality: 'invalid',
          feedback: {
            outcomeKey: 'notebook.unaffordable',
            facts: [
              ...facts,
              { label: 'Faltaban', value: `$ ${formatMoney(money(missing))}` },
            ],
            violatedConstraint: 'cash-available',
          },
          metrics: metrics({ efficiency: 0, precision: 0, risk: 0.5 }),
          careerEffects: { estilo: { axis: 'improvisador', amount: 6 } },
          flagEffects: [{ flag: 'notebook.overspent', value: true }],
        })
      }

      const efficiency = efficiencyFromUsage(
        fromInteger(bestTotal),
        fromInteger(chosen.totalMinor),
      )

      if (chosen.totalMinor === bestTotal) {
        return ok({
          quality: 'optimal',
          feedback: {
            outcomeKey: 'notebook.optimal',
            facts,
            optimalComparison:
              'Fue la opción más barata entre las que se podían pagar.',
          },
          metrics: metrics({ efficiency, precision: 1, risk: 0 }),
          careerEffects: { equipo: 2, estilo: { axis: 'aplicado', amount: 6 } },
          flagEffects: [{ flag: 'notebook.bestDeal', value: true }],
        })
      }

      const overpaid = chosen.totalMinor - bestTotal
      return ok({
        quality: 'functional',
        feedback: {
          outcomeKey: 'notebook.functional',
          facts: [
            ...facts,
            {
              label: 'Pagaste de más',
              value: `$ ${formatMoney(money(overpaid))}`,
            },
          ],
          optimalComparison: `La más barata costaba $ ${formatMoney(money(bestTotal))}.`,
        },
        metrics: metrics({ efficiency, precision: 1, risk: 0 }),
        careerEffects: { estilo: { axis: 'aplicado', amount: 6 } },
        flagEffects: [],
      })
    },
  })
