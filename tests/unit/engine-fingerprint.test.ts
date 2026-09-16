import { describe, expect, it } from 'vitest'

import { ENGINE_VERSION } from '@/game'
import {
  contentFingerprint,
  engineFingerprint,
  rulesetFingerprint,
} from '@/game/ruleset/fingerprint'
import { createDevelopmentDependencies } from '@/game/testing'

/**
 * Version fingerprints.
 *
 * These pin deterministic behaviour to the version that declares it. A run is
 * only replayable by an engine advertising the same version triple, so changing
 * what a version means — without changing the version — silently invalidates
 * every stored run.
 *
 * **If one of these fails, do not just paste the new value.** Decide which
 * version the change belongs to, bump it, regenerate the golden replays in
 * `engine-golden.test.ts`, and only then update the fingerprint here:
 *
 * - transition, RNG consumption or derivation, action-log or snapshot format
 *   → `ENGINE_VERSION`
 * - scoring, difficulty, profile policy, stage configuration, narrative pacing
 *   → ruleset version
 * - challenge or storylet data
 *   → content version
 */

const dependencies = createDevelopmentDependencies()

/*
 * 3.º: engine 9.0.0 / action log 7; snapshot 7 intacto. El motor contrata la
 * respuesta de recorrido —el orden de las paradas— y el modo de varios días de
 * la agenda, que no agrega campo alguno a la respuesta: los minutos son
 * absolutos desde el primer día. Se mueve **sólo el motor**: el ruleset y el
 * contenido de desarrollo quedan idénticos, porque ninguna regla ni ninguna
 * plantilla de fixtures cambió. El contenido nuevo es de 3.º y vive en su
 * propio content set.
 *
 * El antecedente de Phase 1: engine 7.0.0 / action log 5; snapshot 7 y fingerprints
 * de ruleset/contenido legacy intactos. Antecedente de progresión (6.0.0):
 *
 * Dos se movieron y **la que no lo hizo vuelve a ser la evidencia**:
 *
 * - **motor**: la versión y el codec de snapshot (7). Una run guarda ahora qué
 *   quedó debiendo y si egresó. El action log **no** se movió: una recuperación
 *   se responde como cualquier otro beat y no necesita un comando nuevo.
 * - **ruleset**: el digest cubre ahora la política de recuperación. El content
 *   set de desarrollo no recupera y su entrada dice `recovery:none`; la huella
 *   igual se mueve, porque el digest ganó un campo, y eso es preferible a un
 *   digest ciego a una regla que decide cómo progresa una run.
 * - **contenido**: idéntico en `dbaf5094`. La plantilla de recuperación es de
 *   7.º y el contenido de desarrollo no la tiene, así que no cambió nada de lo
 *   que un seed produce acá.
 *
 * Las runs golden reproducen el mismo recorrido, el mismo score por evento, el
 * mismo perfil y la misma cantidad de comandos — y ahora terminan en egreso,
 * que es el invariante que esta etapa vuelve ejecutable.
 *
 * El contexto anterior, del score competitivo (`ENGINE_VERSION` 5.1.0):
 *
 * Se movieron dos de las tres, y **la que no se movió es la evidencia**:
 *
 * - **motor**: la versión, el codec de snapshot (6) y el del action log (4).
 *   Una run puede declarar ahora bajo qué calibración competitiva se juega.
 * - **contenido**: cada plantilla declara qué hecho suyo lee cada componente
 *   competitiva. No cambia qué produce un seed, pero sí cuánto vale una run, y
 *   eso es identidad de contenido; el contenido de desarrollo sube a `0.6.0-dev`.
 * - **ruleset**: idéntico en `da245c60`. Puntuar no toca una regla de juego, y
 *   una huella que no se movió lo dice mejor que cualquier comentario.
 *
 * Las runs golden reproducen el mismo recorrido, el mismo score por evento, el
 * mismo perfil y la misma cantidad de comandos.
 *
 * El contexto anterior, del compositor de runs (`ENGINE_VERSION` 5.0.0):
 *
 * Se movieron las tres, y cada una por su motivo:
 *
 * - **motor**: la versión, el codec de snapshot (5) y el del action log (3).
 *   Una run compuesta guarda su plan y su log declara la huella de ese plan.
 * - **ruleset**: el ruleset declara ahora su política de composición, así que
 *   la huella la cubre. El content set de desarrollo no compone y su entrada
 *   dice `composition:none` — la huella igual se mueve, porque el digest ganó
 *   un campo, y eso es preferible a un digest que no puede ver una política que
 *   decide qué es una run.
 * - **contenido**: cada plantilla declara su perfil cognitivo, y de ahí sale la
 *   banda con la que el compositor la agenda. Es contenido que decide
 *   scheduling, así que entra al digest y el contenido de desarrollo sube a
 *   `0.5.0-dev`.
 *
 * Lo que **no** se movió es el juego: las runs golden reproducen el mismo
 * recorrido, el mismo score, el mismo perfil y la misma cantidad de comandos.
 *
 * El contexto anterior, del catálogo en el juego real (`ENGINE_VERSION` 4.1.0):
 *
 * Se movió **sólo el motor**, y las otras dos huellas lo confirman: la partida
 * elige ahora dentro del catálogo aprobado, `createRun` rechaza una run cuyo
 * catálogo declarado no sea contra el que se la reproduce, y el action log
 * carga esa versión —que antes perdía—. Nada de eso es una regla de juego ni
 * contenido de desarrollo: el ruleset y el contenido de fixtures quedaron
 * idénticos.
 *
 * El contenido de 7.º sí subió, a `0.6.0-grade-7`, porque la familia colectivo
 * ganó una plantilla. Estas huellas miran el content set de desarrollo.
 *
 * El contexto anterior, del pipeline de variantes (`ENGINE_VERSION` 4.0.0):
 *
 * Se movieron dos de las tres huellas, y la que no se movió es la que más dice:
 *
 * - **motor**: el descriptor de una run puede declarar de qué catálogo de
 *   variantes salió, y eso cambió el códec de snapshot;
 * - **contenido**: cada plantilla declara de dónde salen sus variantes
 *   —autoradas o generadas, con qué generador y sobre qué espacio de
 *   candidatos—, y eso es identidad de contenido;
 * - **ruleset**: intacto en `d3319440`. Score, dificultad, perfil y etapas no se
 *   tocaron, y por eso su versión no sube.
 *
 * Las runs golden reproducen el mismo recorrido, el mismo score, el mismo perfil
 * y la misma cantidad de comandos.
 *
 * El contexto anterior, del modelo de contenido (`ENGINE_VERSION` 3.0.0):
 *
 * Dos de los tres se movieron y el tercero no, que es justamente lo que estos
 * fingerprints existen para mostrar:
 *
 * - **motor**: el códec de snapshot pasó a la versión 3, porque la dirección de
 *   una instancia lleva ahora familia, plantilla y variante en lugar de un id
 *   de definición suelto;
 * - **contenido**: cada plantilla declara familia, rol de colocación y sus
 *   variantes con identidad propia, y el orden de esa lista es parte del
 *   contrato porque la selección saca un índice de ahí;
 * - **ruleset**: sin cambios, y se queda en `d3319440`. Las políticas de score,
 *   dificultad y perfil y la configuración de etapas no se tocaron.
 *
 * El recorrido, el score, el perfil y la cantidad de comandos de las dos runs
 * golden quedaron **idénticos**.
 */
const EXPECTED = {
  engine: 'c542afb3',
  ruleset: '5b9b0bc5',
  content: 'dbaf5094',
} as const

describe('version fingerprints', () => {
  it('pins the deterministic kernel to its engine version', () => {
    expect(ENGINE_VERSION).toBe('9.0.0')
    expect(engineFingerprint()).toBe(EXPECTED.engine)
  })

  it('pins the scoring rules to the declared ruleset version', () => {
    expect(dependencies.ruleset.version).toBe('0.2.0-dev')
    expect(rulesetFingerprint(dependencies.ruleset)).toBe(EXPECTED.ruleset)
  })

  it('pins the playable content to the declared content version', () => {
    expect(dependencies.ruleset.contentVersion).toBe('0.6.0-dev')
    expect(
      contentFingerprint(dependencies.catalog, dependencies.storylets),
    ).toBe(EXPECTED.content)
  })

  it('separates the three concerns', () => {
    // A fingerprint must not be a digest of everything, otherwise every change
    // would point at every version and the rule would stop guiding anyone.
    const values = new Set([
      engineFingerprint(),
      rulesetFingerprint(dependencies.ruleset),
      contentFingerprint(dependencies.catalog, dependencies.storylets),
    ])
    expect(values.size).toBe(3)
  })

  it('reacts to a policy change that leaves the version untouched', () => {
    // The exact scenario the fingerprint exists to catch: same version string,
    // different rules.
    const tampered = {
      ...dependencies.ruleset,
      scoring: {
        ...dependencies.ruleset.scoring,
        id: 'development-scoring-v2',
      },
    }

    expect(rulesetFingerprint(tampered)).not.toBe(EXPECTED.ruleset)
    expect(tampered.version).toBe(dependencies.ruleset.version)
  })

  it('reacts to a content change that leaves the version untouched', () => {
    const trimmed = dependencies.storylets.slice(0, -1)

    expect(contentFingerprint(dependencies.catalog, trimmed)).not.toBe(
      EXPECTED.content,
    )
  })

  it('is stable across repeated computation', () => {
    expect(rulesetFingerprint(dependencies.ruleset)).toBe(
      rulesetFingerprint(dependencies.ruleset),
    )
    expect(
      contentFingerprint(dependencies.catalog, dependencies.storylets),
    ).toBe(contentFingerprint(dependencies.catalog, dependencies.storylets))
  })
})
