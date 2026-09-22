'use client'

import { useId, useState } from 'react'

import type { PrivacyNotice } from '@/lib/competition'

/**
 * El aviso de privacidad, en dos capas.
 *
 * Arriba, tres frases que dicen lo que un chico de trece años necesita saber
 * antes de escribir su nombre: qué se publica, qué no y qué pasa con el
 * documento. Debajo, un `<details>` con el texto completo.
 *
 * La razón de que la capa corta no esté adentro del desplegable es que un aviso
 * que hay que abrir para leer es un aviso que nadie lee, y entonces la
 * información no se dio. La razón de que el texto completo **exista** es que la
 * capa corta no alcanza para decir quién responde, cuánto se conserva y cómo
 * pedir la supresión.
 *
 * `<details>` nativo: teclado, lector de pantalla y estado abierto/cerrado sin
 * una línea de JavaScript ni un `aria-expanded` que se pueda desincronizar.
 */
export function PrivacySummary({
  notice,
  id,
}: {
  readonly notice: PrivacyNotice
  readonly id?: string
}) {
  const headingId = useId()
  const [open, setOpen] = useState(false)

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="bg-canvas-sunken border-ink flex flex-col gap-2 border-l-[3px] px-4 py-[14px]"
    >
      <h3 id={headingId} className="text-goal font-display text-ink">
        Tus datos
      </h3>
      <ul className="text-meta text-ink-secondary flex list-disc flex-col gap-1 pl-4">
        {notice.summary.map((line) => (
          <li key={line} className="text-pretty">
            {line}
          </li>
        ))}
      </ul>

      <details
        open={open}
        onToggle={(event) => {
          setOpen(event.currentTarget.open)
        }}
        className="mt-1"
      >
        <summary className="text-meta font-display text-ink min-h-11 cursor-pointer py-2 underline underline-offset-4">
          Más información
        </summary>
        <div className="mt-2 flex flex-col gap-3">
          {notice.sections.map((section) => (
            <div key={section.heading} className="flex flex-col gap-1">
              <h4 className="text-caption font-display text-ink uppercase">
                {section.heading}
              </h4>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-meta text-ink-secondary text-pretty"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
          <p className="text-caption text-ink-label">
            Versión del aviso: {notice.version}
          </p>
        </div>
      </details>
    </section>
  )
}
