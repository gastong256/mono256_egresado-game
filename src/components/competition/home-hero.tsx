import { cn } from '@/lib/ui/cn'

/**
 * El hero de la portada.
 *
 * La ilustración aprobada del recorrido: la entrada a la escuela a la
 * izquierda, el grupo y la mano que ayuda en el medio, el egreso arriba a la
 * derecha. Es el mundo de Egresado al lado de la marca, y por eso vive en la
 * fila completa bajo la promesa y el acceso: el recorrido se ve de lado a lado.
 *
 * Se sirve como `<img>` con `srcset` sobre dos WebP ya optimizados (800 y
 * 1200 px) en lugar de `next/image`: con `unoptimized` —lo que este despliegue
 * sin costo usa— `next/image` no genera `srcset`, y sin él un teléfono a
 * 320 px bajaría el archivo de escritorio. El navegador elige el archivo
 * según el ancho del contenedor y la densidad de pantalla.
 *
 * Caja 16:9 con `aspect-ratio` y `width`/`height` intrínsecos: el espacio
 * queda reservado antes de que llegue un byte, así que no hay salto de layout.
 * Sin recorte en ningún ancho: la trayectoria va de un borde al otro y cortar
 * el inicio o el egreso la dejaría sin sentido. `fetchpriority="high"` porque
 * en escritorio es la pintura más grande de la primera pantalla.
 *
 * `alt=""`: el eyebrow, el título, la promesa y la línea «7.º → … → Egreso»
 * ya cuentan lo que la ilustración muestra; describirla a un lector de
 * pantalla duplicaría el texto de al lado.
 */
const HERO = {
  src: '/assets/brand/egresado-hero-1200.webp',
  srcSet:
    '/assets/brand/egresado-hero-800.webp 800w, /assets/brand/egresado-hero-1200.webp 1200w',
  width: 1200,
  height: 675,
  // Portada de 60rem menos padding del panel; nunca media columna.
  sizes:
    '(min-width: 64rem) 56rem, (min-width: 40rem) calc(100vw - 6rem), calc(100vw - 4rem)',
} as const

export function HomeHero({ className }: { readonly className?: string }) {
  return (
    <div
      data-testid="home-hero"
      className={cn(
        'border-rule aspect-video w-full overflow-hidden border',
        className,
      )}
    >
      <picture>
        <img
          src={HERO.src}
          srcSet={HERO.srcSet}
          sizes={HERO.sizes}
          width={HERO.width}
          height={HERO.height}
          alt=""
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
      </picture>
    </div>
  )
}
