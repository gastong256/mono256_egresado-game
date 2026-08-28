/**
 * DEVELOPMENT FIXTURE — not final Egresado content.
 *
 * The "encuesta" scenario: two surveys disagree, and the sample sizes are
 * hidden until the player asks for them. The mathematics is sample size against
 * percentage difference; the decision is whether the evidence justifies
 * changing the campaign.
 *
 * This fixture is the one that exercises the `REQUEST_INFO` command and the
 * `informationUse` metric: deciding without looking is allowed, but it is a
 * gamble rather than a reasoned choice.
 */

import { toChallengeId, toVariantId } from '../../../core/branded'
import { DEV_SCHOOL_DATA_FAMILY } from '../families'
import { err, ok, type Result } from '../../../core/result'
import type { EngineRejection } from '../../../core/errors'
import {
  defineChallenge,
  type ChallengeDefinition,
  type ChallengeEvaluation,
} from '../../../challenges/contracts'
import { informationUseRatio, metrics } from '../../../challenges/evaluation'
import type { InteractionAnswer } from '../../../challenges/interactions'

interface SurveyModel {
  readonly optionALabel: string
  readonly optionBLabel: string
  readonly supportAPercent: number
  readonly supportBPercent: number
  readonly sampleA: number
  readonly sampleB: number
  /** The survey a reasoned player should trust: the much larger sample. */
  readonly trustworthy: 'survey-a' | 'survey-b'
}

const INFO_SAMPLE_A = 'sample-a'
const INFO_SAMPLE_B = 'sample-b'

/** Everything the player may reveal before deciding. */
const REQUESTABLE = [
  { key: INFO_SAMPLE_A, label: '¿A cuántos respondió la primera?' },
  { key: INFO_SAMPLE_B, label: '¿A cuántos respondió la segunda?' },
] as const

export const surveyConfidence: ChallengeDefinition =
  defineChallenge<SurveyModel>({
    id: toChallengeId('dev.survey-confidence'),
    family: DEV_SCHOOL_DATA_FAMILY,
    placement: 'anchor',
    variants: [toVariantId('base')],
    interaction: 'information-request',
    categories: ['data-and-statistics', 'probability-and-uncertainty'],
    stages: ['year-4', 'year-5'],
    baseDifficulty: 4,
    tools: ['calculator'],

    generate({ rng }) {
      // The small survey shows the more dramatic result, so the headline number
      // points the opposite way from the evidence.
      const bigSample = rng.nextInt(380, 900)
      const smallSample = rng.nextInt(24, 70)
      const bigSupport = rng.nextInt(44, 56)
      const smallSupport = bigSupport + rng.pick([-1, 1]) * rng.nextInt(14, 26)

      const bigIsA = rng.chance(1, 2)

      return {
        optionALabel: 'Encuesta del centro de estudiantes',
        optionBLabel: 'Encuesta en el recreo',
        supportAPercent: bigIsA ? bigSupport : smallSupport,
        supportBPercent: bigIsA ? smallSupport : bigSupport,
        sampleA: bigIsA ? bigSample : smallSample,
        sampleB: bigIsA ? smallSample : bigSample,
        trustworthy: bigIsA ? 'survey-a' : 'survey-b',
      }
    },

    verify(model) {
      const issues: string[] = []
      const ratio =
        Math.max(model.sampleA, model.sampleB) /
        Math.min(model.sampleA, model.sampleB)

      if (ratio < 4) {
        issues.push(
          'sample sizes are too close for one survey to be clearly better evidence',
        )
      }
      if (model.supportAPercent === model.supportBPercent) {
        issues.push('both surveys agree, so there is nothing to decide')
      }
      for (const percent of [model.supportAPercent, model.supportBPercent]) {
        if (percent < 0 || percent > 100) {
          issues.push(`support percentage out of range: ${String(percent)}`)
        }
      }

      return issues
    },

    narrate() {
      return {
        title: 'Dos encuestas',
        setup:
          'Dos encuestas del colegio dan resultados distintos sobre la misma propuesta.',
        goal: 'Decidí a qué resultado conviene hacerle caso.',
      }
    },

    requestable() {
      return REQUESTABLE
    },

    present(model, revealed) {
      const revealedData = []
      if (revealed.includes(INFO_SAMPLE_A)) {
        revealedData.push({
          label: 'Respondieron (primera)',
          value: String(model.sampleA),
        })
      }
      if (revealed.includes(INFO_SAMPLE_B)) {
        revealedData.push({
          label: 'Respondieron (segunda)',
          value: String(model.sampleB),
        })
      }

      return {
        kind: 'information-request',
        data: [
          {
            label: model.optionALabel,
            value: `${String(model.supportAPercent)} % a favor`,
          },
          {
            label: model.optionBLabel,
            value: `${String(model.supportBPercent)} % a favor`,
          },
        ],
        // Only what is still unrevealed is offered, so the UI never invites a
        // request the engine would treat as a no-op.
        available: REQUESTABLE.filter((entry) => !revealed.includes(entry.key)),
        revealed: revealedData,
        options: [
          { id: 'survey-a', label: 'Confiar en la primera encuesta' },
          { id: 'survey-b', label: 'Confiar en la segunda encuesta' },
          {
            id: 'neither',
            label: 'No alcanza la evidencia para cambiar la campaña',
          },
        ],
      }
    },

    evaluate(
      model,
      answer: InteractionAnswer,
      revealed,
    ): Result<ChallengeEvaluation, EngineRejection> {
      if (answer.kind !== 'information-request') {
        return err({
          kind: 'invalid-answer',
          detail: `expected information-request, received ${answer.kind}`,
        })
      }

      const valid = ['survey-a', 'survey-b', 'neither']
      if (!valid.includes(answer.optionId)) {
        return err({
          kind: 'invalid-answer',
          detail: `unknown option ${answer.optionId}`,
        })
      }

      const consulted = revealed.filter(
        (key) => key === INFO_SAMPLE_A || key === INFO_SAMPLE_B,
      ).length
      const informationUse = informationUseRatio(consulted, 2)
      const facts = [
        { label: 'Primera encuesta', value: String(model.sampleA) },
        { label: 'Segunda encuesta', value: String(model.sampleB) },
        {
          label: 'Datos consultados',
          value: `${String(consulted)} de 2`,
        },
      ]

      if (answer.optionId === model.trustworthy) {
        // Choosing correctly without looking is a lucky guess, not reasoning:
        // the quality reflects the evidence the player actually gathered.
        const reasoned = consulted === 2
        return ok({
          quality: reasoned ? 'optimal' : 'functional',
          feedback: {
            outcomeKey: reasoned ? 'survey.reasoned' : 'survey.luckyGuess',
            facts,
            optimalComparison:
              'La muestra más grande sostiene mejor la conclusión.',
          },
          metrics: metrics({
            efficiency: reasoned ? 1 : 0.5,
            precision: 1,
            risk: reasoned ? 0.1 : 0.7,
            informationUse,
          }),
          careerEffects: reasoned
            ? { estilo: { axis: 'estratega', amount: 6 } }
            : { estilo: { axis: 'aplicado', amount: 6 } },
          flagEffects: [{ flag: 'survey.trustedEvidence', value: true }],
        })
      }

      if (answer.optionId === 'neither') {
        // Refusing to act on weak evidence is defensible, but the larger sample
        // was in fact good enough to decide.
        return ok({
          quality: 'functional',
          feedback: {
            outcomeKey: 'survey.abstained',
            facts,
            optimalComparison:
              'Una de las encuestas tenía muestra suficiente para decidir.',
          },
          metrics: metrics({
            efficiency: 0.4,
            precision: 0.5,
            risk: 0,
            informationUse,
          }),
          careerEffects: { estilo: { axis: 'aplicado', amount: 6 } },
          flagEffects: [{ flag: 'survey.abstained', value: true }],
        })
      }

      return ok({
        quality: 'invalid',
        feedback: {
          outcomeKey: 'survey.smallSample',
          facts,
          violatedConstraint: 'sample-size',
          optimalComparison:
            'Le hiciste caso a la encuesta con muestra mucho más chica.',
        },
        metrics: metrics({
          efficiency: 0,
          precision: 0,
          risk: 0.9,
          informationUse,
        }),
        careerEffects: { equipo: -2 },
        flagEffects: [{ flag: 'survey.misread', value: true }],
      })
    },
  })
