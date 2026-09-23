import { NextResponse, type NextRequest } from 'next/server'

import { contentSecurityPolicy } from '@/lib/ui/security-headers'

/**
 * El nonce de la política de contenido.
 *
 * Next escribe scripts en línea —el payload de React Server Components va
 * dentro de `<script>self.__next_f.push(...)</script>`—, así que un
 * `script-src 'self'` a secas rompería la aplicación entera. Las dos salidas
 * son `'unsafe-inline'`, que desactiva la protección que la directiva existe
 * para dar, y un nonce por pedido, que es esto.
 *
 * El mecanismo es el documentado: el proxy genera el nonce, lo pone en el
 * encabezado de **pedido**, y Next lo lee de ahí y se lo estampa a sus propios
 * scripts. Por eso el nonce va en dos lados —pedido y respuesta— y por eso el
 * valor tiene que ser distinto en cada pedido: un nonce predecible es un
 * `'unsafe-inline'` con más pasos.
 *
 * ## Por qué el matcher es positivo
 *
 * Sólo los documentos que se renderizan por pedido necesitan nonce, y en esta
 * aplicación son todos los que tienen HTML propio: `/`, `/test`, `/privacidad`, `/puntajes`, `/organizer` y `/dev`.
 * Una respuesta JSON de `/api` no ejecuta scripts, y un `.js` de
 * `/_next/static` es un recurso, no un documento. Poner el proxy delante de
 * todo eso agregaría una función serverless por cada archivo estático a cambio
 * de nada.
 *
 * Lo que queda fuera del matcher no queda sin política: `next.config.ts` fija
 * los encabezados de base para **todas** las rutas, nonce aparte.
 */
export function proxy(request: NextRequest): NextResponse {
  const nonce = crypto.randomUUID().replaceAll('-', '')
  const policy = contentSecurityPolicy({
    nonce,
    development: process.env.NODE_ENV === 'development',
  })

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', policy)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', policy)
  return response
}

export const config = {
  matcher: [
    '/',
    '/test',
    '/privacidad',
    '/puntajes',
    '/organizer',
    '/dev/:path*',
  ],
}
