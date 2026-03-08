import { NextRequest, NextResponse } from 'next/server'

// Proxy for Pollinations.ai — avoids browser-side CORS/CSP restrictions
export async function GET(req: NextRequest) {
  const prompt = req.nextUrl.searchParams.get('prompt')
  const seed = req.nextUrl.searchParams.get('seed') ?? '0'
  const w = req.nextUrl.searchParams.get('w') ?? '1280'
  const h = req.nextUrl.searchParams.get('h') ?? '720'

  if (!prompt) return new NextResponse(null, { status: 400 })

  const pollinationsUrl =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=${w}&height=${h}&nologo=true&model=flux&seed=${seed}&private=false`

  try {
    const res = await fetch(pollinationsUrl, {
      signal: AbortSignal.timeout(120_000),
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })

    if (!res.ok) {
      console.error('[ai-image] Pollinations error', res.status)
      return new NextResponse(null, { status: 502 })
    }

    const contentType = res.headers.get('Content-Type') ?? ''
    if (!contentType.startsWith('image/')) {
      console.error('[ai-image] Non-image response:', contentType)
      return new NextResponse(null, { status: 502 })
    }

    const buffer = await res.arrayBuffer()
    if (buffer.byteLength === 0) {
      console.error('[ai-image] Empty response body')
      return new NextResponse(null, { status: 502 })
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch (err) {
    console.error('[ai-image] fetch error', err)
    return new NextResponse(null, { status: 504 })
  }
}
