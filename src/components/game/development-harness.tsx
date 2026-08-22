'use client'

/**
 * Development engine harness.
 *
 * A playable integration surface for the engine, built on the development
 * fixtures. It exists to prove that the deterministic core, the controller and
 * the interaction renderers work together in a real browser — it is not the
 * Egresado game screen, and the content it plays is explicitly fixture content.
 *
 * The seed comes from the URL so a run is shareable and reproducible: the same
 * link always plays the same run.
 */

import { useMemo, useState } from 'react'

import { ENGINE_VERSION, toRunId, toRunSeed, type RunDescriptor } from '@/game'
import { createDevelopmentDependencies } from '@/game/testing'
import { Button, Callout } from '@/components/ui'
import { createGameController } from './controller'
import { GameShell } from './game-shell'

function descriptorFor(
  seed: string,
  rulesetVersion: string,
  contentVersion: string,
): RunDescriptor {
  return {
    runId: toRunId(`dev-harness-${seed}`),
    seed: toRunSeed(seed),
    mode: 'practice',
    difficulty: 'adaptive',
    gameVersion: ENGINE_VERSION,
    rulesetVersion,
    contentVersion,
  }
}

export function DevelopmentHarness({
  initialSeed,
}: {
  readonly initialSeed: string
}) {
  const dependencies = useMemo(() => createDevelopmentDependencies(), [])
  const [seed, setSeed] = useState(initialSeed)

  // The controller is created once per seed. Changing the seed remounts the
  // session, which is exactly the semantics of starting a new run.
  const controller = useMemo(
    () =>
      createGameController(
        descriptorFor(
          seed,
          dependencies.ruleset.version,
          dependencies.ruleset.contentVersion,
        ),
        dependencies,
      ),
    [seed, dependencies],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-game px-gutter mx-auto flex w-full flex-col gap-3 pt-4">
        <div data-testid="harness-notice">
          <Callout tone="warning" title="Herramienta de desarrollo">
            Contenido de prueba, no es el juego Egresado. El ruleset{' '}
            <code>{dependencies.ruleset.version}</code> no es oficial.
          </Callout>
        </div>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            const next = String(data.get('seed') ?? '').trim()
            if (next.length > 0) {
              setSeed(next)
            }
          }}
        >
          <label className="text-body-sm flex flex-col gap-1">
            Seed
            <input
              name="seed"
              defaultValue={seed}
              data-testid="seed-input"
              className="border-line-interactive bg-surface rounded-control h-11 px-3 font-mono"
            />
          </label>
          <Button type="submit" variant="secondary">
            Nueva run
          </Button>
        </form>
      </div>

      <main>
        <GameShell
          controller={controller}
          dependencies={dependencies}
          showDebug
          onRestart={() =>
            descriptorFor(
              seed,
              dependencies.ruleset.version,
              dependencies.ruleset.contentVersion,
            )
          }
        />
      </main>
    </div>
  )
}
