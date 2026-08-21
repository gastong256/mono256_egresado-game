// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FoundationStatus } from '@/components/foundation-status'

describe('FoundationStatus', () => {
  it('renders an accessible technical-foundation message', () => {
    render(<FoundationStatus />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Egresado' }),
    ).toBeVisible()
    expect(
      screen.getByText(/experiencia de juego todavía no fue implementada/i),
    ).toBeVisible()
    expect(
      screen.getByRole('list', { name: 'Capacidades verificadas' }),
    ).toBeVisible()
  })
})
