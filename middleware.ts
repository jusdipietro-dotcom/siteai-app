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

    // Reescribir /{slug} → /s/{slug} internamente (URL del visitante no cambia)
    const slug = pathname.slice(1) // quitar el "/" inicial
    if (slug && !slug.includes('/')) {
      const url = req.nextUrl.clone()
      url.pathname = `/s/${slug}`
      return NextResponse.rewrite(url)
    }

    return NextResponse.next()
  }

  // ── Auth: proteger rutas del dashboard ──────────────────────────────────────
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  if (isProtected) {
    const token = await getToken({ req })
    if (!token) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.href)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  // Aplicar en todas las rutas excepto archivos estáticos
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
