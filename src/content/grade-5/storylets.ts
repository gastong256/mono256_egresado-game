import { toChallengeId, toStoryletId, type Storylet } from '@/game'
import { grade4CareerStorylets } from '@/content/grade-4/storylets'

export const grade5IntroId = toStoryletId('y5.intro')
export const grade5ReviewId = toStoryletId('y5.review')

/** One framing beat per Template, in the chronology the design declares. */
const beats = [
  [
    'final-trip-or-event',
    'Viaje de egresados',
    'El viaje',
    'El curso juntó plata todo el año y hay que elegir con qué se queda.',
  ],
  [
    'course-project-final',
    'Proyecto del Curso V',
    'La muestra final',
    'Faltan tres días para la muestra y se cae algo del plan.',
  ],
  [
    'yearbook',
    'Octubre',
    'El anuario',
    'La imprenta entrega páginas contadas y hay más material del que entra.',
  ],
  [
    'stage-screen',
    'Acto de egreso',
    'La pantalla',
    'La imagen del curso y la pantalla del salón no tienen la misma forma.',
  ],
  [
    'next-step-options',
    'Diciembre',
    'El año que viene',
    'Alguien te pregunta qué vas a hacer, y hay varias ideas dando vueltas.',
  ],
] as const

export const grade5Storylets: readonly Storylet[] = [
  {
    id: grade5IntroId,
    kind: 'one-shot',
    stages: ['year-5'],
    weight: 10,
    priority: 100,
    requires: { kind: 'always' },
    tags: ['cierre'],
    eyebrow: 'El último marzo',
    title: 'El último año',
    text: 'Todo lo que decidiste hasta acá viene con vos: el curso ya sabe cómo resolvés. Este año cierra el recorrido, y también empieza a asomar lo que viene después.',
    challengePool: [],
    effects: [],
    followUps: [],
  },
  ...beats.map(([id, eyebrow, title, text], index): Storylet => ({
    id: toStoryletId(`y5.scene.${id}`),
    kind: 'one-shot',
    stages: ['year-5'],
    weight: 10,
    priority: 90 - index * 10,
    requires: { kind: 'storylet-seen', storyletId: grade5IntroId },
    tags: ['cierre'],
    eyebrow,
    title,
    text,
    challengePool: [toChallengeId(`y5.${id}`)],
    effects: [],
    followUps: [],
  })),
  {
    id: grade5ReviewId,
    kind: 'callback',
    stages: ['year-5'],
    weight: 1,
    priority: 0,
    requires: { kind: 'never' },
    tags: ['repaso'],
    eyebrow: 'Antes de cerrar 5.º',
    title: 'Repaso del año',
    text: 'Quedó algo dando vueltas. Lo retomás en una situación corta; si quedó más de una cosa, las otras se comentan en el mismo Repaso. Después, el año cierra igual.',
    challengePool: [],
    effects: [],
    followUps: [],
  },
  {
    id: toStoryletId('y5.closing'),
    kind: 'one-shot',
    stages: ['year-5'],
    weight: 8,
    priority: 90,
    requires: { kind: 'always' },
    tags: ['cierre'],
    eyebrow: 'Último año',
    title: 'Lo que queda escrito',
    text: 'Lo que viene después no lo decide este juego. Lo único que queda escrito acá es cómo fuiste resolviendo, y no es poco.',
    challengePool: [],
    effects: [{ kind: 'flag-set', flag: 'y5.closed', value: true }],
    followUps: [],
  },
]

/** The career set: every year implemented so far, in order. */
export const grade5CareerStorylets: readonly Storylet[] = [
  ...grade4CareerStorylets,
  ...grade5Storylets,
]
