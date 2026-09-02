/**
 * 7.º grado — el arco narrativo.
 *
 * Ocho eventos: dos beats narrativos y seis situaciones. El orden no lo
 * decide la UI ni un índice: cada storylet declara qué tuvo que pasar antes,
 * y el motor narrativo elige. Encadenar por `storylet-seen` deja exactamente
 * uno elegible en cada paso, así que la secuencia es determinista sin dejar de
 * pasar por el selector.
 *
 * El evento 6 es una bifurcación real: si el jugador viene resolviendo bien, el
 * grupo le ofrece coordinar; si no, le reparten una parte concreta. Las dos
 * ramas se excluyen mutuamente con `storylet-not-seen`, de modo que la que no
 * salió no reaparece más adelante.
 */

import { toChallengeId, toStoryletId, type Storylet } from '@/game'

const busTiming = toChallengeId('g7.bus-timing')
const busLatestDeparture = toChallengeId('g7.bus-latest-departure')
const may25Act = toChallengeId('g7.may-25-act')
const muralPaint = toChallengeId('g7.mural-paint')
const notebookOffer = toChallengeId('g7.notebook-offer')
const groupTasks = toChallengeId('g7.group-tasks')
const standSupplies = toChallengeId('g7.stand-supplies')

const intro = toStoryletId('g7.intro')
const bus = toStoryletId('g7.bus')
const may25 = toStoryletId('g7.may-25')
const mural = toStoryletId('g7.mural')
const notebook = toStoryletId('g7.notebook')
const projectLead = toStoryletId('g7.project-lead')
const projectSupport = toStoryletId('g7.project-support')
const groupWork = toStoryletId('g7.group-work')
const fairStand = toStoryletId('g7.fair-stand')
const review = toStoryletId('g7.review')

export const grade7Storylets: readonly Storylet[] = [
  {
    id: intro,
    kind: 'one-shot',
    stages: ['grade-7'],
    weight: 10,
    priority: 90,
    requires: { kind: 'always' },
    tags: ['apertura'],
    eyebrow: 'Apertura',
    title: 'Arranca séptimo',
    text: 'Primer día. El aula huele a cuaderno nuevo, todavía nadie sabe los nombres de todos y en el pizarrón ya anunciaron la feria de fin de año.',
    challengePool: [],
    effects: [{ kind: 'flag-set', flag: 'g7.empezo', value: true }],
    followUps: [bus],
  },
  {
    id: bus,
    kind: 'one-shot',
    stages: ['grade-7'],
    weight: 10,
    priority: 80,
    requires: { kind: 'storylet-seen', storyletId: intro },
    tags: ['rutina', 'tiempo'],
    eyebrow: 'Segunda semana',
    title: 'Segunda semana',
    text: 'Todavía estás aprendiendo cuánto tarda el viaje hasta la escuela.',
    // Las dos plantillas de la familia colectivo. El seed elige cuál sale, y
    // son preguntas distintas: una se resuelve eligiendo entre salidas, la otra
    // dando el número. La misma situación, otro razonamiento.
    challengePool: [busTiming, busLatestDeparture],
    effects: [],
    followUps: [may25],
  },
  {
    // El único momento del año que pasa en público, y por eso el que establece
    // Aura. El acto cae en mayo, después de las primeras semanas de clase y
    // antes de que arranque el proyecto de la feria, así que se intercala en el
    // calendario escolar sin partir la cadena causal del proyecto.
    id: may25,
    kind: 'one-shot',
    stages: ['grade-7'],
    weight: 10,
    priority: 75,
    requires: { kind: 'storylet-seen', storyletId: bus },
    tags: ['acto', 'publico', 'aura'],
    eyebrow: 'Acto escolar',
    title: 'El acto del 25',
    text: 'Faltan dos días para el acto y la maestra reparte los pasos de la coreografía.',
    challengePool: [may25Act],
    effects: [],
    followUps: [mural],
  },
  {
    id: mural,
    kind: 'one-shot',
    stages: ['grade-7'],
    weight: 10,
    priority: 70,
    requires: { kind: 'storylet-seen', storyletId: may25 },
    tags: ['feria', 'proyecto'],
    eyebrow: 'Feria escolar',
    title: 'Empieza el proyecto',
    text: 'El curso eligió qué presentar en la feria y la primera tarea es el mural de la entrada.',
    challengePool: [muralPaint],
    effects: [],
    followUps: [notebook],
  },
  {
    id: notebook,
    kind: 'one-shot',
    stages: ['grade-7'],
    weight: 10,
    priority: 60,
    requires: { kind: 'storylet-seen', storyletId: mural },
    tags: ['proyecto', 'dinero'],
    eyebrow: 'Proyecto',
    title: 'Falta el equipo',
    text: 'Para mostrar el proyecto hace falta una notebook y la que había dejó de andar en mayo.',
    challengePool: [notebookOffer],
    effects: [],
    followUps: [projectLead, projectSupport],
  },
  {
    // Rama fuerte: aparece sólo si las últimas decisiones salieron bien.
    id: projectLead,
    kind: 'callback',
    stages: ['grade-7'],
    weight: 10,
    priority: 55,
    requires: {
      kind: 'all',
      conditions: [
        { kind: 'storylet-seen', storyletId: notebook },
        { kind: 'storylet-not-seen', storyletId: projectSupport },
        {
          kind: 'recent-quality-at-least',
          quality: 'efficient',
          withinLast: 3,
          count: 2,
        },
      ],
    },
    tags: ['callback', 'grupo'],
    eyebrow: 'Proyecto',
    title: 'Te lo piden a vos',
    text: 'Las últimas decisiones del proyecto salieron bien y se notó. Cuando hay que organizar el trabajo grupal, el curso propone que lo coordines vos.',
    challengePool: [],
    effects: [
      // Que el curso te proponga coordinar es un evento colaborativo: es el que
      // establece Equipo, y por eso la tira aparece recién acá.
      {
        kind: 'career',
        effects: { equipo: 6, estilo: { axis: 'estratega', amount: 6 } },
      },
      { kind: 'flag-set', flag: 'g7.coordina', value: true },
    ],
    followUps: [groupWork],
  },
  {
    // Alternativa: su condición sólo usa predicados decidibles, así que siempre
    // hay una salida garantizada en este paso.
    id: projectSupport,
    kind: 'one-shot',
    stages: ['grade-7'],
    weight: 10,
    priority: 50,
    requires: {
      kind: 'all',
      conditions: [
        { kind: 'storylet-seen', storyletId: notebook },
        { kind: 'storylet-not-seen', storyletId: projectLead },
      ],
    },
    tags: ['grupo'],
    eyebrow: 'Proyecto',
    title: 'Se arma el grupo',
    text: 'El proyecto avanzó a los tumbos, así que el curso decide repartir el trabajo entre todos y que cada uno se haga cargo de una parte.',
    challengePool: [],
    effects: [
      { kind: 'career', effects: { equipo: 4 } },
      { kind: 'flag-set', flag: 'g7.reparteGrupo', value: true },
    ],
    followUps: [groupWork],
  },
  {
    id: groupWork,
    kind: 'one-shot',
    stages: ['grade-7'],
    weight: 10,
    priority: 40,
    requires: {
      kind: 'any',
      conditions: [
        { kind: 'storylet-seen', storyletId: projectLead },
        { kind: 'storylet-seen', storyletId: projectSupport },
      ],
    },
    tags: ['grupo', 'asignacion'],
    eyebrow: 'Grupo',
    title: 'Repartir el trabajo',
    text: 'Quedan dos semanas y cuatro partes por hacer.',
    challengePool: [groupTasks],
    effects: [],
    followUps: [fairStand],
  },
  {
    id: fairStand,
    kind: 'finale',
    stages: ['grade-7'],
    weight: 10,
    priority: 30,
    requires: { kind: 'storylet-seen', storyletId: groupWork },
    tags: ['feria', 'cierre'],
    eyebrow: 'La feria',
    title: 'La feria',
    text: 'Último detalle antes de abrir el stand.',
    challengePool: [standSupplies],
    effects: [],
    followUps: [],
  },
  {
    /*
     * El repaso de fin de año.
     *
     * No se elige: lo agenda la progresión cuando el año quedó debiendo algo, y
     * por eso su condición es `never`. Está en el content set para que ese beat
     * tenga palabras alrededor —un beat que aparece sin motivo se lee como un
     * error, no como una consecuencia— y no para que el selector narrativo lo
     * pueda sacar por su cuenta.
     *
     * El tono es el de la escuela, no el de un castigo: quedó algo dando
     * vueltas, se repasa, el año sigue.
     */
    id: review,
    kind: 'callback',
    stages: ['grade-7'],
    weight: 1,
    priority: 0,
    requires: { kind: 'never' },
    tags: ['repaso'],
    eyebrow: 'Antes de cerrar el año',
    title: 'Quedó algo dando vueltas',
    text: 'La profe te para en el pasillo: «Che, esa cuenta del colectivo la dejamos por la mitad. Sentate cinco minutos y la sacamos, así cerrás bien el año.»',
    challengePool: [],
    effects: [],
    followUps: [],
  },
]

/** Ids expuestos para tests y para el resumen del año. */
export const grade7StoryletIds = {
  intro,
  bus,
  may25,
  mural,
  notebook,
  projectLead,
  projectSupport,
  groupWork,
  fairStand,
  review,
} as const
