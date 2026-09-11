import { toChallengeId, toStoryletId, type Storylet } from '@/game'
import { grade7Storylets } from '@/content/grade-7'

export const grade1IntroId = toStoryletId('y1.intro')
export const grade1ReviewId = toStoryletId('y1.review')
const beats = [
  [
    'mobile-data',
    'Rutinas propias',
    'Datos para estos días',
    'Organizás el teléfono para las actividades de la semana.',
  ],
  [
    'course-project-expo',
    'Proyecto del Curso I',
    'La primera expo',
    'El proyecto sigue la historia del grupo, con otra forma de repartir responsabilidades.',
  ],
  [
    'classroom-layout',
    'Preparar el espacio',
    'Un aula que funcione',
    'Las mesas y los recorridos tienen que convivir.',
  ],
  [
    'rehearsal-schedule',
    'Preparación del Día del Estudiante',
    'Antes del ensayo',
    'Los compromisos empiezan a compartir la misma tarde.',
  ],
  [
    'student-day-challenge-wheel',
    '21 de septiembre',
    'La rueda del curso',
    'El curso decide qué actividades entran en su rueda.',
  ],
] as const
export const grade1Storylets: readonly Storylet[] = [
  {
    id: grade1IntroId,
    kind: 'one-shot',
    stages: ['year-1'],
    weight: 10,
    priority: 100,
    requires: { kind: 'always' },
    tags: ['consolidacion', 'proyecto'],
    eyebrow: 'Empieza primero',
    title: 'El mismo lugar, otra forma',
    text: 'Ya sabés cómo funciona esta escuela. Ahora empezás a descubrir cómo funcionás vos adentro. El Proyecto del Curso I acompaña el año: habrá una exposición, aunque esta vez te toque decidir en otra parte.',
    challengePool: [],
    effects: [
      { kind: 'flag-set', flag: 'y1.project.context-established', value: true },
    ],
    followUps: [],
  },
  ...beats.map(([id, eyebrow, title, text], i): Storylet => ({
    id: toStoryletId(`y1.scene.${id}`),
    kind: 'one-shot',
    stages: ['year-1'],
    weight: 10,
    priority: 90 - i * 10,
    requires: { kind: 'storylet-seen', storyletId: grade1IntroId },
    tags: ['consolidacion'],
    eyebrow,
    title,
    text,
    challengePool: [toChallengeId(`y1.${id}`)],
    effects: [],
    followUps: [],
  })),
  {
    id: toStoryletId('y1.closing'),
    kind: 'finale',
    stages: ['year-1'],
    weight: 1,
    priority: -10,
    requires: { kind: 'storylet-seen', storyletId: grade1IntroId },
    tags: ['cierre'],
    eyebrow: 'Cierra primero',
    title: 'Una manera propia',
    text: 'El curso sigue siendo el mismo, pero ya reconoce algunas maneras tuyas de organizar, construir y resolver. Este recorrido de práctica termina acá: segundo todavía no está disponible.',
    challengePool: [],
    effects: [{ kind: 'flag-set', flag: 'y1.closed', value: true }],
    followUps: [],
  },
  {
    id: grade1ReviewId,
    kind: 'callback',
    stages: ['year-1'],
    weight: 1,
    priority: 0,
    requires: { kind: 'never' },
    tags: ['repaso'],
    eyebrow: 'Antes de cerrar primero',
    title: 'Repaso del año',
    text: 'Antes de cerrar primero quedó algo dando vueltas. Lo retomás en una situación corta; si quedó más de una cosa, las otras se comentan en el mismo repaso. Después, el año cierra igual.',
    challengePool: [],
    effects: [],
    followUps: [],
  },
]
export const grade1CareerStorylets = [...grade7Storylets, ...grade1Storylets]
