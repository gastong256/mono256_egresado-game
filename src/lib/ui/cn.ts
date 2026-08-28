import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Composición de clases de Tailwind, con los grupos de Egresado.
 *
 * Es la única utilidad de composición del proyecto. `clsx` arma la lista a
 * partir de condicionales; `tailwind-merge` se queda con la última clase de cada
 * grupo, que es lo que permite que un componente acepte `className` y el
 * consumidor pueda sobrescribir sin pelearse con el orden.
 *
 * La configuración extendida no es opcional. `tailwind-merge` trae su propio
 * mapa de grupos, y ante un `text-display` que no reconoce como tamaño lo
 * clasifica como color: eso hacía que un rol tipográfico borrara el color del
 * texto y el botón primario saliera con la tinta heredada. Cada escala propia
 * del sistema tiene que estar declarada acá.
 */

const merge = extendTailwindMerge<'eg-motion' | 'eg-canvas' | 'eg-text-shadow'>(
  {
    extend: {
      classGroups: {
        // Roles tipográficos: son tamaños, no colores.
        'font-size': [
          {
            text: [
              'milestone',
              'display',
              'section',
              'aura',
              'data-lg',
              'data',
              'title',
              'option',
              'goal',
              'detail',
              'action',
              'body-lg',
              'body',
              'ledger',
              'meta',
              'caption',
              'chip',
              'label',
              'eyebrow',
            ],
          },
        ],
        'font-family': [{ font: ['display', 'body'] }],
        // Utilidades propias declaradas en `base.css`.
        px: ['px-gutter'],
        pb: ['pb-safe'],
        'eg-canvas': ['eg-canvas'],
        'eg-text-shadow': ['text-shadow-aura', 'text-shadow-aura-sm'],
        'eg-motion': [
          'motion-enter',
          'motion-resolve',
          'motion-select',
          'motion-progress',
          'motion-estilo',
        ],
      },
    },
  },
)

export function cn(...values: ClassValue[]): string {
  return merge(clsx(values))
}
