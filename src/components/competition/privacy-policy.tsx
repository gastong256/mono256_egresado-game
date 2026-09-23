import type { PrivacyNotice } from '@/lib/competition'

/** Complete configured v1 notice. Legal copy stays in buildPrivacyNotice. */
export function PrivacyPolicy({ notice }: { readonly notice: PrivacyNotice }) {
  return (
    <article className="eg-canvas border-rule flex flex-col gap-6 border p-5 sm:p-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-section font-display text-ink">
          Política de Privacidad
        </h1>
        <p className="text-caption text-ink-label">
          Versión del aviso: {notice.version}
        </p>
        <ul className="text-body text-ink-secondary flex list-disc flex-col gap-2 pl-5">
          {notice.summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </header>
      {notice.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-2">
          <h2 className="text-goal font-display text-ink">{section.heading}</h2>
          {section.body.map((paragraph) => (
            <p
              key={paragraph}
              className="text-body text-ink-secondary text-pretty break-words"
            >
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  )
}
