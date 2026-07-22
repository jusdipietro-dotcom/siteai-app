import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { extractSiteSubdomain, isSitesPathHost } from '@/lib/site-domain'
import {
  REQUEST_ID_HEADER,
  resolveRequestId,
  withCorrelationHeaders,
  type ResolvedRequestId,
} from '@/lib/request-id'

// Rutas que requieren autenticación
const PROTECTED_PATHS = [
  '/dashboard',
  '/projects',
  '/wizard',
  '/templates',
  '/media',
  '/settings',
  '/help',
  '/monitoreo',
  '/linkedin',
  '/resenas',
  '/crypto',
  '/leads',
  '/email-marketing',
  '/trading',
  '/facturacion',
  '/causas',
  '/turnos',
  '/suite-juridica',
  '/lexpost',
  '/jurisprudencia',
  '/admin',
]

const STATIC_FILE_RE = /\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|css|js|json|txt|pdf)$/

/** Paths the site-host rewrites must leave untouched. */
function isFrameworkPath(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt'
  )
}

/**
 * Every response leaves here carrying `x-request-id`, so a customer complaint
 * ("no me anda", a screenshot, a support ticket) can be tied to the exact log
 * lines for that request.
 *
 * Applied to EVERY exit — rewrite, redirect and pass-through alike. A redirect
 * to /login is precisely the response somebody complains about, and it must be
 * correlatable too.
 */
export async function middleware(req: NextRequest) {
  const resolved = resolveRequestId(req.headers.get(REQUEST_ID_HEADER))
  const res = await route(req, resolved)
  res.headers.set(REQUEST_ID_HEADER, resolved.id)
  return res
}

/**
 * Forwards the request downstream with the correlation id attached, so
 * `requestLogger()` can find it in the route handler. See lib/request-id.ts for
 * why the inbound `x-request-id` is never rewritten.
 */
function forward(req: NextRequest, resolved: ResolvedRequestId): NextResponse {
  return NextResponse.next({
    request: { headers: withCorrelationHeaders(req.headers, resolved) },
  })
}

async function route(req: NextRequest, resolved: ResolvedRequestId): Promise<NextResponse> {
  const hostname = req.headers.get('host') ?? ''
  const { pathname } = req.nextUrl

  // ── Site routing by subdomain: {sub}.sitios.automaticialab.com → /sub/{sub} ─
  //
  // Host parsing only. The project lookup happens in the route this rewrites
  // to, because middleware runs on the Edge runtime and Prisma does not work
  // there. `extractSiteSubdomain` already normalizes and validates the label,
  // so a malformed or reserved host falls through to the app untouched.
  //
  // Checked before the path-host branch: the bases differ (sitios vs sites) so
  // they cannot both match, but order makes the precedence explicit.
  const siteSubdomain = extractSiteSubdomain(hostname)
  if (siteSubdomain) {
    if (isFrameworkPath(pathname) || (pathname !== '/' && STATIC_FILE_RE.test(pathname))) {
      return forward(req, resolved)
    }

    // "/" → /sub/{sub}; "/sitemap.xml" → /sub/{sub}/sitemap.xml
    const url = req.nextUrl.clone()
    url.pathname = pathname === '/' ? `/sub/${siteSubdomain}` : `/sub/${siteSubdomain}${pathname}`
    return NextResponse.rewrite(url, {
      request: { headers: withCorrelationHeaders(req.headers, resolved) },
    })
  }

  // ── Site routing by path: sites.automaticialab.com/{slug} → /s/{slug} ──────
  if (isSitesPathHost(hostname)) {
    // Dejar pasar internals de Next.js y API routes sin modificar
    if (isFrameworkPath(pathname) || pathname === '/') {
      return forward(req, resolved)
    }

    // Reescribir /{slug} o /{slug}/ruta → /s/{slug} o /s/{slug}/ruta
    // Cubre: /mi-negocio, /mi-negocio/sitemap.xml, etc.
    const segments = pathname.slice(1).split('/')
    const slug = segments[0]
    if (slug) {
      // Archivos estáticos en la raíz (sin slug) pasan sin rewrite
      if (segments.length === 1 && STATIC_FILE_RE.test(slug)) {
        return forward(req, resolved)
      }
      const url = req.nextUrl.clone()
      url.pathname = `/s/${pathname.slice(1)}`
      return NextResponse.rewrite(url, {
        request: { headers: withCorrelationHeaders(req.headers, resolved) },
      })
    }

    return forward(req, resolved)
  }

  // ── Public routes that start with a protected prefix ────────────────────────
  // /turnos/[slug] is the public booking page — must NOT require auth
  const isPublicTurnos = /^\/turnos\/[^/]+/.test(pathname) && pathname !== '/turnos'

  // ── Auth: proteger rutas del dashboard ──────────────────────────────────────
  const isProtected = !isPublicTurnos && PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  if (isProtected) {
    const token = await getToken({ req })
    if (!token) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://automaticialab.com'
      const loginUrl = new URL('/login', baseUrl)
      // Login/register pages read ?next= for product-specific redirects
      if (pathname.startsWith('/monitoreo')) {
        loginUrl.searchParams.set('next', 'monitoreo')
      } else if (pathname.startsWith('/linkedin')) {
        loginUrl.searchParams.set('next', 'linkedin')
      } else if (pathname.startsWith('/resenas')) {
        loginUrl.searchParams.set('next', 'resenas')
      } else if (pathname.startsWith('/crypto')) {
        loginUrl.searchParams.set('next', 'crypto')
      } else if (pathname.startsWith('/facturacion')) {
        loginUrl.searchParams.set('next', 'facturacion')
      } else if (pathname.startsWith('/causas')) {
        loginUrl.searchParams.set('next', 'causas')
      } else if (pathname.startsWith('/turnos')) {
        loginUrl.searchParams.set('next', 'turnos')
      } else if (pathname.startsWith('/suite-juridica')) {
        loginUrl.searchParams.set('next', 'suite-juridica')
      } else if (pathname.startsWith('/lexpost')) {
        loginUrl.searchParams.set('next', 'lexpost')
      } else if (pathname.startsWith('/jurisprudencia')) {
        loginUrl.searchParams.set('next', 'jurisprudencia')
      } else {
        loginUrl.searchParams.set('callbackUrl', `${baseUrl}${req.nextUrl.pathname}`)
      }
      return NextResponse.redirect(loginUrl)
    }
  }

  return forward(req, resolved)
}

export const config = {
  // Aplicar en todas las rutas excepto archivos estáticos
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
