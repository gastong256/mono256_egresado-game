import type { PublicRunSummary } from '@/lib/competition/run-summary'

export const publicRunSummary: PublicRunSummary = {
  version: 1,
  career: { promedio: 8.7, equipo: 82, aura: 1250 },
  estilo: { aplicado: 30, estratega: 50, improvisador: 20 },
  playStyle: {
    id: 'estratega',
    label: 'Estratega',
    detail: 'Cada decisión tuvo su momento.',
  },
  profile: 'strategist',
  graduated: true,
  eventsPlayed: 9,
  recoveries: 0,
  previas: 0,
  optimalCount: 7,
  components: [
    {
      component: 'math',
      opportunities: 9,
      performance: 9500,
      contribution: 8800,
      effectiveWeight: 9000,
    },
    {
      component: 'team',
      opportunities: 3,
      performance: 10000,
      contribution: 1000,
      effectiveWeight: 1000,
    },
  ],
  achievements: [
    {
      id: 'milestone.graduated',
      label: 'Egresado',
      detail: 'Terminaste los seis años.',
      source: 'milestone',
    },
    {
      id: 'milestone.perfect-year',
      label: 'Un año redondo',
      detail: 'Todo Óptimo en 2.º.',
      source: 'milestone',
    },
    {
      id: 'flag.todos-participaron',
      label: 'Todos participaron',
      detail: 'Nadie se quedó sin una parte.',
      source: 'flag',
    },
  ],
  years: [
    {
      stage: 'year-2',
      numeral: '2.º',
      theme: 'Pertenencia',
      played: true,
      marker: 'perfect',
      highlight: 'El Intercurso',
    },
  ],
  memories: [
    {
      title: 'El Intercurso',
      text: 'Un encuentro con tu curso.',
      kind: 'iconic',
    },
  ],
}
