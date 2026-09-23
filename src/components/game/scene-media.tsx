import Image from 'next/image'

import { cn } from '@/lib/ui/cn'

/**
 * Imagen contextual.
 *
 * Egresado es un juego cuya UI ya es su identidad visual: si una pantalla
 * funciona sin imagen, sale sin imagen. Como máximo una por situación ordinaria,
 * ninguna en un Repaso. Los interludios usan láminas de objetos a lápiz.
 * El arte enriquece; nunca estructura.
 *
 * Todo el tratamiento vive acá y no se repite por pantalla: caja 16:9 en todos
 * los anchos, `object-fit: cover`, foco por `object-position`, filete de 1 px,
 * radio 0. Montada sobre el papel como una lámina pegada en una carpeta, sin
 * tarjeta blanca ni sombra alrededor.
 *
 * La caja tiene `aspect-ratio`, así que el espacio queda reservado antes de que
 * la imagen llegue: una situación matemática que salta 200 px mientras se lee
 * es peor que no tener imagen. Y la relación es una sola porque la columna de
 * juego mide 412 px en todos los breakpoints: las ilustraciones se generaron a
 * 16:9 con el sujeto en el 70 % central, y un recorte 3:2 en mobile ganaría
 * pocos píxeles de alto a cambio de empujar la decisión más abajo.
 *
 * Sin filtro de color. Las escenas ya están pintadas con la paleta del sistema
 * —papel, tinta, verde botella y rojo puntual—, y un desaturado pensado para
 * fotografía las alejaría de los tokens que las rodean.
 *
 * **`priority` no se usa acá.** Precargar el arte de un desafío que todavía no
 * apareció le roba ancho de banda a la pantalla que el jugador está mirando; la
 * imagen de la situación actual se pide sola cuando entra a pantalla.
 *
 * El `alt` es vacío por defecto: en una situación, el eyebrow dice el momento,
 * el título nombra el evento y la prosa cuenta el lugar, así que la imagen es
 * ambientación y describirla duplicaría la narración a quien usa un lector de
 * pantalla. Se pasa un texto sólo cuando la imagen aporta algo que el texto de
 * al lado no dice, y entonces describe el *lugar y el momento*, nunca la
 * mecánica.
 */
export function SceneMedia({
  src,
  alt = '',
  focus = 'center',
  sizes = '(max-width: 412px) 100vw, 412px',
  className,
}: {
  readonly src: string
  /** Vacío si el texto de al lado ya sitúa la escena; si no, lugar y momento. */
  readonly alt?: string
  /** Punto focal, como `object-position`. */
  readonly focus?: 'left' | 'center' | 'right'
  /** Ancho real si se compone una lámina compacta, como la del egreso. */
  readonly sizes?: string
  readonly className?: string
}) {
  return (
    <div
      data-testid="scene-media"
      className={cn(
        'border-rule relative aspect-video w-full overflow-hidden border',
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        // Una sola columna de 412 px en todos los breakpoints: pedir una imagen
        // más grande que eso es descargar píxeles que nadie va a ver.
        sizes={sizes}
        className={cn(
          'object-cover',
          focus === 'left' && 'object-left',
          focus === 'center' && 'object-center',
          focus === 'right' && 'object-right',
        )}
      />
    </div>
  )
}
