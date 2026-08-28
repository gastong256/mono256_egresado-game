import { cn } from '@/lib/ui/cn'

/**
 * Caja de dato.
 *
 * El contenido más importante de Egresado son los números con los que hay que
 * razonar, y su trabajo es ganarle a la prosa que los rodea. Lo consiguen por
 * fondo, borde, tamaño y peso —no por color—, así que siguen destacándose en
 * escala de grises y para alguien con daltonismo.
 *
 * La caja se apoya *sobre* la cuadrícula con fondo liso y borde de tinta de
 * 1,5 px: eso es lo que la hace leer como objeto y no como párrafo.
 *
 * `tabular-nums` alinea las cifras entre cajas: comparar 28 con 42 en dos cajas
 * contiguas no debería depender de dónde cayó cada dígito.
 */
export function DataMetric({
  label,
  value,
  unit,
  constraint = false,
  span = 1,
  className,
}: {
  readonly label: string
  readonly value: string
  readonly unit?: string
  /**
   * Este dato **es** la restricción de la pantalla.
   *
   * Lleva subrayado rojo de 3 px, y el subrayado abraza la cifra en lugar de
   * cruzar la celda: la marca cae sobre el dato, nunca en un marco alrededor.
   * Es rojo *antes* de que el jugador haga nada — es tensión, no error.
   */
  readonly constraint?: boolean
  readonly span?: 1 | 2
  readonly className?: string
}) {
  return (
    <div
      className={cn(
        'bg-surface border-ink flex min-w-0 flex-col gap-[3px] border-[1.5px] px-[11px] py-[10px]',
        span === 2 && 'col-span-2',
        className,
      )}
    >
      <span className="text-label font-display text-ink-label uppercase">
        {label}
      </span>
      <span
        data-numeric
        className={cn(
          'text-data-lg font-display text-ink self-start',
          constraint && 'border-red border-b-[3px] pb-0.5',
        )}
      >
        {value}
      </span>
      {unit === undefined ? null : (
        <span className="font-display text-ink-label text-[10px] font-semibold">
          {unit}
        </span>
      )}
    </div>
  )
}

export interface DataGridItem {
  readonly label: string
  readonly value: string
  readonly unit?: string
  readonly constraint?: boolean
  readonly span?: 1 | 2
}

/**
 * Conjunto de datos comparables.
 *
 * Dos columnas siempre, con gap de 8 px. Un dato impar suelto al final ocupa el
 * ancho entero: se lee como parte del mismo grupo en vez de como un error de
 * maquetación — y, cuando ese dato es la restricción, ocupar las dos columnas es
 * exactamente lo que lo hace leer como el límite del que trata la pantalla.
 */
export function DataGrid({
  items,
  className,
}: {
  readonly items: readonly DataGridItem[]
  readonly className?: string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {items.map((item, index) => (
        <DataMetric
          key={item.label}
          label={item.label}
          value={item.value}
          {...(item.unit === undefined ? {} : { unit: item.unit })}
          {...(item.constraint === undefined
            ? {}
            : { constraint: item.constraint })}
          span={
            item.span ??
            (items.length % 2 === 1 && index === items.length - 1 ? 2 : 1)
          }
        />
      ))}
    </div>
  )
}

/**
 * Ledger: la cuenta real.
 *
 * El panel de resultado **siempre** muestra la aritmética que llevó a la
 * consecuencia. El jugador tiene que poder ver el por qué, no sólo el veredicto:
 * ésa es la diferencia entre un juego sobre decisiones con números y un examen
 * con animaciones.
 *
 * Los renglones son una `<dl>` con separadores de 1 px hechos con `gap` sobre un
 * fondo de regla, así que no hay un borde que se duplique en el último renglón.
 */
export function Ledger({
  items,
  className,
}: {
  readonly items: readonly { readonly label: string; readonly value: string }[]
  readonly className?: string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <dl
      className={cn(
        'bg-rule border-rule flex flex-col gap-px border',
        className,
      )}
      data-testid="ledger"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-surface flex justify-between gap-3 px-[10px] py-2"
        >
          <dt className="text-meta text-ink-secondary">{item.label}</dt>
          <dd
            data-numeric
            className="text-ledger font-display text-ink text-right"
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Renglón de registro del cierre de etapa.
 *
 * Etiqueta en versalitas a la izquierda, cifra grande a la derecha, filete de
 * 1 px debajo. Es el mismo gesto de un boletín, y por eso el cierre se lee como
 * un cierre sin necesitar un marco.
 */
export function RecordRow({
  label,
  value,
  last = false,
}: {
  readonly label: string
  readonly value: string
  readonly last?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-3 py-2',
        last ? '' : 'border-rule-soft border-b',
      )}
    >
      <span className="font-display text-ink-label text-[10.5px] font-semibold tracking-[0.1em] uppercase">
        {label}
      </span>
      <span data-numeric className="text-data-lg font-display text-ink">
        {value}
      </span>
    </div>
  )
}
