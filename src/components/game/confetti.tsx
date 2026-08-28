import { cn } from '@/lib/ui/cn'

/**
 * Confeti.
 *
 * Dieciocho tiras de 3×12 px, cuatro colores de la paleta, 1400 ms, escalonadas
 * cada 90 ms. Sin canvas, sin librería y sin un solo asset: es CSS.
 *
 * Las posiciones y los retardos son deterministas —`(i * 37) % 94`— y no
 * aleatorios. No es una manía: el mismo cierre de etapa tiene que verse igual en
 * dos capturas, y una captura de regresión visual con `Math.random()` adentro no
 * sirve para nada.
 *
 * Dispara en cierre de etapa, egreso y Aura de `+1.000`. En ningún otro lugar:
 * el confeti barato es exactamente lo que separa una celebración de un casino.
 *
 * Con `prefers-reduced-motion` la animación dura 1 ms y las tiras desaparecen sin
 * cruzar la pantalla. Nada se pierde: el cierre se entiende por lo que dice.
 */

const COLORS = ['bg-green', 'bg-red', 'bg-ink', 'bg-action'] as const
const STRIPS = 18

export function Confetti({ className }: { readonly className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 overflow-hidden',
        // Con `prefers-reduced-motion` no se dibuja nada: una tira detenida
        // sobre el título no es una celebración discreta, es basura encima del
        // texto. Nada se pierde — el cierre se entiende por lo que dice.
        'motion-reduce:hidden',
        className,
      )}
    >
      {Array.from({ length: STRIPS }, (_, index) => (
        <span
          key={index}
          className={cn(
            'absolute top-0 block h-3 w-[3px]',
            COLORS[index % COLORS.length],
          )}
          style={{
            left: `${String((index * 37) % 94)}%`,
            // `both` y no `forwards`: durante el retardo la tira toma el estado
            // inicial, que está arriba del contenedor y queda clipeado. Con
            // `forwards` sola se veía quieta sobre el título hasta arrancar.
            animation: `eg-fall var(--duration-celebrate) var(--ease-fall) ${String((index % 6) * 90)}ms both`,
          }}
        />
      ))}
    </div>
  )
}
