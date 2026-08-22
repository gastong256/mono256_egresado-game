import { cn } from '@/lib/ui/cn'

/**
 * Dato cuantitativo.
 *
 * El contenido más importante de Egresado son los números con los que hay que
 * razonar, y su trabajo es ganarle a la prosa que los rodea. Lo consiguen por
 * tamaño, peso y tinta —no por color—, así que siguen destacándose en escala de
 * grises y para alguien con daltonismo.
 *
 * `tabular-nums` alinea las cifras entre métricas: comparar 28 con 42 en dos
 * cajas contiguas no debería depender de dónde cayó cada dígito.
 */
export function DataMetric({
  label,
  value,
  unit,
  note,
  prominent = false,
  className,
}: {
  readonly label: string
  readonly value: string
  readonly unit?: string
  readonly note?: string
  readonly prominent?: boolean
  readonly className?: string
}) {
  return (
    <div
      className={cn(
        'bg-surface-muted border-line rounded-surface min-w-0 border px-3 py-2.5',
        className,
      )}
    >
      <p className="text-label text-data-label truncate">{label}</p>
      <p
        data-numeric
        className={cn(
          'text-data-foreground mt-0.5 break-words',
          prominent ? 'text-data-xl' : 'text-data',
        )}
      >
        {value}
        {unit === undefined ? null : (
          <span className="text-foreground-muted text-body-sm ml-1 font-normal">
            {unit}
          </span>
        )}
      </p>
      {note === undefined ? null : (
        <p className="text-caption text-foreground-muted mt-0.5">{note}</p>
      )}
    </div>
  )
}

/**
 * Conjunto de datos comparables.
 *
 * Dos columnas desde 360 px: es lo que entra sin que un valor como
 * «6 m × 2,4 m» se parta, y deja los datos lo bastante juntos como para que se
 * lean como un grupo y no como cuatro avisos sueltos.
 */
export function MetricGroup({
  items,
  className,
}: {
  readonly items: readonly {
    label: string
    value: string
    unit?: string
    note?: string
  }[]
  readonly className?: string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'grid gap-2',
        items.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
        className,
      )}
    >
      {items.map((item, index) => (
        <DataMetric
          key={item.label}
          label={item.label}
          value={item.value}
          {...(item.unit === undefined ? {} : { unit: item.unit })}
          {...(item.note === undefined ? {} : { note: item.note })}
          // Un dato impar suelto al final se ve como un error de maquetación;
          // ocupando el ancho entero se lee como parte del mismo grupo.
          {...(items.length % 2 === 1 && index === items.length - 1
            ? { className: 'col-span-full' }
            : {})}
        />
      ))}
    </div>
  )
}

/**
 * Par etiqueta/valor en una línea.
 *
 * Para listas de hechos donde importa recorrerlas de arriba a abajo —los números
 * que explican una consecuencia— y no compararlas de a pares.
 */
export function MetricRows({
  items,
  className,
}: {
  readonly items: readonly { label: string; value: string }[]
  readonly className?: string
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <dl
      className={cn('grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5', className)}
    >
      {items.map((item) => (
        <div key={item.label} className="contents">
          <dt className="text-body-sm text-foreground-muted">{item.label}</dt>
          <dd
            data-numeric
            className="text-body-sm text-data-foreground font-semibold"
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
