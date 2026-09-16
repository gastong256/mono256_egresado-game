import { toChallengeId, toStoryletId, type Storylet } from '@/game'
import { grade4CareerStorylets } from '@/content/grade-4/storylets'

export const grade5IntroId = toStoryletId('y5.intro')
export const grade5ReviewId = toStoryletId('y5.review')

/** One framing beat per Template, in the chronology the design declares. */
const beats = [
  [
    'final-trip-or-event',
    'Marzo',
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
    'El acto',
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
    eyebrow: 'Marzo',
    title: 'Cuarto año',
    text: 'Este año las decisiones ya no terminan en vos. Si algo sale mal, hay gente esperando, y eso cambia cómo se piensan las cosas.',
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
    eyebrow: 'Antes de cerrar quinto',
    title: 'Repaso del año',
    text: 'Antes de cerrar quinto quedó algo dando vueltas. Lo retomás en una situación corta; si quedó más de una cosa, las otras se comentan en el mismo repaso. Después, el año cierra igual.',
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
    eyebrow: 'Diciembre',
    title: 'Cierra quinto',
    text: 'Terminaste. Lo que viene no lo decide este juego: lo único que quedó escrito acá es cómo fuiste resolviendo, que no es poco.',
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
