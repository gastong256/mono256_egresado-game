/**
 * Presentador del Teacher Gate 1.
 *
 * Orquesta la reunión: lista los casos, comprueba que sigan reproduciendo lo que
 * el pack promete, imprime la ficha de cada uno con la URL para jugarlo, y
 * muestra las comparaciones de dificultad y de puntaje que la sesión necesita.
 *
 * **No calcula nada por su cuenta.** Todo sale del motor real —el compositor, el
 * catálogo aprobado, la metadata de dificultad, la política de score—, porque un
 * segundo cálculo terminaría discrepando del primero justo el día de la reunión.
 * Tampoco escribe: es una herramienta de lectura y presentación.
 *
 *     pnpm teacher-gate --help
 *     pnpm teacher-gate --validate
 *     pnpm teacher-gate --case TG1-A
 */

import {
  bandOf,
  candidateFairScorePolicy,
  createContentCatalog,
  formatCost,
  isOk,
  metrics,
  scoreRun,
  candidateDifficultyCostPolicy,
  type CompetitiveScorePolicy,
  type ScoredEvent,
} from '../../src/game'
import {
  orderedTeacherGateCases,
  teacherGateCase,
  teacherGateCaseIssues,
  verifyTeacherGateCase,
} from '../../src/game/testing'
import {
  createGrade7Dependencies,
  createGrade7RunDescriptor,
  grade7Challenges,
  grade7CompositionPolicy,
  grade7Families,
  GRADE_7_CONTENT_VERSION,
  GRADE_7_RULESET_VERSION,
  GRADE_7_VARIANT_CATALOG_VERSION,
} from '../../src/content/grade-7'

const PACK_VERSION = 'tg1-pack-1'
const BASE_URL = process.env['EGRESADO_BASE_URL'] ?? 'http://localhost:3000'

const dependencies = createGrade7Dependencies()
const catalog = createContentCatalog(grade7Families, grade7Challenges)

const argv = process.argv.slice(2)
const has = (flag: string): boolean => argv.includes(flag)
const value = (flag: string): string | undefined => {
  const index = argv.indexOf(flag)
  return index >= 0 ? argv[index + 1] : undefined
}

const out: string[] = []
const say = (line = ''): void => {
  out.push(line)
}

function caseUrl(seed: string): string {
  return `${BASE_URL}/dev/teacher-gate?seed=${encodeURIComponent(seed)}`
}

function context(): void {
  say('Egresado · Teacher Gate 1')
  say(`  pack             ${PACK_VERSION}`)
  say(`  contenido        ${GRADE_7_CONTENT_VERSION}`)
  say(`  reglas           ${GRADE_7_RULESET_VERSION}`)
  say(`  catálogo         ${GRADE_7_VARIANT_CATALOG_VERSION}`)
  say(
    `  dificultad       ${candidateDifficultyCostPolicy.id}@${candidateDifficultyCostPolicy.version} (oficial=${String(candidateDifficultyCostPolicy.official)})`,
  )
  say(
    `  composición      ${grade7CompositionPolicy.id}@${grade7CompositionPolicy.version} (oficial=${String(grade7CompositionPolicy.official)})`,
  )
  say(
    `  puntaje          ${candidateFairScorePolicy.id}@${candidateFairScorePolicy.version} (oficial=${String(candidateFairScorePolicy.official)})`,
  )
  say()
  say('  Ninguna calibración está aprobada. Eso es lo que esta reunión decide.')
  say()
}

function help(): void {
  say('Uso: pnpm teacher-gate [opción]')
  say()
  say('  --help              esta ayuda')
  say('  --list              los casos de la sesión, en orden')
  say(
    '  --validate          comprueba que cada caso siga mostrando lo que promete',
  )
  say('  --case <id>         la ficha completa de un caso, con su URL')
  say('  --all               todas las fichas, en orden de presentación')
  say(
    '  --difficulty        la tabla de niveles para conversar con los docentes',
  )
  say(
    '  --scores            ejemplos de puntaje y comparación de ponderaciones',
  )
  say('  --prepare           el plan de la sesión de quince minutos')
  say('  --verbose           agrega los identificadores internos a la salida')
  say()
  say('Antes de la reunión:')
  say('  1. pnpm dev                    levanta la aplicación')
  say('  2. pnpm teacher-gate --validate  confirma que los casos reproducen')
  say('  3. pnpm teacher-gate --prepare   imprime el plan de la sesión')
  say()
  say(
    `Las URLs apuntan a ${BASE_URL}. Cambiá EGRESADO_BASE_URL si usás otro puerto.`,
  )
}

function list(): void {
  for (const entry of orderedTeacherGateCases()) {
    say(`  ${entry.id.padEnd(7)} ${String(entry.minutes)} min  ${entry.title}`)
    say(`          ${entry.purpose}`)
  }
  say()
  say('  Ficha completa: pnpm teacher-gate --case TG1-A')
}

function validate(): boolean {
  let ok = true

  for (const problem of teacherGateCaseIssues()) {
    say(`  ✗ manifiesto: ${problem}`)
    ok = false
  }

  for (const entry of orderedTeacherGateCases()) {
    const report = verifyTeacherGateCase(
      entry,
      createGrade7RunDescriptor(entry.seed),
      dependencies,
    )
    if (report.reproduces) {
      say(
        `  ✓ ${entry.id}  seed ${entry.seed}  →  ${entry.expectedTemplate} (evento ${String(report.reachedAtEvent)})`,
      )
      if (has('--verbose') && report.address !== undefined) {
        say(`      dirección ${report.address} · banda ${String(report.band)}`)
      }
    } else {
      ok = false
      say(`  ✗ ${entry.id}  seed ${entry.seed}`)
      say(`      ${report.detail}`)
    }
  }

  say()
  if (ok) {
    say('  Los casos reproducen. La sesión se puede dar tal como está escrita.')
  } else {
    say('  Hay casos que ya no muestran lo que el pack promete.')
    say('  NO des la reunión con estos casos: buscá seeds nuevos y actualizá')
    say('  el manifiesto y la documentación antes de convocar a nadie.')
  }
  return ok
}

function showCase(id: string): boolean {
  const entry = teacherGateCase(id)
  if (entry === undefined) {
    say(`  No existe el caso «${id}».`)
    say('  Los casos disponibles: pnpm teacher-gate --list')
    return false
  }

  say(`CASO ${entry.id} · ${entry.title}`)
  say('─'.repeat(60))
  say(`Objetivo   ${entry.purpose}`)
  say(`Duración   ${String(entry.minutes)} minutos`)
  say(`Jugar en   ${caseUrl(entry.seed)}`)
  say()
  say('Qué va a ver')
  say(`  ${entry.whatTheySee}`)
  say()
  say('Trabajo matemático')
  say(`  ${entry.mathematics}`)
  say()
  say('Qué observar mientras juega')
  for (const item of entry.observe) {
    say(`  · ${item}`)
  }
  say()
  say('Preguntas')
  for (const question of entry.questions) {
    say(`  · ${question}`)
  }

  if (has('--verbose')) {
    const template = catalog.template(entry.expectedTemplate)
    say()
    say('Detalles técnicos')
    say(`  seed              ${entry.seed}`)
    say(`  plantilla         ${entry.expectedTemplate}`)
    say(`  banda declarada   ${entry.expectedBand}`)
    say(`  banda del motor   ${String(template?.band)}`)
    say(`  interacción       ${String(template?.interaction)}`)
    say(`  superficie        ${entry.surface}`)
  }

  return true
}

function difficulty(): void {
  say('Niveles propuestos · candidatos de ingeniería, sin aprobación docente')
  say()

  const rows = [...grade7Challenges].sort((left, right) =>
    left.band < right.band
      ? -1
      : left.band > right.band
        ? 1
        : left.id < right.id
          ? -1
          : 1,
  )

  for (const template of rows) {
    const cost = candidateDifficultyCostPolicy.costs[template.band]
    say(`  ${template.band.toUpperCase().padEnd(9)} ${template.id}`)
    if (has('--verbose')) {
      say(
        `            costo de armado ${formatCost(cost)} · nivel autorado ${String(template.baseDifficulty)} · banda derivada ${bandOf(template.cognitive)}`,
      )
    }
  }

  say()
  say('  Los nombres de las situaciones y el porqué de cada nivel están en')
  say(
    '  docs/06-delivery/teacher-gate-1/04-dificultad.md, escrito para leer en voz alta.',
  )
}

/** Four runs a teacher can actually reason about, computed by the real scorer. */
function scoreExamples(): readonly {
  readonly label: string
  readonly events: readonly ScoredEvent[]
  readonly reading: string
}[] {
  const event = (
    templateId: string,
    quality: ScoredEvent['quality'],
    precision = 1,
    efficiency = 1,
  ): ScoredEvent => ({
    templateId: templateId as ScoredEvent['templateId'],
    quality,
    metrics: metrics({ precision, efficiency, risk: 0 }),
  })

  return [
    {
      label: 'Partida perfecta (colectivo + acto)',
      events: [
        event('g7.bus-timing', 'optimal'),
        event('g7.may-25-act', 'optimal'),
      ],
      reading: 'todo óptimo llega al máximo de la escala',
    },
    {
      label: 'Partida perfecta, otra combinación (una sola situación)',
      events: [event('g7.bus-latest-departure', 'optimal')],
      reading: 'menos situaciones no significa menos techo',
    },
    {
      label: 'Matemática fuerte, trabajo en equipo flojo',
      events: [
        event('g7.bus-timing', 'optimal'),
        event('g7.group-tasks', 'efficient', 1, 0.2),
      ],
      reading: 'el reparto entra pero desaprovecha las fuerzas del grupo',
    },
    {
      label: 'Matemática floja, trabajo en equipo perfecto',
      events: [
        event('g7.bus-timing', 'functional'),
        event('g7.group-tasks', 'invalid', 1, 1),
      ],
      reading: 'el equipo perfecto no compra la partida',
    },
  ]
}

const COMPARISON: readonly CompetitiveScorePolicy[] = [
  candidateFairScorePolicy,
  {
    ...candidateFairScorePolicy,
    id: 'comparación-85-10-5',
    version: '1.0.0-comparison',
    weights: { math: 8_500, team: 1_000, aura: 500 },
  },
  {
    ...candidateFairScorePolicy,
    id: 'comparación-90-10-0',
    version: '1.0.0-comparison',
    weights: { math: 9_000, team: 1_000, aura: 0 },
  },
]

function scores(): void {
  say('Ejemplos de puntaje · escala de 0 a 10.000')
  say()

  for (const example of scoreExamples()) {
    const result = scoreRun(example.events, catalog, candidateFairScorePolicy)
    if (!isOk(result)) {
      say(`  ${example.label}: no se pudo calcular (${result.error.code})`)
      continue
    }
    const parts = result.value.components
      .filter((component) => component.opportunities > 0)
      .map(
        (component) =>
          `${component.component} ${String(component.performance)} → ${String(component.contribution)}`,
      )
      .join(' · ')
    say(`  ${String(result.value.fairScore).padStart(6)}  ${example.label}`)
    say(`          ${example.reading}`)
    if (has('--verbose')) {
      say(`          ${parts}`)
    }
  }

  say()
  say('Las mismas partidas con otras ponderaciones')
  say()
  say(
    `  ${'caso'.padEnd(46)}${COMPARISON.map(
      (policy) =>
        policy.weights.math / 100 +
        '/' +
        String(policy.weights.team / 100) +
        '/' +
        String(policy.weights.aura / 100),
    )
      .map((label) => label.padStart(12))
      .join('')}`,
  )

  for (const example of scoreExamples()) {
    const cells = COMPARISON.map((policy) => {
      const result = scoreRun(example.events, catalog, policy)
      return isOk(result)
        ? String(result.value.fairScore).padStart(12)
        : '—'.padStart(12)
    }).join('')
    say(`  ${example.label.slice(0, 45).padEnd(46)}${cells}`)
  }

  say()
  say('  Donde las tres columnas coinciden, la partida no ofrecía trabajo en')
  say('  equipo ni Aura: la ponderación no tiene sobre qué cambiar nada.')
  say('  Ninguna de las tres es la recomendada. Elegir es lo que se pide hoy.')
}

function prepare(): void {
  say('Plan de la sesión · 15 minutos')
  say()
  say('  00:00–01:00  Contexto. Qué es Egresado y qué se decide hoy.')
  let minute = 1
  for (const entry of orderedTeacherGateCases()) {
    if (entry.order > 2) {
      continue
    }
    const end = minute + entry.minutes
    say(
      `  ${String(minute).padStart(2, '0')}:00–${String(end).padStart(2, '0')}:00  ${entry.id} · ${entry.title}`,
    )
    say(`               ${caseUrl(entry.seed)}`)
    minute = end
  }
  say(
    `  ${String(minute).padStart(2, '0')}:00–10:00  Niveles. pnpm teacher-gate --difficulty`,
  )
  say('  10:00–13:00  Puntaje. pnpm teacher-gate --scores')
  say('  13:00–15:00  Decisiones. Planilla 07-planilla-decisiones.md')
  say()
  say('  Si sobra tiempo: TG1-C (acto del 25) y TG1-D (trabajo grupal).')
  say('  Si falta: se difieren intentos y desempate, que no bloquean STAGE-07.')
  say()
  say('  Decisiones a registrar: TG1-01 a TG1-14.')
  say('  Guion completo: docs/06-delivery/teacher-gate-1/01-guion.md')
}

// ── despacho ────────────────────────────────────────────────────────────────

let failed = false

if (has('--help') || argv.length === 0) {
  context()
  help()
} else if (has('--list')) {
  context()
  list()
} else if (has('--validate')) {
  context()
  failed = !validate()
} else if (has('--case')) {
  const id = value('--case')
  context()
  if (id === undefined) {
    say(
      '  Falta el identificador del caso. Ejemplo: pnpm teacher-gate --case TG1-A',
    )
    failed = true
  } else {
    failed = !showCase(id.toUpperCase())
  }
} else if (has('--all')) {
  context()
  for (const entry of orderedTeacherGateCases()) {
    showCase(entry.id)
    say()
  }
} else if (has('--difficulty')) {
  context()
  difficulty()
} else if (has('--scores')) {
  context()
  scores()
} else if (has('--prepare')) {
  context()
  prepare()
} else {
  context()
  say(`  Opción desconocida: ${argv.join(' ')}`)
  help()
  failed = true
}

process.stdout.write(`${out.join('\n')}\n`)
if (failed) {
  process.exitCode = 1
}
