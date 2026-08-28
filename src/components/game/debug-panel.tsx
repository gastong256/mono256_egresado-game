'use client'

/**
 * Developer diagnostics.
 *
 * Shows the run identity, the deterministic address of the current challenge,
 * the last domain events and the action log — everything needed to reproduce a
 * bug from a seed.
 *
 * Only rendered by the development harness, which its route gates on the
 * environment. It is never mounted by a production
 * screen, and it deliberately exposes nothing that is not already derivable
 * from the client's own state.
 */

import type { ControllerState } from './controller'

export function DebugPanel({ state }: { readonly state: ControllerState }) {
  const run = state.run
  const challenge = run.activeEvent?.challenge

  return (
    <section
      id="debug-panel"
      aria-label="Diagnóstico de desarrollo"
      className="border-rule text-caption mt-3 flex flex-col gap-3 border border-dashed p-3"
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {(
          [
            ['runId', run.descriptor.runId],
            ['seed', run.descriptor.seed],
            ['mode', run.descriptor.mode],
            ['difficulty setting', run.descriptor.difficulty],
            ['gameVersion', run.descriptor.gameVersion],
            ['rulesetVersion', run.descriptor.rulesetVersion],
            ['contentVersion', run.descriptor.contentVersion],
            ['phase', run.phase],
            ['status', run.status],
            ['stage', run.stage],
            ['event index', String(run.eventIndex)],
            ['difficulty', String(run.difficulty.current)],
            ['storylet', run.activeEvent?.storyletId ?? '—'],
            ['challenge', challenge?.definitionId ?? '—'],
            ['instance', challenge?.instanceId ?? '—'],
            ['actions logged', String(state.log.actions.length)],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-ink-secondary">{label}</dt>
            <dd className="font-mono break-all">{value}</dd>
          </div>
        ))}
      </dl>

      <div>
        <h3 className="text-goal font-display mb-1">
          Últimos eventos de dominio
        </h3>
        <ul className="flex list-none flex-col gap-0.5 p-0 font-mono">
          {state.lastEvents.length === 0 ? (
            <li className="text-ink-secondary">—</li>
          ) : (
            state.lastEvents.map((event, index) => (
              <li key={`${event.type}-${String(index)}`}>{event.type}</li>
            ))
          )}
        </ul>
      </div>

      <div>
        <h3 className="text-goal font-display mb-1">Flags</h3>
        <p className="font-mono break-all">
          {Object.keys(run.flags).length === 0
            ? '—'
            : Object.entries(run.flags)
                .map(([flag, value]) => `${flag}=${String(value)}`)
                .join(' ')}
        </p>
      </div>
    </section>
  )
}
