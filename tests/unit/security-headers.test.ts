import { describe, expect, it } from 'vitest'

import {
  contentSecurityPolicy,
  staticSecurityHeaders,
} from '@/lib/ui/security-headers'

/**
 * Los encabezados de seguridad, como contrato estable.
 *
 * Una política de contenido se rompe en silencio: el navegador bloquea un
 * recurso, la página se dibuja a medias y nadie ve un error en el servidor. Por
 * eso lo que se fija acá no es «que exista un CSP» sino **cada directiva**, con
 * la razón por la que está o no está. Aflojar una tiene que costar editar este
 * archivo, que es donde se lee por qué estaba.
 *
 * Lo que este archivo **no** puede probar es que la política no rompa la
 * aplicación: eso lo prueba la suite de navegador, que la carga de verdad.
 */

function directives(policy: string): Map<string, string> {
  return new Map(
    policy.split('; ').map((directive) => {
      const [name = '', ...rest] = directive.split(' ')
      return [name, rest.join(' ')]
    }),
  )
}

describe('política de contenido', () => {
  const policy = contentSecurityPolicy({ nonce: 'abc123' })
  const parsed = directives(policy)

  it('cierra por defecto y sólo abre este origen', () => {
    expect(parsed.get('default-src')).toBe("'self'")
  })

  it('admite scripts por nonce, nunca por `unsafe-inline`', () => {
    const script = parsed.get('script-src') ?? ''
    expect(script).toContain("'nonce-abc123'")
    expect(script).toContain("'strict-dynamic'")
    expect(script).not.toContain("'unsafe-inline'")
    expect(script).not.toContain("'unsafe-eval'")
  })

  it('sin nonce no inventa una alternativa permisiva', () => {
    // Si algún día el proxy dejara de correr, la política resultante tiene que
    // romper la página de forma visible, no degradarse a `unsafe-inline` y
    // seguir sirviendo sin protección.
    const script = directives(contentSecurityPolicy()).get('script-src') ?? ''
    expect(script).not.toContain('nonce-')
    expect(script).not.toContain("'unsafe-inline'")
  })

  it('abre `unsafe-eval` sólo en desarrollo, donde React lo usa', () => {
    expect(
      directives(contentSecurityPolicy({ development: true })).get(
        'script-src',
      ),
    ).toContain("'unsafe-eval'")
    expect(parsed.get('script-src')).not.toContain("'unsafe-eval'")
  })

  it('admite estilos en línea, que es lo que React escribe en las grillas', () => {
    expect(parsed.get('style-src')).toBe("'self' 'unsafe-inline'")
  })

  it('no deja salir un pedido a otro origen', () => {
    // La directiva que de verdad importa: cierra el camino por el que un script
    // inyectado exfiltraría un nombre o un documento. El navegador nunca habla
    // con Supabase — todo el acceso a datos pasa por `/api`.
    expect(parsed.get('connect-src')).toBe("'self'")
  })

  it('sirve las fuentes desde este origen y ninguna CDN', () => {
    expect(parsed.get('font-src')).toBe("'self'")
  })

  it('no admite objetos, marcos ni medios', () => {
    expect(parsed.get('object-src')).toBe("'none'")
    expect(parsed.get('frame-src')).toBe("'none'")
    expect(parsed.get('media-src')).toBe("'none'")
  })

  it('impide el enmarcado y la reescritura de la base', () => {
    expect(parsed.get('frame-ancestors')).toBe("'none'")
    expect(parsed.get('base-uri')).toBe("'self'")
    expect(parsed.get('form-action')).toBe("'self'")
  })

  it('fuerza https en producción y no en desarrollo', () => {
    expect(policy).toContain('upgrade-insecure-requests')
    expect(contentSecurityPolicy({ development: true })).not.toContain(
      'upgrade-insecure-requests',
    )
  })

  it('cambia con el nonce, que es lo que lo hace servir para algo', () => {
    expect(contentSecurityPolicy({ nonce: 'uno' })).not.toBe(
      contentSecurityPolicy({ nonce: 'dos' }),
    )
  })
})

describe('encabezados que no dependen del pedido', () => {
  const production = new Map(
    staticSecurityHeaders({ production: true }).map((header) => [
      header.key,
      header.value,
    ]),
  )
  const local = new Map(
    staticSecurityHeaders().map((header) => [header.key, header.value]),
  )

  it('impide el sniffing de tipo', () => {
    expect(production.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('no filtra la ruta completa a otro origen', () => {
    expect(production.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin',
    )
  })

  it('apaga las APIs de dispositivo que el juego no usa', () => {
    const value = production.get('Permissions-Policy') ?? ''
    for (const feature of ['camera', 'geolocation', 'microphone', 'payment']) {
      expect(value).toContain(`${feature}=()`)
    }
  })

  it('niega el enmarcado también por el encabezado heredado', () => {
    expect(production.get('X-Frame-Options')).toBe('DENY')
  })

  it('emite HSTS sólo en producción', () => {
    expect(production.get('Strict-Transport-Security')).toBe(
      'max-age=63072000; includeSubDomains',
    )
    expect(local.has('Strict-Transport-Security')).toBe(false)
  })

  it('no pide `preload`, que es una decisión del dominio y no del código', () => {
    expect(production.get('Strict-Transport-Security')).not.toContain('preload')
  })
})
