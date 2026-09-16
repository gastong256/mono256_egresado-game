import { toChallengeId, toStoryletId, type Storylet } from '@/game'
import { grade3CareerStorylets } from '@/content/grade-3/storylets'

export const grade4IntroId = toStoryletId('y4.intro')
export const grade4ReviewId = toStoryletId('y4.review')

/** One framing beat per Template, in the chronology the design declares. */
const beats = [
  [
    'course-project-fundraiser',
    'Proyecto del Curso IV',
    'La peña',
    'El proyecto de este año junta plata, y lo que se prepara hay que decidirlo antes.',
  ],
  [
    'shift-coverage',
    'Evento escolar',
    'Los turnos',
    'El evento dura tres horas y los puestos no pueden quedar vacíos.',
  ],
  [
    'school-event-flow',
    'Evento escolar',
    'La cola',
    'La gente entra, se acredita y pasa al buffet: todo en fila.',
  ],
  [
    'event-floor-plan',
    'Evento escolar',
    'El salón',
    'Hay que ubicar el escenario y las mesas sin tapar el pasillo.',
  ],
  [
    'represent-class',
    'Consejo escolar',
    'Representar al curso',
    'El consejo escucha propuestas y el curso manda a alguien con las suyas.',
  ],
] as const

export const grade4Storylets: readonly Storylet[] = [
  {
    id: grade4IntroId,
    kind: 'one-shot',
    stages: ['year-4'],
    weight: 10,
    priority: 100,
    requires: { kind: 'always' },
    tags: ['responsabilidad'],
    eyebrow: 'Marzo',
    title: 'Cuarto año',
    text: 'Este año las decisiones ya no terminan en vos. Si algo sale mal, hay gente esperando, y eso cambia cómo se piensan las cosas.',
    challengePool: [],
    effects: [],
    followUps: [],
  },
  ...beats.map(([id, eyebrow, title, text], index): Storylet => ({
    id: toStoryletId(`y4.scene.${id}`),
    kind: 'one-shot',
    stages: ['year-4'],
    weight: 10,
    priority: 90 - index * 10,
    requires: { kind: 'storylet-seen', storyletId: grade4IntroId },
    tags: ['responsabilidad'],
    eyebrow,
    title,
    text,
    challengePool: [toChallengeId(`y4.${id}`)],
    effects: [],
    followUps: [],
  })),
  {
    id: grade4ReviewId,
    kind: 'callback',
    stages: ['year-4'],
    weight: 1,
    priority: 0,
    requires: { kind: 'never' },
    tags: ['repaso'],
    eyebrow: 'Antes de cerrar cuarto',
    title: 'Repaso del año',
    text: 'Antes de cerrar cuarto quedó algo dando vueltas. Lo retomás en una situación corta; si quedó más de una cosa, las otras se comentan en el mismo repaso. Después, el año cierra igual.',
    challengePool: [],
    effects: [],
    followUps: [],
  },
  {
    id: toStoryletId('y4.closing'),
    kind: 'one-shot',
    stages: ['year-4'],
    weight: 8,
    priority: 90,
    requires: { kind: 'always' },
    tags: ['responsabilidad'],
    eyebrow: 'Diciembre',
    title: 'Cierra cuarto',
    text: 'Se terminó el año del evento. Algunas cosas salieron porque alguien las sostuvo, y eso también se nota cuando no pasa.',
    challengePool: [],
    effects: [{ kind: 'flag-set', flag: 'y4.closed', value: true }],
    followUps: [],
  },
]

/** The career set: every year implemented so far, in order. */
export const grade4CareerStorylets: readonly Storylet[] = [
  ...grade3CareerStorylets,
  ...grade4Storylets,
]
