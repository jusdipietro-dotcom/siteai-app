import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

// Proxy for Pollinations.ai — avoids browser-side CORS/CSP restrictions.
// Gated: an unauthenticated, unlimited proxy to an expensive upstream (retries
// with long timeouts, full response buffered in memory) is a cost/DoS vector.
// Every other AI/media route requires a session; so does this now.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const rl = checkRateLimit(`ai-image:${session.user.id}`, { maxRequests: 15, windowSeconds: 60 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Esperá un momento.' }, { status: 429 })
  }

  const prompt = req.nextUrl.searchParams.get('prompt')
  const seed = String(parseInt(req.nextUrl.searchParams.get('seed') ?? '0', 10) || 0)
  // Clamp dimensions — these go straight into the upstream URL, never trust raw.
  const w = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('w') ?? '1280', 10) || 1280, 64), 2048)
  const h = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('h') ?? '720', 10) || 720, 64), 2048)

  if (!prompt || prompt.length > 800) return new NextResponse(null, { status: 400 })

  const pollinationsUrl =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=${w}&height=${h}&nologo=true&model=flux&seed=${seed}&private=true`

  const MAX_RETRIES = 2
  let lastError = ''

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // Variar seed en cada reintento para evitar combinaciones (prompt, seed) que Pollinations rechaza
    const currentSeed = parseInt(seed) + (attempt - 1) * 1000
    const urlForAttempt =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?width=${w}&height=${h}&nologo=true&model=flux&seed=${currentSeed}&private=true`

    try {
      const res = await fetch(urlForAttempt, {
        signal: AbortSignal.timeout(30_000),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })

      if (!res.ok) {
        lastError = `Pollinations HTTP ${res.status}`
        console.warn(`[ai-image] attempt ${attempt} — ${lastError}`)
        await new Promise((r) => setTimeout(r, attempt * 2000))
        continue
      }

      const contentType = res.headers.get('Content-Type') ?? ''
      if (!contentType.startsWith('image/')) {
        lastError = `Non-image content-type: ${contentType}`
        console.warn(`[ai-image] attempt ${attempt} — ${lastError}`)
        await new Promise((r) => setTimeout(r, attempt * 2000))
        continue
      }

      const buffer = await res.arrayBuffer()
      if (buffer.byteLength === 0) {
        lastError = 'Empty body'
        console.warn(`[ai-image] attempt ${attempt} — ${lastError}`)
        await new Promise((r) => setTimeout(r, attempt * 2000))
        continue
      }

      console.log(`[ai-image] OK on attempt ${attempt}`)
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, immutable',
        },
      })
    } catch (err) {
      lastError = String(err)
      console.warn(`[ai-image] attempt ${attempt} — fetch error:`, err)
      if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, attempt * 2000))
    }
  }

  console.error('[ai-image] All retries failed:', lastError)
  return new NextResponse(null, { status: 502 })
}
