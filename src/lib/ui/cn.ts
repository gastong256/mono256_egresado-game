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
 * mapa de grupos, y ante un `text-heading` que no reconoce como tamaño lo
 * clasifica como color: eso hacía que `text-heading` borrara
 * `text-primary-foreground` y los botones primarios salieran con la tinta
 * heredada en lugar de blanca. Cada escala propia del sistema tiene que estar
 * declarada acá.
 */

const merge = extendTailwindMerge<'egresado-motion'>({
  extend: {
    classGroups: {
      // Roles tipográficos: son tamaños, no colores.
      'font-size': [
        {
          text: [
            'display',
            'title',
            'heading',
            'subheading',
            'body',
            'body-sm',
            'caption',
            'label',
            'data',
            'data-lg',
            'data-xl',
          ],
        },
      ],
      rounded: [{ rounded: ['control', 'surface', 'card', 'pill'] }],
      shadow: [{ shadow: ['surface', 'raised', 'overlay'] }],
      // Utilidades propias declaradas en `base.css`.
      px: ['px-gutter'],
      pb: ['pb-safe'],
      'egresado-motion': [
        'motion-fast',
        'motion-standard',
        'motion-emphasized',
      ],
    },
  },
})

export function cn(...values: ClassValue[]): string {
  return merge(clsx(values))
}
