import Image from 'next/image'

import { cn } from '@/lib/ui/cn'

/**
 * Imagen contextual.
 *
 * Egresado es un juego cuya UI ya es su identidad visual: si una pantalla
 * funciona sin imagen, sale sin imagen. Como máximo una por situación ordinaria,
 * y con frecuencia cero. El arte enriquece; nunca estructura.
 *
 * Todo el tratamiento vive acá y no se repite por pantalla: 16:9 en desktop y
 * 3:2 en mobile, `object-fit: cover`, foco por `object-position`, borde de 1 px,
 * radio 0 y desaturado ~15 %. Montada sobre el papel como una foto pegada en una
 * carpeta.
 *
 * `width`/`height` van fijos y la caja tiene `aspect-ratio`, así que el espacio
 * queda reservado antes de que la imagen llegue: una situación matemática que
 * salta 200 px mientras se lee es peor que no tener imagen.
 *
 * **`priority` no se usa acá.** Precargar el arte de un desafío que todavía no
 * apareció le roba ancho de banda a la pantalla que el jugador está mirando.
 *
 * El alt describe el *lugar y el momento*, nunca la mecánica: «Una parada de
 * colectivo vacía a la mañana temprano», no «el desafío del colectivo».
 *
 * > Estado: el pack raster está briefeado y **no generado**. El componente
 * > existe para que la primera imagen que se produzca entre por un solo lugar;
 * > hoy ninguna pantalla del slice de 7.º lo monta, y eso es intencional.
 */
export function SceneMedia({
  src,
  alt,
  focus = 'center',
  className,
}: {
  readonly src: string
  /** Lugar y momento. Nunca la mecánica del desafío. */
  readonly alt: string
  /** Punto focal, como `object-position`. */
  readonly focus?: 'left' | 'center' | 'right'
  readonly className?: string
}) {
  return (
    <div
      className={cn(
        'border-rule relative aspect-3/2 w-full overflow-hidden border sm:aspect-video',
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        // Una sola columna de 412 px en todos los breakpoints: pedir una imagen
        // más grande que eso es descargar píxeles que nadie va a ver.
        sizes="(max-width: 412px) 100vw, 412px"
        className={cn(
          'object-cover saturate-85',
          focus === 'left' && 'object-left',
          focus === 'center' && 'object-center',
          focus === 'right' && 'object-right',
        )}
      />
    </div>
  )
}
