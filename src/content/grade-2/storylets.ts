import { toChallengeId, toStoryletId, type Storylet } from '@/game'
import { grade1CareerStorylets } from '@/content/grade-1/storylets'

export const grade2IntroId = toStoryletId('y2.intro')
export const grade2ReviewId = toStoryletId('y2.review')

/** One framing beat per Template, in the chronology the design declares. */
const beats = [
  [
    'course-project-survey',
    'Proyecto del Curso II',
    'Lo que dice la encuesta',
    'El proyecto pregunta al nivel y ahora hay que decidir qué se puede publicar.',
  ],
  [
    'team-kit-order',
    'Antes del Intercurso',
    'Las pecheras',
    'El pedido tiene que alcanzar para todos y dejar repuestos.',
  ],
  [
    'intercurso-plan',
    'Intercurso',
    'El plan del día',
    'Las canchas necesitan gente en los dos turnos y no todos están todo el día.',
  ],
  [
    'standings-claim',
    'Intercurso',
    'La tabla',
    'Faltan partidos y el curso quiere publicar algo.',
  ],
  [
    'court-zones',
    'Intercurso',
    'Las postas',
    'Hay que repartir las postas en la cancha sin que se pisen.',
  ],
] as const

export const grade2Storylets: readonly Storylet[] = [
  {
    id: grade2IntroId,
    kind: 'one-shot',
    stages: ['year-2'],
    weight: 10,
    priority: 100,
    requires: { kind: 'always' },
    tags: ['pertenencia'],
    eyebrow: 'Marzo',
    title: 'Ya no sos el nuevo',
    text: 'Las decisiones del curso ahora te incluyen, y eso abre una pregunta: qué lugar ocupás entre los demás.',
    challengePool: [],
    effects: [],
    followUps: [],
  },
  ...beats.map(([id, eyebrow, title, text], index): Storylet => ({
    id: toStoryletId(`y2.scene.${id}`),
    kind: 'one-shot',
    stages: ['year-2'],
    weight: 10,
    priority: 90 - index * 10,
    requires: { kind: 'storylet-seen', storyletId: grade2IntroId },
    tags: ['pertenencia'],
    eyebrow,
    title,
    text,
    challengePool: [toChallengeId(`y2.${id}`)],
    effects: [],
    followUps: [],
  })),
  {
    id: grade2ReviewId,
    kind: 'callback',
    stages: ['year-2'],
    weight: 1,
    priority: 0,
    requires: { kind: 'never' },
    tags: ['repaso'],
    eyebrow: 'Antes de cerrar 2.º',
    title: 'Repaso del año',
    text: 'Quedó algo dando vueltas. Lo retomás en una situación corta; si quedó más de una cosa, las otras se comentan en el mismo Repaso. Después, el año cierra igual.',
    challengePool: [],
    effects: [],
    followUps: [],
  },
  {
    id: toStoryletId('y2.closing'),
    kind: 'one-shot',
    stages: ['year-2'],
    weight: 8,
    priority: 90,
    requires: { kind: 'always' },
    tags: ['pertenencia'],
    eyebrow: 'En el curso',
    title: 'Alguien lo empuja',
    text: 'Algunas cosas salen por acuerdo y otras porque alguien las empuja. Este año te toca estar de los dos lados.',
    challengePool: [],
    effects: [{ kind: 'flag-set', flag: 'y2.closed', value: true }],
    followUps: [],
  },
]

/** The career set: every year implemented so far, in order. */
export const grade2CareerStorylets: readonly Storylet[] = [
  ...grade1CareerStorylets,
  ...grade2Storylets,
]
