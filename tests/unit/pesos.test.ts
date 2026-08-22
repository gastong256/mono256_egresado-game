import { describe, expect, it } from 'vitest'

import { pesos } from '@/content/pesos'

/**
 * Los precios que ve un estudiante argentino.
 *
 * El motor escribe dinero en forma canónica; esto es lo que se lee en pantalla.
 */
describe('pesos', () => {
  it('separa los miles con punto', () => {
    expect(pesos(2_400_000)).toBe('$ 24.000')
    expect(pesos(90_000)).toBe('$ 900')
    expect(pesos(100_000_000)).toBe('$ 1.000.000')
  })

  it('omite los centavos cuando no los hay', () => {
    expect(pesos(0)).toBe('$ 0')
    expect(pesos(500)).toBe('$ 5')
  })

  it('usa coma decimal cuando hay centavos', () => {
    expect(pesos(1_234)).toBe('$ 12,34')
    expect(pesos(100_050)).toBe('$ 1.000,50')
  })

  it('mantiene el signo adelante', () => {
    expect(pesos(-2_400_000)).toBe('-$ 24.000')
  })

  it('no depende de la locale del dispositivo', () => {
    // `Intl` cambia de máquina a máquina; la salida del juego no puede.
    const original = process.env['LANG']
    process.env['LANG'] = 'en_US.UTF-8'
    expect(pesos(2_400_000)).toBe('$ 24.000')
    if (original === undefined) {
      delete process.env['LANG']
    } else {
      process.env['LANG'] = original
    }
  })
})
