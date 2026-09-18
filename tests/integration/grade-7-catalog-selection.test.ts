import { describe, expect, it } from 'vitest'

import {
  activeChallengeView,
  appendAction,
  createRun,
  emptyActionLog,
  formatVariantAddress,
  isErr,
  isOk,
  parseActionLog,
  replayRun,
  restoreSnapshot,
  serializeActionLog,
  serializeSnapshot,
  transition,
  variantRefOf,
  type ChallengeInstanceRef,
  type GameCommand,
  type RunState,
} from '@/game'
import {
  createGrade7Dependencies,
  createGrade7RunDescriptor,
  grade7VariantCatalog,
  grade7VariantCatalogs,
  GRADE_7_VARIANT_CATALOG_VERSION,
} from '@/content/grade-7'

/**
 * El catálogo aprobado, adentro del juego.
 *
 * STAGE-03 dejó un catálogo verificado que nadie jugaba. Lo que se prueba acá
 * es lo contrario: que una partida de 7.º elige **dentro** de ese catálogo, que
 * elegir sigue siendo determinista y reproducible, y que publicar una versión
 * nueva no rompió la anterior.
 */

const dependencies = createGrade7Dependencies()

/** Direcciones aprobadas del catálogo vigente, como texto comparable. */
const approved = new Set(
  grade7VariantCatalog.entries.map((entry) =>
    formatVariantAddress({
      familyId: entry.familyId,
      templateId: entry.templateId,
      variantId: entry.variantId,
    }),
  ),
)

/** Avanza hasta el primer desafío y devuelve su dirección y el estado. */
function firstChallenge(seed: string): {
  readonly ref: ChallengeInstanceRef
  readonly state: RunState
  readonly commands: readonly GameCommand[]
} {
  const created = createRun(createGrade7RunDescriptor(seed), dependencies)
  if (!created.ok) throw new Error('no se pudo crear la run')

  let state = created.value.state
  const commands: GameCommand[] = []

  for (let step = 0; step < 10; step += 1) {
    if (state.phase === 'challenge') {
      const view = activeChallengeView(state, dependencies)
      if (!view.ok || view.value === undefined) {
        throw new Error('sin vista activa')
      }
      return { ref: view.value.ref, state, commands }
    }

    const command: GameCommand = { type: 'CONTINUE' }
    const result = transition(state, command, dependencies)
    if (!result.ok) throw new Error(`comando rechazado: ${result.error.kind}`)
    state = result.value.state
    commands.push(command)
  }

  throw new Error('la run nunca llegó a un desafío')
}

/** Veinte seeds, suficientes para ver el rango sin volver lento el test. */
const SEEDS = Array.from({ length: 20 }, (_, index) => `catalogo-${index}`)

describe('la partida elige dentro del catálogo aprobado', () => {
  it('juega variantes que pasaron el pipeline, no sólo las curadas', () => {
    const addresses = SEEDS.map((seed) =>
      formatVariantAddress(variantRefOf(firstChallenge(seed).ref)),
    )

    for (const address of addresses) {
      expect(approved.has(address)).toBe(true)
    }

    // La prueba de que el catálogo sirve para algo: el primer beat no se
    // repite entre las dos variantes curadas de siempre.
    expect(new Set(addresses).size).toBeGreaterThan(2)
  })

  it('alcanza las dos plantillas de la familia colectivo', () => {
    const templates = new Set(
      SEEDS.map((seed) => firstChallenge(seed).ref.templateId as string),
    )

    expect(templates).toEqual(
      new Set(['g7.bus-timing', 'g7.bus-latest-departure']),
    )
  })

  it('el mismo seed elige siempre la misma plantilla y la misma variante', () => {
    for (const seed of SEEDS.slice(0, 5)) {
      const first = formatVariantAddress(variantRefOf(firstChallenge(seed).ref))
      const again = formatVariantAddress(variantRefOf(firstChallenge(seed).ref))
      expect(again).toBe(first)
    }
  })

  it('reproduce la misma variante desde el log de acciones', () => {
    const seed = 'catalogo-replay'
    const { ref, commands } = firstChallenge(seed)
    const descriptor = createGrade7RunDescriptor(seed)

    let log = emptyActionLog(descriptor)
    for (const command of commands) {
      log = appendAction(log, command)
    }

    const parsed = parseActionLog(serializeActionLog(log))
    if (!isOk(parsed)) throw new Error('el log no se pudo parsear')
    // La versión del catálogo viaja en el log: sin ella el motor no sabría
    // contra qué contenido está reproduciendo.
    expect(parsed.value.descriptor.variantCatalogVersion).toBe(
      GRADE_7_VARIANT_CATALOG_VERSION,
    )

    const replayed = replayRun(parsed.value, dependencies)
    if (!isOk(replayed)) throw new Error('la reproducción falló')

    const view = activeChallengeView(replayed.value.state, dependencies)
    if (!view.ok || view.value === undefined) throw new Error('sin vista')
    expect(formatVariantAddress(variantRefOf(view.value.ref))).toBe(
      formatVariantAddress(variantRefOf(ref)),
    )
  })

  it('retoma la misma variante desde un snapshot', () => {
    const seed = 'catalogo-snapshot'
    const { ref, state } = firstChallenge(seed)

    const restored = restoreSnapshot(serializeSnapshot(state), {
      gameVersion: state.descriptor.gameVersion,
      rulesetVersion: state.descriptor.rulesetVersion,
      contentVersion: state.descriptor.contentVersion,
    })
    if (!isOk(restored)) throw new Error('el snapshot no se pudo restaurar')

    const view = activeChallengeView(restored.value, dependencies)
    if (!view.ok || view.value === undefined) throw new Error('sin vista')
    expect(formatVariantAddress(variantRefOf(view.value.ref))).toBe(
      formatVariantAddress(variantRefOf(ref)),
    )
  })

  it('rechaza una run que declara otro catálogo del que se le da', () => {
    const descriptor = {
      ...createGrade7RunDescriptor('catalogo-ajeno'),
      variantCatalogVersion: 'grade-7-dev-1',
    }

    const created = createRun(descriptor, dependencies)
    expect(isErr(created)).toBe(true)
  })
})

describe('una versión publicada del catálogo no se toca', () => {
  it('publica dev-7 para la corrección del Repaso sin reescribir dev-6', () => {
    const before = grade7VariantCatalogs['grade-7-dev-6']
    const after = grade7VariantCatalogs['grade-7-dev-7']
    if (before === undefined || after === undefined) throw new Error('faltan')
    expect(before.contentVersion).toBe('0.10.0-grade-7')
    expect(after.contentVersion).toBe('0.11.0-grade-7')
    expect(after.entries).toEqual(before.entries)
    expect(after.generators).toEqual(before.generators)
  })

  it('conserva grade-7-dev-1 tal como se publicó', () => {
    const previous = grade7VariantCatalogs['grade-7-dev-1']
    if (previous === undefined) throw new Error('falta grade-7-dev-1')

    expect(previous.catalogVersion).toBe('grade-7-dev-1')
    expect(previous.contentVersion).toBe('0.5.0-grade-7')
    expect(previous.entries).toHaveLength(133)
  })

  it('sigue resolviendo cada dirección de grade-7-dev-1 contra el contenido', () => {
    const previous = grade7VariantCatalogs['grade-7-dev-1']
    if (previous === undefined) throw new Error('falta grade-7-dev-1')

    for (const entry of previous.entries) {
      const template = dependencies.catalog.template(entry.templateId)
      expect(template).toBeDefined()
      expect(template?.family).toBe(entry.familyId)
    }
  })

  /*
   * Qué se conserva entre versiones, y qué no.
   *
   * `dev-2` agregó una plantilla y **cambió un generador**: el del acto pasó a
   * construir los objetivos desde el techo de la coreografía. Una dirección
   * generada del acto produce entonces otro problema, y su huella lo dice.
   *
   * Eso es exactamente por qué una versión publicada no se edita. Si `dev-1` se
   * hubiera regenerado, la historia de cualquier run anterior se habría
   * reescrito en silencio; publicando `dev-2` al lado, las dos afirmaciones
   * conviven y son verificables.
   */
  it('publica dev-4 al lado de dev-3 en vez de editarlo', () => {
    const dev3 = grade7VariantCatalogs['grade-7-dev-3']
    const dev4 = grade7VariantCatalogs['grade-7-dev-4']
    if (dev3 === undefined || dev4 === undefined) throw new Error('faltan')

    // Segunda vez que la regla se aplica a un cambio que no movió ninguna
    // dirección: el contenido subió a 0.8.0 porque cada plantilla declara ahora
    // cómo puntúa, y el catálogo dice contra qué contenido se construyó.
    expect(dev3.contentVersion).toBe('0.7.0-grade-7')
    expect(dev4.contentVersion).toBe('0.8.0-grade-7')
    expect(dev4.entries).toEqual(dev3.entries)
    expect(dev4.generators).toEqual(dev3.generators)
  })

  it('publica dev-3 al lado de dev-2 en vez de editarlo', () => {
    const dev2 = grade7VariantCatalogs['grade-7-dev-2']
    const dev3 = grade7VariantCatalogs['grade-7-dev-3']
    if (dev2 === undefined || dev3 === undefined) throw new Error('faltan')

    // La única diferencia entre los dos es contra qué versión de contenido se
    // construyeron. Ninguna dirección se movió, ninguna huella cambió, y aun
    // así se publicó una versión nueva: la regla de inmutabilidad no admite
    // excepciones «chicas», porque la primera excepción es la que la deroga.
    expect(dev2.contentVersion).toBe('0.6.0-grade-7')
    expect(dev3.contentVersion).toBe('0.7.0-grade-7')
    expect(dev3.entries).toEqual(dev2.entries)
    expect(dev3.generators).toEqual(dev2.generators)
  })

  it('conserva las direcciones cuyo generador no se movió', () => {
    const previous = grade7VariantCatalogs['grade-7-dev-1']
    if (previous === undefined) throw new Error('falta grade-7-dev-1')

    const current = new Map(
      grade7VariantCatalog.entries.map((entry) => [
        formatVariantAddress(entry),
        entry.fingerprint,
      ]),
    )

    // El acto cambió de generador en dev-2 y el mural ganó un gate de balance
    // en dev-6: sus direcciones generadas pueden moverse. El resto, no.
    const stable = previous.entries.filter(
      (entry) =>
        !['g7.may-25-act', 'g7.mural-paint'].includes(
          entry.templateId as string,
        ) || entry.source === 'authored',
    )

    // 85 de las 133 direcciones de dev-1 quedan fuera del acto y del mural
    // generados; antes del gate de balance del mural eran más de 100.
    expect(stable.length).toBeGreaterThan(80)
    for (const entry of stable) {
      expect(current.get(formatVariantAddress(entry))).toBe(entry.fingerprint)
    }
  })

  it('publica dev-6 al lado de dev-5: el balance del mural mueve direcciones y dev-5 queda como estaba', () => {
    const dev5 = grade7VariantCatalogs['grade-7-dev-5']
    const dev6 = grade7VariantCatalogs['grade-7-dev-6']
    if (dev5 === undefined || dev6 === undefined) throw new Error('faltan')
    expect(dev5.contentVersion).toBe('0.9.0-grade-7')
    expect(dev6.contentVersion).toBe('0.10.0-grade-7')
    const murals = (catalog: typeof dev5) =>
      catalog.entries
        .filter((entry) => (entry.templateId as string) === 'g7.mural-paint')
        .map((entry) => formatVariantAddress(entry))
    expect(murals(dev6)).not.toEqual(murals(dev5))
    const others = (catalog: typeof dev5) =>
      catalog.entries.filter(
        (entry) => (entry.templateId as string) !== 'g7.mural-paint',
      )
    expect(others(dev6)).toEqual(others(dev5))
  })

  it('mueve las del acto, porque su generador cambió', () => {
    const previous = grade7VariantCatalogs['grade-7-dev-1']
    if (previous === undefined) throw new Error('falta grade-7-dev-1')

    const current = new Map(
      grade7VariantCatalog.entries.map((entry) => [
        formatVariantAddress(entry),
        entry.fingerprint,
      ]),
    )

    const moved = previous.entries.filter(
      (entry) =>
        (entry.templateId as string) === 'g7.may-25-act' &&
        entry.source === 'generated' &&
        current.get(formatVariantAddress(entry)) !== entry.fingerprint,
    )

    // No hace falta que se muevan todas —una colisión es legítima—, pero que
    // se mueva la mayoría es la evidencia de que el cambio fue real.
    expect(moved.length).toBeGreaterThan(20)
  })
})
