import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { STOCK_FETCH_UA } from '@/lib/stock-images'

/*
  Stock-photo search, proxied through us.

  Server-side for two reasons: the Pexels key must never reach the browser, and
  the app's CSP `connect-src` does not include Pexels — a fetch from the editor
  would simply be blocked. The browser only ever talks to 'self'.

  Displaying the results needs no CSP change: `img-src` already allows https:.
*/

const PEXELS_SEARCH = 'https://api.pexels.com/v1/search'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const key = process.env.PEXELS_API_KEY
  if (!key) {
    // Explicit, not a generic 500: this is a deployment gap, and the editor
    // shows the message as-is so the owner is not left staring at a spinner.
    return NextResponse.json(
      { error: 'El banco de imágenes todavía no está configurado.' },
      { status: 503 }
    )
  }

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (!q) {
    return NextResponse.json({ error: 'Falta el término de búsqueda' }, { status: 400 })
  }

  const perPage = Math.min(Math.max(Number(req.nextUrl.searchParams.get('per_page')) || 24, 1), 40)
  const page = Math.max(Number(req.nextUrl.searchParams.get('page')) || 1, 1)
  const orientation = req.nextUrl.searchParams.get('orientation') === 'square' ? 'square' : 'landscape'

  try {
    const url =
      `${PEXELS_SEARCH}?query=${encodeURIComponent(q)}` +
      `&per_page=${perPage}&page=${page}&orientation=${orientation}`

    const res = await fetch(url, {
      headers: {
        Authorization: key,
        Accept: 'application/json',
        // Not optional: without it Cloudflare 403s a valid key. See STOCK_FETCH_UA.
        'User-Agent': STOCK_FETCH_UA,
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      console.error('[stock-images] pexels HTTP', res.status)
      return NextResponse.json(
        { error: 'No se pudo consultar el banco de imágenes. Intentá de nuevo.' },
        { status: 502 }
      )
    }

    const data = await res.json()

    // Only the fields the picker needs. `src` is what /import will fetch, and
    // that endpoint re-validates the host rather than trusting this shape.
    const photos = (Array.isArray(data.photos) ? data.photos : []).map((p: any) => ({
      id: String(p.id),
      thumb: p.src?.medium ?? p.src?.small ?? p.src?.tiny,
      src: p.src?.large ?? p.src?.large2x ?? p.src?.original,
      alt: p.alt || q,
      photographer: p.photographer ?? '',
    }))

    return NextResponse.json({ photos, total: data.total_results ?? photos.length })
  } catch (err) {
    console.error('[stock-images]', err)
    return NextResponse.json(
      { error: 'No se pudo consultar el banco de imágenes. Intentá de nuevo.' },
      { status: 502 }
    )
  }
}
