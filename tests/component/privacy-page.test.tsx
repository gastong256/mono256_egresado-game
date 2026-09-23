// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PrivacyPage from '@/app/privacidad/page'
import { readPrivacyNotice } from '@/server/competition/page-data'

vi.mock('@/server/competition/page-data', () => ({
  readPrivacyNotice: vi.fn(),
}))
afterEach(() => vi.resetAllMocks())

describe('página pública de privacidad', () => {
  it('publica el aviso configurado sin identidad ni formularios', () => {
    vi.mocked(readPrivacyNotice).mockReturnValue({
      version: '1',
      summary: ['Resumen configurado'],
      acknowledgement: 'Leí el aviso.',
      sections: [
        {
          heading: 'Responsable',
          body: ['Institución configurada', 'Contacto configurado'],
        },
      ],
    })
    render(<PrivacyPage />)
    for (const text of [
      'Resumen configurado',
      'Institución configurada',
      'Contacto configurado',
      'Versión del aviso: 1',
    ])
      expect(screen.getByText(text)).toBeVisible()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Volver al inicio' }),
    ).toHaveAttribute('href', '/')
  })
  it('sin competencia explica la ausencia del aviso y no inventa un responsable', () => {
    vi.mocked(readPrivacyNotice).mockReturnValue(undefined)
    render(<PrivacyPage />)
    expect(
      screen.getByText(/cuando se configure la competencia/u),
    ).toBeVisible()
    expect(screen.queryByText(/Versión del aviso:/u)).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Probar sin competir' }),
    ).toHaveAttribute('href', '/test')
  })
})
