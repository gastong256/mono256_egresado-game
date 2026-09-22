/**
 * Los encabezados de seguridad, escritos contra lo que la aplicación carga.
 *
 * La lista no es la que se copia de un artículo: cada directiva corresponde a
 * un recurso que este producto usa o a uno que decidió no usar, y eso es lo que
 * la hace verificable. Tres hechos la determinan:
 *
 * 1. **El navegador no habla con nadie más que con este origen.** Todo el
 *    acceso a datos pasa por el BFF (`/api/…`); el cliente publicable de
 *    Supabase existe en el repositorio y ninguna pantalla lo usa. Por eso
 *    `connect-src 'self'` puede ser estricto, y por eso es la directiva que más
 *    aporta: cierra el camino por el que un script inyectado exfiltraría datos.
 * 2. **Las fuentes son locales.** `next/font/local` las sirve desde
 *    `/_next/static/media`, así que no hace falta abrir `fonts.gstatic.com` ni
 *    ningún otro origen.
 * 3. **No hay HTML controlado por el usuario.** No existe un solo
 *    `dangerouslySetInnerHTML`; el único texto de una persona —el alias— se
 *    renderiza como texto.
 *
 * `style-src` sí admite `'unsafe-inline'`, y es deliberado: React escribe
 * atributos `style` —las grillas de la agenda y del plano calculan columnas— y
 * un atributo de estilo cae bajo esa directiva. Restringirlo obligaría a
 * reescribir esas interacciones el mismo día que el producto se congela, a
 * cambio de cerrar un vector —inyección de estilos— mucho más débil que el de
 * script, que sí queda cerrado con nonce.
 */

export interface ContentSecurityPolicyOptions {
  /** Nonce por pedido. Sin él, `script-src` no admitiría los scripts de Next. */
  readonly nonce?: string
  /**
   * React usa `eval` en desarrollo para reconstruir stacks del servidor en el
   * navegador. En producción no lo usa, y abrirlo «por las dudas» sería
   * devolver exactamente lo que el nonce acaba de ganar.
   */
  readonly development?: boolean
}

export function contentSecurityPolicy(
  options: ContentSecurityPolicyOptions = {},
): string {
  const script = [
    "'self'",
    ...(options.nonce === undefined ? [] : [`'nonce-${options.nonce}'`]),
    // Con `strict-dynamic`, un script que ya pasó el nonce puede cargar los
    // chunks que Next pide después sin que haya que enumerarlos.
    "'strict-dynamic'",
    ...(options.development === true ? ["'unsafe-eval'"] : []),
  ].join(' ')

  return [
    "default-src 'self'",
    `script-src ${script}`,
    "style-src 'self' 'unsafe-inline'",
    // `data:` cubre los placeholders de `next/image`; `blob:` no hace falta.
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "media-src 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "worker-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(options.development === true ? [] : ['upgrade-insecure-requests']),
  ].join('; ')
}

/**
 * Los encabezados que no dependen del pedido.
 *
 * `Strict-Transport-Security` sólo se emite en producción: un `localhost` que
 * la reciba queda fijado a HTTPS en el navegador de quien desarrolla, y
 * deshacerlo exige entrar a la configuración interna del navegador.
 * `preload` **no** está: entrar a la lista precargada es una decisión del dominio
 * y prácticamente irreversible, así que la toma quien opera el dominio, no un
 * archivo de configuración.
 */
export function staticSecurityHeaders(
  options: { readonly production?: boolean } = {},
): readonly { readonly key: string; readonly value: string }[] {
  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value:
        'camera=(), geolocation=(), microphone=(), payment=(), usb=(), interest-cohort=()',
    },
    // El equivalente heredado de `frame-ancestors`, para navegadores que no
    // implementan la directiva. No se contradicen: los dos dicen que no.
    { key: 'X-Frame-Options', value: 'DENY' },
    ...(options.production === true
      ? [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
        ]
      : []),
  ]
}
