import { expect, it } from 'vitest'
import {
  createContentCatalog,
  createRun,
  serializeActionLog,
  parseActionLog,
  emptyActionLog,
  canonicalize,
  sha256Hex,
  ACTION_LOG_VERSION,
  SNAPSHOT_SCHEMA_VERSION,
} from '@/game'
import {
  createGrade1Dependencies,
  createGrade1RunDescriptor,
  grade1RecoveryContent,
} from '@/content/grade-1'
import { grade1StylePolicy } from '@/content/grade-1/authoring'
import { grade1NarrativeHooks } from '@/content/grade-1/career-facts'
import {
  contentFingerprint,
  rulesetFingerprint,
} from '@/game/ruleset/fingerprint'
import { compositionMetadataIssues } from '@/game/challenges/composition-metadata'
import {
  careerConstraintIssues,
  fullCareerV1Constraints,
} from '@/game/plan/career-constraints'
import { grade7Challenges } from '@/content/grade-7'

const deps = createGrade1Dependencies()
const fingerprint = () =>
  sha256Hex(
    canonicalize({
      content: contentFingerprint(
        deps.catalog,
        deps.storylets,
        grade1RecoveryContent,
      ),
      ruleset: rulesetFingerprint(deps.ruleset),
      style: grade1StylePolicy,
      hooks: grade1NarrativeHooks,
    }),
  )

it('pins Grade-1 content, mappings, composition and narrative policy identity together', () => {
  // Se movió con la remediación matemática del 2026-09-17: ruleset y contenido
  // `1.1.0-grade-1`, el feedback del Repaso de escala que ahora dice si sobra
  // una celda, y los cambios de 7.º (feedback de la notebook).
  expect(fingerprint()).toBe(
    '44cdca980989e688ada68ad9eb45491ee0ec5fcb7d61bb622ba0a83fcfd0cf71',
  )
})
it('metadata, global limits and recovery mapping changes all move their identity', () => {
  const original = contentFingerprint(
    deps.catalog,
    deps.storylets,
    grade1RecoveryContent,
  )
  expect(
    contentFingerprint(deps.catalog, deps.storylets, {
      ...grade1RecoveryContent,
      reviews: {},
    }),
  ).not.toBe(original)
  expect(
    contentFingerprint(deps.catalog, deps.storylets, {
      ...grade1RecoveryContent,
      debriefs: {},
    }),
  ).not.toBe(original)
  for (const patch of [
    { pacingClass: 'DEEP' as const },
    { interactionEngine: 'spatial-graph' as const },
    { primaryReasoningFamily: 'LOGIC_CLASSIFICATION' as const },
    { chronology: 999 },
    { eventCluster: 'cluster' },
    { recurringArc: 'PROJECT' as const },
  ]) {
    const catalog = createContentCatalog(
      deps.catalog.families,
      deps.catalog.templates.map((t) =>
        t.id === 'y1.mobile-data'
          ? { ...t, composition: { ...t.composition!, ...patch } }
          : t,
      ),
    )
    expect(
      contentFingerprint(catalog, deps.storylets, grade1RecoveryContent),
    ).not.toBe(original)
  }
  expect(
    rulesetFingerprint({
      ...deps.ruleset,
      composition: {
        ...deps.composition!,
        career: {
          ...deps.composition!.career!,
          projectArc: { min: 0, max: 1 },
        },
      },
    }),
  ).not.toBe(rulesetFingerprint(deps.ruleset))
})
it('rejects malformed metadata and career configuration, rather than treating typos as diversity', () => {
  const meta = deps.catalog.templates.find(
    (t) => t.id === 'y1.mobile-data',
  )!.composition!
  expect(compositionMetadataIssues(meta)).toEqual([])
  expect(
    compositionMetadataIssues({
      ...meta,
      chronology: Number.NaN,
      eventCluster: 'bad cluster',
    }),
  ).toHaveLength(2)
  expect(
    careerConstraintIssues({
      ...fullCareerV1Constraints,
      maxSearchNodes: Infinity,
      requiredStages: ['year-1', 'grade-7'],
      minDataOrLogic: -1,
    }),
  ).not.toEqual([])
})
it('uses new command codec but no redundant snapshot state; refuses old logs explicitly', () => {
  const d = createGrade1RunDescriptor('codec')
  if (!d.ok) throw new Error('no descriptor')
  expect(ACTION_LOG_VERSION).toBe(7)
  expect(SNAPSHOT_SCHEMA_VERSION).toBe(8)
  const encoded = serializeActionLog(emptyActionLog(d.value))
  if (typeof encoded !== 'object' || encoded === null)
    throw new Error('bad encoder')
  expect(parseActionLog({ ...encoded, version: 4 }).ok).toBe(false)
  expect(createRun(d.value, deps).ok).toBe(true)
})
it('Grade-7 overlay preserves accepted classifications and actual template implementation', () => {
  for (const original of grade7Challenges) {
    const combined = deps.catalog.template(original.id)!
    expect(combined.cognitive).toEqual(original.cognitive)
    expect(combined.band).toBe(original.band)
    expect(combined.variantSource).toBe(original.variantSource)
    expect(combined.materialize).toBe(original.materialize)
    expect(combined.scoring).toBe(original.scoring)
  }
})
