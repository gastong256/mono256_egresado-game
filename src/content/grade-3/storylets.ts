import { toChallengeId, toStoryletId, type Storylet } from '@/game'
import { grade2CareerStorylets } from '@/content/grade-2/storylets'

export const grade3IntroId = toStoryletId('y3.intro')
export const grade3ReviewId = toStoryletId('y3.review')

/** One framing beat per Template, in the chronology the design declares. */
const beats = [
  [
    'transport-pass',
    'Todos los días',
    'Cómo vas a la escuela',
    'Arranca el año y hay que decidir cómo pagar los viajes de todos los días.',
  ],
  [
    'course-project-tech',
    'Proyecto del Curso III',
    'La feria de tecnología',
    'El proyecto de este año se muestra en la feria, y los recursos son del curso.',
  ],
  [
    'friend-day',
    'Día del Amigo',
    'La salida',
    'Se juntan a la tarde y cada uno llega y se va a su hora.',
  ],
  [
    'week-planner',
    'Septiembre',
    'La semana que viene',
    'Se junta todo: lo que vence, lo que ya estaba tomado y lo que querés hacer.',
  ],
  [
    'route-plan',
    'Un sábado',
    'Los mandados',
    'Te tocan los mandados del barrio y cada lugar tiene su horario.',
  ],
] as const

export const grade3Storylets: readonly Storylet[] = [
  {
    id: grade3IntroId,
    kind: 'one-shot',
    stages: ['year-3'],
    weight: 10,
    priority: 100,
    requires: { kind: 'always' },
    tags: ['autonomia'],
    eyebrow: 'Marzo',
    title: 'Nadie te dice el orden',
    text: 'Empezás a decidir vos: qué va primero, qué entra y qué queda afuera. Decidir de más también cansa, y eso es parte de tener autonomía.',
    challengePool: [],
    effects: [],
    followUps: [],
  },
  ...beats.map(([id, eyebrow, title, text], index): Storylet => ({
    id: toStoryletId(`y3.scene.${id}`),
    kind: 'one-shot',
    stages: ['year-3'],
    weight: 10,
    priority: 90 - index * 10,
    requires: { kind: 'storylet-seen', storyletId: grade3IntroId },
    tags: ['autonomia'],
    eyebrow,
    title,
    text,
    challengePool: [toChallengeId(`y3.${id}`)],
    effects: [],
    followUps: [],
  })),
  {
    id: grade3ReviewId,
    kind: 'callback',
    stages: ['year-3'],
    weight: 1,
    priority: 0,
    requires: { kind: 'never' },
    tags: ['repaso'],
    eyebrow: 'Antes de cerrar 3.º',
    title: 'Repaso del año',
    text: 'Quedó algo dando vueltas. Lo retomás en una situación corta; si quedó más de una cosa, las otras se comentan en el mismo Repaso. Después, el año cierra igual.',
    challengePool: [],
    effects: [],
    followUps: [],
  },
  {
    id: toStoryletId('y3.closing'),
    kind: 'one-shot',
    stages: ['year-3'],
    weight: 8,
    priority: 90,
    requires: { kind: 'always' },
    tags: ['autonomia'],
    eyebrow: 'Entre semana',
    title: 'La agenda es tuya',
    text: 'Nadie te la arma. Algunas cosas salen como las pensaste y otras las vas arreglando en el camino; las dos formas cuentan.',
    challengePool: [],
    effects: [{ kind: 'flag-set', flag: 'y3.closed', value: true }],
    followUps: [],
  },
]

/** The career set: every year implemented so far, in order. */
export const grade3CareerStorylets: readonly Storylet[] = [
  ...grade2CareerStorylets,
  ...grade3Storylets,
]
