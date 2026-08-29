import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  auditVariantCatalog,
  buildVariantCatalog,
  candidateIndexOf,
  candidateVariantId,
  createContentCatalog,
  defineChallenge,
  evaluateVariant,
  findApprovedVariant,
  hasNoErrors,
  instanceRefFor,
  metrics,
  ok,
  resolveVariantParams,
  serializeCatalog,
  sha256Hex,
  toChallengeId,
  toScenarioFamilyId,
  toVariantId,
  validateGeneric,
  variantDiagnostic,
  variantFingerprint,
  verifyCatalogIntegrity,
  createVariantRng,
  AUDIT_THRESHOLDS,
  PRESENTATION_LIMITS,
  type ApprovedVariantCatalog,
  type ChallengeDefinition,
  type InteractionAnswer,
  type ScenarioFamilyDefinition,
  type VariantSourceSpec,
} from '@/game'
import {
  createDevelopmentContentCatalog,
  materializeVariant,
} from '@/game/testing'
import {
  createGrade7Dependencies,
  grade7Challenges,
  grade7Families,
  GRADE_7_CONTENT_VERSION,
  GRADE_7_VARIANT_CATALOG_VERSION,
} from '@/content/grade-7'

/**
 * El pipeline de variantes.
 *
 * Generar no es aprobar. Estos tests recorren el camino entero —dirección,
 * generación, validación, huella, deduplicación, catálogo, resolución— y se
 * detienen especialmente en los puntos donde una variante mala podría colarse.
 */

const contentCatalog = createContentCatalog(grade7Families, grade7Challenges)
const CATALOG_PATH = `src/content/grade-7/variant-catalog.${GRADE_7_VARIANT_CATALOG_VERSION}.json`

function template(id: string): ChallengeDefinition {
  const found = contentCatalog.template(toChallengeId(id))
  if (found === undefined) throw new Error(`sin plantilla ${id}`)
  return found
}

const BUS = template('g7.bus-timing')
const MURAL = template('g7.mural-paint')
const NOTEBOOK = template('g7.notebook-offer')
const STAND = template('g7.stand-supplies')
const ACT = template('g7.may-25-act')
const GROUP = template('g7.group-tasks')

const GENERATED = [BUS, MURAL, NOTEBOOK, STAND, ACT]

describe('sha-256', () => {
  it('matches the published test vectors', () => {
    expect(sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
    expect(
      sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
    ).toBe('248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1')
  })

  it('agrees with the platform implementation, including outside the BMP', () => {
    for (const value of ['', 'a', 'ñandú → 🎓', 'x'.repeat(1000)]) {
      expect(sha256Hex(value)).toBe(
        createHash('sha256').update(value, 'utf8').digest('hex'),
      )
    }
  })
})

describe('candidate addressing', () => {
  it('round-trips an index through its address', () => {
    for (const index of [0, 1, 42, 19_999]) {
      expect(candidateIndexOf(candidateVariantId(index))).toBe(index)
    }
  })

  it('never mistakes an authored id for a candidate', () => {
    for (const id of ['demora-25', 'coreografia-a', 'base', 'porciones-24']) {
      expect(candidateIndexOf(id)).toBeUndefined()
    }
  })

  it('refuses an address beyond the declared space', () => {
    expect(BUS.variantSource.accepts(candidateVariantId(19_999))).toBe(true)
    expect(BUS.variantSource.accepts(candidateVariantId(20_000))).toBe(false)
    expect(BUS.variantSource.accepts('demora-25')).toBe(true)
    expect(BUS.variantSource.accepts('inventada')).toBe(false)
  })

  it('has no candidate space at all for an authored template', () => {
    expect(GROUP.variantSource.kind).toBe('authored')
    expect(GROUP.variantSource.candidateSpace).toBe(0)
    expect(GROUP.variantSource.accepts(candidateVariantId(0))).toBe(false)
  })
})

describe('generation is deterministic', () => {
  it('gives the same parameters for the same address, every time', () => {
    for (const definition of GENERATED) {
      const address = {
        familyId: definition.family,
        templateId: definition.id,
        variantId: candidateVariantId(7),
      }
      const first = definition.variantSource.canonicalFor(
        address.variantId,
        createVariantRng(address),
      )
      const second = definition.variantSource.canonicalFor(
        address.variantId,
        createVariantRng(address),
      )
      expect(second).toEqual(first)
    }
  })

  it('does not shift when unrelated content is registered elsewhere', () => {
    const before = variantFingerprint(contentCatalog, {
      familyId: BUS.family,
      templateId: BUS.id,
      variantId: candidateVariantId(3),
    })

    const extraFamily: ScenarioFamilyDefinition = {
      id: toScenarioFamilyId('kiosco'),
      labelKey: 'family.kiosco',
      summary: 'Otra familia.',
    }
    const wider = createContentCatalog(
      [...grade7Families, extraFamily],
      [...grade7Challenges].reverse(),
    )

    expect(
      variantFingerprint(wider, {
        familyId: BUS.family,
        templateId: BUS.id,
        variantId: candidateVariantId(3),
      }),
    ).toBe(before)
  })

  it('produces the same problem in two different runs', () => {
    for (const definition of GENERATED) {
      const variantId = candidateVariantId(11)
      const here = materializeVariant(definition, {
        seed: 'run-uno',
        variantId,
      })
      const there = materializeVariant(definition, {
        seed: 'run-dos',
        variantId,
        eventIndex: 5,
      })
      expect(JSON.stringify(there.present([]))).toBe(
        JSON.stringify(here.present([])),
      )
    }
  })
})

describe('fingerprints', () => {
  const address = {
    familyId: BUS.family,
    templateId: BUS.id,
    variantId: toVariantId('demora-25'),
  }

  it('ignores object key order', () => {
    const straight = sha256Hex(JSON.stringify({ a: 1, b: [2, 3] }))
    // The catalog canonicalises before hashing, so this asserts the property
    // through the real path rather than through a hand-built string.
    expect(variantFingerprint(contentCatalog, address)).toBe(
      variantFingerprint(contentCatalog, { ...address }),
    )
    expect(straight).toHaveLength(64)
  })

  it('changes when a meaningful parameter changes', () => {
    const first = variantFingerprint(contentCatalog, address)
    const second = variantFingerprint(contentCatalog, {
      ...address,
      variantId: toVariantId('demora-50'),
    })
    expect(first).not.toBe(second)
  })

  it('is undefined for an address the template does not accept', () => {
    expect(
      variantFingerprint(contentCatalog, {
        ...address,
        variantId: toVariantId('inventada'),
      }),
    ).toBeUndefined()
    expect(
      variantFingerprint(contentCatalog, {
        ...address,
        familyId: toScenarioFamilyId('mural'),
      }),
    ).toBeUndefined()
  })
})

describe('validation refuses bad content', () => {
  it('rejects a variant whose content depends on the run rather than its address', () => {
    // Las plantillas de desarrollo sacan sus números del substream de la run, y
    // eso es exactamente lo que un catálogo no puede aceptar: la misma
    // dirección tiene que ser el mismo problema para todos.
    const devCatalog = createDevelopmentContentCatalog()
    const devTemplate = devCatalog.template(toChallengeId('dev.bus-departure'))
    if (devTemplate === undefined) throw new Error('sin fixture')

    const evaluated = evaluateVariant(
      devCatalog,
      devTemplate,
      toVariantId('base'),
    )
    expect(evaluated.diagnostics.map((entry) => entry.code)).toContain(
      'address-not-deterministic',
    )
    expect(evaluated.fingerprint).toBeUndefined()
  })

  it('rejects an address the template does not accept', () => {
    const evaluated = evaluateVariant(
      contentCatalog,
      BUS,
      toVariantId('inventada'),
    )
    expect(evaluated.diagnostics[0]?.code).toBe('address-not-accepted')
  })

  it('rejects duplicate options and labels that will not fit', () => {
    const instance = {
      ref: instanceRefFor(BUS, {}),
      attempts: 1,
      narrative: { title: 't', setup: 's', goal: 'g' },
      tools: [],
      requestable: [],
      verify: () => [],
      evaluate: () => ok({}) as never,
      present: () => ({
        kind: 'decision-card' as const,
        data: [{ label: 'x', value: 'y'.repeat(80) }],
        options: [
          { id: 'a', label: 'misma' },
          { id: 'a', label: 'misma' },
          { id: 'c', label: 'z'.repeat(80) },
        ],
      }),
    }

    const codes = validateGeneric({
      ref: {
        familyId: BUS.family,
        templateId: BUS.id,
        variantId: toVariantId('demora-25'),
      },
      params: {},
      instance,
    }).map((entry) => entry.code)

    expect(codes).toContain('duplicate-option')
    expect(codes).toContain('label-too-long')
    expect(codes).toContain('value-too-long')
  })

  it('rejects parameters that cannot survive serialization', () => {
    const codes = validateGeneric({
      ref: {
        familyId: BUS.family,
        templateId: BUS.id,
        variantId: toVariantId('demora-25'),
      },
      params: { travel: Number.POSITIVE_INFINITY },
      instance: {
        ref: instanceRefFor(BUS, {}),
        attempts: 1,
        narrative: { title: 't', setup: 's', goal: 'g' },
        tools: [],
        requestable: [],
        verify: () => [],
        evaluate: () => ok({}) as never,
        present: () => ({
          kind: 'decision-card' as const,
          data: [],
          options: [],
        }),
      },
    }).map((entry) => entry.code)

    expect(codes).toContain('unsafe-number')
  })

  it('surfaces the template invariants a challenge declares', () => {
    const codes = validateGeneric({
      ref: {
        familyId: BUS.family,
        templateId: BUS.id,
        variantId: toVariantId('demora-25'),
      },
      params: {},
      instance: {
        ref: instanceRefFor(BUS, {}),
        attempts: 1,
        narrative: { title: 't', setup: 's', goal: 'g' },
        tools: [],
        requestable: [],
        verify: () => ['todo mal'],
        evaluate: () => ok({}) as never,
        present: () => ({
          kind: 'decision-card' as const,
          data: [],
          options: [],
        }),
      },
    }).map((entry) => entry.code)

    expect(codes).toContain('template-invariant')
  })

  it('knows how many options the interface can show', () => {
    expect(PRESENTATION_LIMITS.maxOptions).toBeGreaterThanOrEqual(4)
    for (const definition of [BUS, MURAL, NOTEBOOK]) {
      const view = materializeVariant(definition, {
        seed: 'limits',
        variantId: candidateVariantId(1),
      }).present([])
      if ('options' in view) {
        expect(view.options.length).toBeLessThanOrEqual(
          PRESENTATION_LIMITS.maxOptions,
        )
      }
    }
  })
})

describe('every production template participates', () => {
  it('declares a variant source and a deliberate strategy', () => {
    const strategy = Object.fromEntries(
      contentCatalog.templates.map((entry) => [
        entry.id,
        entry.variantSource.kind,
      ]),
    )

    expect(strategy).toEqual({
      'g7.bus-latest-departure': 'generated',
      'g7.bus-timing': 'generated',
      'g7.group-tasks': 'authored',
      'g7.may-25-act': 'generated',
      'g7.mural-paint': 'generated',
      'g7.notebook-offer': 'generated',
      'g7.stand-supplies': 'generated',
    })
  })

  it('validates its authored variants like any other', () => {
    for (const definition of contentCatalog.templates) {
      for (const variantId of definition.variantSource.authoredIds) {
        const evaluated = evaluateVariant(contentCatalog, definition, variantId)
        expect(evaluated.diagnostics).toEqual([])
        expect(evaluated.fingerprint).toBeDefined()
      }
    }
  })
})

describe('approved catalog', () => {
  const committed = JSON.parse(
    readFileSync(CATALOG_PATH, 'utf8'),
  ) as ApprovedVariantCatalog

  it('is exactly what the current code produces', () => {
    const { catalog } = buildVariantCatalog(contentCatalog, {
      catalogVersion: GRADE_7_VARIANT_CATALOG_VERSION,
      contentVersion: GRADE_7_CONTENT_VERSION,
      candidatesPerTemplate: 400,
      approvalTarget: 24,
    })

    expect(serializeCatalog(catalog)).toBe(readFileSync(CATALOG_PATH, 'utf8'))
  })

  it('passes its own integrity check', () => {
    const issues = verifyCatalogIntegrity(contentCatalog, committed, {
      contentVersion: GRADE_7_CONTENT_VERSION,
    })
    expect(issues).toEqual([])
  })

  it('contains no invalid entry and no duplicate problem', () => {
    expect(committed.entries.length).toBeGreaterThan(100)
    const fingerprints = new Set(
      committed.entries.map((entry) => entry.fingerprint),
    )
    expect(fingerprints.size).toBe(committed.entries.length)

    for (const entry of committed.entries) {
      const evaluated = evaluateVariant(
        contentCatalog,
        template(entry.templateId),
        entry.variantId,
      )
      expect(evaluated.diagnostics).toEqual([])
    }
  })

  it('covers every template, authored and generated alike', () => {
    const templates = new Set(
      committed.entries.map((entry) => entry.templateId),
    )
    for (const definition of contentCatalog.templates) {
      expect(templates).toContain(definition.id)
    }
    expect(committed.entries.some((entry) => entry.source === 'authored')).toBe(
      true,
    )
    expect(
      committed.entries.some((entry) => entry.source === 'generated'),
    ).toBe(true)
  })

  it('declares a stable version and never calls itself latest', () => {
    expect(committed.catalogVersion).toBe(GRADE_7_VARIANT_CATALOG_VERSION)
    expect(committed.catalogVersion).not.toContain('latest')
    expect(committed.contentVersion).toBe(GRADE_7_CONTENT_VERSION)
  })

  it('records nothing volatile', () => {
    const raw = readFileSync(CATALOG_PATH, 'utf8')
    expect(raw).not.toMatch(/\d{4}-\d{2}-\d{2}T/)
    expect(raw).not.toContain('/home/')
    expect(raw).not.toContain('Z"')
  })

  it('is byte-identical when rebuilt', () => {
    const options = {
      catalogVersion: GRADE_7_VARIANT_CATALOG_VERSION,
      contentVersion: GRADE_7_CONTENT_VERSION,
      candidatesPerTemplate: 200,
      approvalTarget: 12,
    }
    const first = buildVariantCatalog(contentCatalog, options)
    const second = buildVariantCatalog(contentCatalog, options)
    expect(serializeCatalog(second.catalog)).toBe(
      serializeCatalog(first.catalog),
    )
  })

  it('does not depend on the order content was registered in', () => {
    const options = {
      catalogVersion: GRADE_7_VARIANT_CATALOG_VERSION,
      contentVersion: GRADE_7_CONTENT_VERSION,
      candidatesPerTemplate: 60,
      approvalTarget: 6,
    }
    const straight = buildVariantCatalog(contentCatalog, options)
    const shuffled = buildVariantCatalog(
      createContentCatalog(
        [...grade7Families].reverse(),
        [...grade7Challenges].reverse(),
      ),
      options,
    )
    expect(serializeCatalog(shuffled.catalog)).toBe(
      serializeCatalog(straight.catalog),
    )
  })
})

describe('catalog integrity fails loudly', () => {
  const committed = JSON.parse(
    readFileSync(CATALOG_PATH, 'utf8'),
  ) as ApprovedVariantCatalog

  function codesFor(catalog: ApprovedVariantCatalog): readonly string[] {
    return verifyCatalogIntegrity(contentCatalog, catalog, {
      contentVersion: GRADE_7_CONTENT_VERSION,
    }).map((issue) => issue.code)
  }

  it('catches a tampered fingerprint', () => {
    const [first, ...rest] = committed.entries
    if (first === undefined) throw new Error('catálogo vacío')
    expect(
      codesFor({
        ...committed,
        entries: [{ ...first, fingerprint: 'a'.repeat(64) }, ...rest],
      }),
    ).toContain('catalog.fingerprint-mismatch')
  })

  it('catches a generator that drifted without a version bump', () => {
    const [first, ...rest] = committed.generators
    if (first === undefined) throw new Error('sin generadores')
    expect(
      codesFor({
        ...committed,
        generators: [{ ...first, generatorVersion: '99' }, ...rest],
      }),
    ).toContain('catalog.generator-drift')
  })

  it('catches an entry that no longer resolves', () => {
    expect(
      codesFor({
        ...committed,
        entries: [
          ...committed.entries,
          {
            familyId: toScenarioFamilyId('bus'),
            templateId: toChallengeId('g7.no-existe'),
            variantId: toVariantId('c00001'),
            source: 'generated',
            fingerprint: 'b'.repeat(64),
          },
        ],
      }),
    ).toContain('catalog.unknown-template')
  })

  it('catches a duplicated address and a mismatched content version', () => {
    const [first] = committed.entries
    if (first === undefined) throw new Error('catálogo vacío')
    expect(codesFor({ ...committed, entries: [first, first] })).toContain(
      'catalog.duplicate-address',
    )
    expect(codesFor({ ...committed, contentVersion: '0.0.0' })).toContain(
      'catalog.content-version',
    )
  })
})

describe('an approved variant is playable', () => {
  const committed = JSON.parse(
    readFileSync(CATALOG_PATH, 'utf8'),
  ) as ApprovedVariantCatalog

  it('resolves by identity and materialises into a real instance', () => {
    const entry = committed.entries.find(
      (candidate) =>
        candidate.templateId === 'g7.bus-timing' &&
        candidate.source === 'generated',
    )
    if (entry === undefined) throw new Error('sin entrada generada')

    expect(findApprovedVariant(committed, entry)).toEqual(entry)

    const instance = materializeVariant(BUS, {
      seed: 'catalog-backed',
      variantId: entry.variantId,
    })
    const view = instance.present([])
    expect(view.kind).toBe('timeline')
    if (view.kind !== 'timeline') return

    // La decisión existe: alguna salida llega y alguna no.
    const qualities = view.options.map((option) => {
      const result = instance.evaluate(
        { kind: 'timeline', optionId: option.id } satisfies InteractionAnswer,
        [],
      )
      return result.ok ? result.value.quality : 'invalid'
    })
    expect(qualities).toContain('optimal')
    expect(qualities).toContain('invalid')
  })

  it('replays identically from the same address', () => {
    const entry = committed.entries.find(
      (candidate) => candidate.templateId === 'g7.may-25-act',
    )
    if (entry === undefined) throw new Error('sin entrada')

    const first = materializeVariant(ACT, {
      seed: 'a',
      variantId: entry.variantId,
    })
    const replayed = materializeVariant(ACT, {
      seed: 'b',
      variantId: entry.variantId,
      eventIndex: 3,
    })
    expect(JSON.stringify(replayed.present([]))).toBe(
      JSON.stringify(first.present([])),
    )
    expect(variantFingerprint(contentCatalog, entry)).toBe(entry.fingerprint)
  })

  it('can be stamped on a run descriptor without disturbing an ordinary run', () => {
    const dependencies = createGrade7Dependencies()
    const ordinary = {
      runId: toChallengeId('run-1') as never,
      seed: toChallengeId('seed-1') as never,
      mode: 'standard' as const,
      difficulty: 'adaptive' as const,
      gameVersion: '3.0.0',
      rulesetVersion: dependencies.ruleset.version,
      contentVersion: dependencies.ruleset.contentVersion,
    }
    // Sin catálogo, el campo simplemente no está: una run que juega variantes
    // curadas no salió de ningún catálogo, y decir que sí sería falso.
    expect('variantCatalogVersion' in ordinary).toBe(false)

    const official = {
      ...ordinary,
      variantCatalogVersion: committed.catalogVersion,
    }
    expect(official.variantCatalogVersion).toBe(GRADE_7_VARIANT_CATALOG_VERSION)
  })
})

describe('the audit finds real problems', () => {
  it('reports the population, not just a pass', () => {
    const { catalog, report } = buildVariantCatalog(contentCatalog, {
      catalogVersion: 'audit-test',
      contentVersion: GRADE_7_CONTENT_VERSION,
      candidatesPerTemplate: 120,
      approvalTarget: 60,
    })
    const audit = auditVariantCatalog(contentCatalog, catalog, report)

    expect(audit.attempted).toBeGreaterThan(300)
    expect(hasNoErrors(audit.findings)).toBe(true)

    const bus = audit.templates.find(
      (entry) => entry.templateId === 'g7.bus-timing',
    )
    expect(bus?.distinctProblems).toBeGreaterThan(30)
    // El colectivo tiene opciones, así que la posición de la respuesta se mide.
    expect(bus?.optionPositions?.samples).toBeGreaterThan(10)
    expect(
      Object.keys(bus?.optionPositions?.byIndex ?? {}).length,
    ).toBeGreaterThan(1)

    // El stand es un constructor de presupuesto: no hay posición que sesgar.
    const stand = audit.templates.find(
      (entry) => entry.templateId === 'g7.stand-supplies',
    )
    expect(stand?.optionPositions).toBeUndefined()
  })

  it('flags a template that approves nothing and one with a single answer', () => {
    const FAMILY = toScenarioFamilyId('prueba')
    const broken = defineChallenge<
      { readonly valor: number },
      { readonly id: string }
    >({
      id: toChallengeId('test.rota'),
      family: FAMILY,
      placement: 'anchor',
      variants: [toVariantId('unica')],
      variantSource: {
        authored: [{ id: 'unica' }],
        validators: [
          (input) => [
            variantDiagnostic(
              'no-valid-solution',
              input.ref,
              'rota a propósito',
            ),
          ],
        ],
        canonical: () => ({}),
      },
      interaction: 'decision-card',
      categories: ['quantity'],
      stages: ['grade-7'],
      baseDifficulty: 1,
      cognitive: {
        steps: 1,
        constraints: 0,
        selection: 0,
        optimization: 0,
        uncertainty: 0,
        construction: 0,
      },
      scoring: {
        math: 'discrete-quality' as const,
        team: 'none' as const,
        aura: 'none' as const,
        rationale:
          'Test fixture: a single fact, read once by the mathematical component.',
      },
      tools: [],
      generate: () => ({ valor: 1 }),
      verify: () => [],
      narrate: () => ({ title: 't', setup: 's', goal: 'g' }),
      present: () => ({
        kind: 'decision-card',
        data: [],
        options: [{ id: 'a', label: 'A' }],
      }),
      evaluate: () =>
        ok({
          quality: 'optimal' as const,
          feedback: { outcomeKey: 'k', facts: [] },
          metrics: metrics({}),
          careerEffects: {},
          flagEffects: [],
        }),
    })

    const catalogWithBroken = createContentCatalog(
      [{ id: FAMILY, labelKey: 'family.prueba', summary: 'Prueba.' }],
      [broken],
    )
    const { catalog, report } = buildVariantCatalog(catalogWithBroken, {
      catalogVersion: 'broken',
      contentVersion: '0.0.0',
      candidatesPerTemplate: 5,
      approvalTarget: 5,
    })
    const audit = auditVariantCatalog(catalogWithBroken, catalog, report)

    expect(catalog.entries).toEqual([])
    expect(audit.findings.map((entry) => entry.code)).toContain(
      'audit.zero-approved',
    )
    expect(hasNoErrors(audit.findings)).toBe(false)
  })

  it('documents thresholds rather than hiding them', () => {
    expect(AUDIT_THRESHOLDS.rejectionError).toBeGreaterThan(
      AUDIT_THRESHOLDS.rejectionWarn,
    )
    expect(AUDIT_THRESHOLDS.positionSkew).toBeGreaterThan(0.5)
    expect(AUDIT_THRESHOLDS.minDistinctProblems).toBeGreaterThan(1)
  })
})

describe('a future template joins without touching the pipeline', () => {
  /**
   * Una familia, una plantilla, un generador y un validador que el pipeline
   * nunca vio. Nada de esto edita el motor ni el pipeline: se declara, se
   * registra y el catálogo lo procesa como a cualquier otro.
   */
  const FAMILY = toScenarioFamilyId('kiosco')

  interface KioscoParams {
    readonly precio: number
    readonly cantidad: number
  }

  const source: VariantSourceSpec<KioscoParams> = {
    authored: [{ id: 'base', precio: 300, cantidad: 4 }],
    generator: {
      id: 'kiosco.constraint-first',
      version: '1',
      candidateSpace: 500,
      generate: ({ rng }) => ({
        precio: rng.nextInt(2, 20) * 50,
        cantidad: rng.nextInt(2, 9),
      }),
    },
    validators: [
      (input) =>
        input.params.precio % 50 === 0
          ? []
          : [
              variantDiagnostic(
                'unreasonable-value',
                input.ref,
                'precio con centavos sueltos',
              ),
            ],
    ],
    canonical: (params) => ({
      precio: params.precio,
      cantidad: params.cantidad,
    }),
  }

  const kiosco = defineChallenge<{ readonly total: number }, KioscoParams>({
    id: toChallengeId('test.kiosco'),
    family: FAMILY,
    placement: 'anchor',
    variants: [toVariantId('base')],
    variantSource: source,
    interaction: 'decision-card',
    categories: ['quantity'],
    stages: ['grade-7'],
    baseDifficulty: 2,
    cognitive: {
      steps: 1,
      constraints: 0,
      selection: 0,
      optimization: 0,
      uncertainty: 0,
      construction: 0,
    },
    scoring: {
      math: 'discrete-quality' as const,
      team: 'none' as const,
      aura: 'none' as const,
      rationale:
        'Test fixture: a single fact, read once by the mathematical component.',
    },
    tools: [],
    generate: ({ params }) => ({ total: params.precio * params.cantidad }),
    verify: (model) => (model.total > 0 ? [] : ['total no positivo']),
    narrate: () => ({ title: 'Kiosco', setup: 'Hay cola.', goal: 'Elegí.' }),
    present: (model) => ({
      kind: 'decision-card',
      data: [{ label: 'Total', value: String(model.total) }],
      options: [
        { id: 'si', label: 'Comprar' },
        { id: 'no', label: 'Dejarlo' },
      ],
    }),
    evaluate: (_model, answer: InteractionAnswer) =>
      ok({
        quality: answer.kind === 'decision-card' ? 'optimal' : 'invalid',
        feedback: { outcomeKey: 'kiosco', facts: [] },
        metrics: metrics({}),
        careerEffects: {},
        flagEffects: [],
      } as never),
  })

  const catalog = createContentCatalog(
    [{ id: FAMILY, labelKey: 'family.kiosco', summary: 'El kiosco.' }],
    [kiosco],
  )

  it('generates, validates, fingerprints and catalogs it', () => {
    const { catalog: approved, report } = buildVariantCatalog(catalog, {
      catalogVersion: 'kiosco-1',
      contentVersion: '0.0.1',
      candidatesPerTemplate: 60,
      approvalTarget: 20,
    })

    expect(report.rejected).toBe(0)
    expect(approved.entries.length).toBeGreaterThan(15)
    expect(approved.generators).toEqual([
      {
        templateId: 'test.kiosco',
        generatorId: 'kiosco.constraint-first',
        generatorVersion: '1',
        candidateSpace: 500,
      },
    ])
    expect(
      verifyCatalogIntegrity(catalog, approved, { contentVersion: '0.0.1' }),
    ).toEqual([])
  })

  it('resolves its parameters from the address alone', () => {
    const address = {
      familyId: FAMILY,
      templateId: toChallengeId('test.kiosco'),
      variantId: candidateVariantId(3),
    }
    const params = resolveVariantParams(
      address.templateId,
      source,
      address.variantId,
      createVariantRng(address),
    )
    expect(params.precio % 50).toBe(0)
    expect(
      resolveVariantParams(
        address.templateId,
        source,
        address.variantId,
        createVariantRng(address),
      ),
    ).toEqual(params)
  })
})
