import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

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
  '/admin',
]

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') ?? ''
  const { pathname } = req.nextUrl

  // ── Subdomain routing: sites.automaticialab.com/{slug} → /s/{slug} ─────────
  if (hostname === 'sites.automaticialab.com' || hostname.startsWith('sites.automaticialab')) {
    // Dejar pasar internals de Next.js y API routes sin modificar
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname === '/favicon.ico' ||
      pathname === '/'
    ) {
      return NextResponse.next()
    }

    // Reescribir /{slug} o /{slug}/ruta → /s/{slug} o /s/{slug}/ruta
    // Cubre: /mi-negocio, /mi-negocio/sitemap.xml, etc.
    const segments = pathname.slice(1).split('/')
    const slug = segments[0]
    if (slug) {
      // Archivos estáticos en la raíz (sin slug) pasan sin rewrite
      if (segments.length === 1 && /\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|css|js|json|txt|pdf)$/.test(slug)) {
        return NextResponse.next()
      }
      const url = req.nextUrl.clone()
      url.pathname = `/s/${pathname.slice(1)}`
      return NextResponse.rewrite(url)
    }

    return NextResponse.next()
  }

  // ── Auth: proteger rutas del dashboard ──────────────────────────────────────
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
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
      } else {
        loginUrl.searchParams.set('callbackUrl', `${baseUrl}${req.nextUrl.pathname}`)
      }
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  // Aplicar en todas las rutas excepto archivos estáticos
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
